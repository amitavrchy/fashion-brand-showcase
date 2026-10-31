import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminGuard } from './auth.js';
import { JournalDto, LookbookDto, SettingsDto, StoreDto } from './dto.js';
import { PaymentsService } from './payments.service.js';

export const mediaDirectory = resolve(
  process.env.MEDIA_DIRECTORY || '.data/uploads',
);
@Controller()
export class PublicContentController {
  constructor(@Inject(PrismaService) private db: PrismaService) {}
  @Get('settings') settings() {
    return this.db.siteSettings.findUniqueOrThrow({ where: { id: 'main' } });
  }
}
@Controller('admin')
@UseGuards(AdminGuard)
export class ContentController {
  constructor(
    @Inject(PrismaService) private db: PrismaService,
    @Inject(PaymentsService) private payments: PaymentsService,
  ) {}
  @Get('content') async content() {
    const [journal, lookbooks, stores, settings, subscribers] =
      await Promise.all([
        this.db.journalPost.findMany({ orderBy: { publishedAt: 'desc' } }),
        this.db.lookbook.findMany({
          include: {
            chapters: {
              orderBy: { sortOrder: 'asc' },
              include: { hotspots: true },
            },
          },
          orderBy: { title: 'asc' },
        }),
        this.db.store.findMany({ orderBy: { city: 'asc' } }),
        this.db.siteSettings.findUniqueOrThrow({ where: { id: 'main' } }),
        this.db.newsletterSubscriber.findMany({
          orderBy: { createdAt: 'desc' },
          take: 1000,
        }),
      ]);
    return { journal, lookbooks, stores, settings, subscribers };
  }
  @Post('journal') createJournal(@Body() dto: JournalDto) {
    return this.db.journalPost.create({ data: dto });
  }
  @Put('journal/:id') updateJournal(
    @Param('id') id: string,
    @Body() dto: JournalDto,
  ) {
    return this.db.journalPost.update({ where: { id }, data: dto });
  }
  @Delete('journal/:id') deleteJournal(@Param('id') id: string) {
    return this.db.journalPost.delete({ where: { id } });
  }
  @Post('stores') createStore(@Body() dto: StoreDto) {
    return this.db.store.create({ data: dto });
  }
  @Put('stores/:id') updateStore(
    @Param('id') id: string,
    @Body() dto: StoreDto,
  ) {
    return this.db.store.update({ where: { id }, data: dto });
  }
  @Delete('stores/:id') deleteStore(@Param('id') id: string) {
    return this.db.store.delete({ where: { id } });
  }
  @Put('settings') updateSettings(@Body() dto: SettingsDto) {
    return this.db.siteSettings.update({ where: { id: 'main' }, data: dto });
  }
  private async saveLookbook(dto: LookbookDto, id?: string) {
    const { chapters, ...fields } = dto;
    const productIds = [
      ...new Set(chapters.flatMap((c) => c.hotspots.map((h) => h.productId))),
    ];
    if (
      (await this.db.product.count({ where: { id: { in: productIds } } })) !==
      productIds.length
    )
      throw new BadRequestException(
        'Choose an existing product for each hotspot.',
      );
    return this.db.$transaction(async (tx) => {
      if (id) {
        if (!(await tx.lookbook.findUnique({ where: { id } })))
          throw new NotFoundException('Lookbook could not be found.');
        await tx.lookChapter.deleteMany({ where: { lookbookId: id } });
      }
      const data = {
        ...fields,
        chapters: {
          create: chapters.map((chapter, index) => ({
            imageUrl: chapter.imageUrl,
            caption: chapter.caption,
            sortOrder: index,
            hotspots: { create: chapter.hotspots },
          })),
        },
      };
      return id
        ? tx.lookbook.update({ where: { id }, data })
        : tx.lookbook.create({ data });
    });
  }
  @Post('lookbooks') createLookbook(@Body() dto: LookbookDto) {
    return this.saveLookbook(dto);
  }
  @Put('lookbooks/:id') updateLookbook(
    @Param('id') id: string,
    @Body() dto: LookbookDto,
  ) {
    return this.saveLookbook(dto, id);
  }
  @Delete('lookbooks/:id') deleteLookbook(@Param('id') id: string) {
    return this.db.lookbook.delete({ where: { id } });
  }
  @Post('orders/:id/ship') async ship(@Param('id') id: string) {
    const changed = await this.db.order.updateMany({
      where: { id, status: 'PAID' },
      data: { status: 'SHIPPED' },
    });
    if (!changed.count)
      throw new ConflictException(
        'Only a confirmed paid order can be marked shipped.',
      );
    return this.db.order.findUniqueOrThrow({ where: { id } });
  }
  @Post('orders/:id/cancel') cancel(@Param('id') id: string) {
    return this.payments.cancelAsAdmin(id);
  }
  @Post('media')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    }),
  )
  async upload(@UploadedFile() file?: { buffer: Buffer; mimetype: string }) {
    if (
      !file ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
    )
      throw new BadRequestException(
        'Choose a JPEG, PNG or WebP image up to 8 MB.',
      );
    let data: Buffer;
    try {
      const image = sharp(file.buffer, { limitInputPixels: 40_000_000 });
      const meta = await image.metadata();
      if (
        !['jpeg', 'png', 'webp'].includes(meta.format || '') ||
        (meta.width || 0) < 400 ||
        (meta.height || 0) < 400 ||
        (meta.pages || 1) > 1
      )
        throw new Error('Invalid photograph');
      data = await image
        .rotate()
        .resize({
          width: 2000,
          height: 2400,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'Use a valid still photograph at least 400 × 400 pixels.',
      );
    }
    await mkdir(mediaDirectory, { recursive: true });
    const filename = `${randomUUID()}.webp`;
    await writeFile(resolve(mediaDirectory, filename), data);
    const metadata = await sharp(data).metadata();
    return {
      url: `/api/media/${filename}`,
      width: metadata.width,
      height: metadata.height,
    };
  }
}
