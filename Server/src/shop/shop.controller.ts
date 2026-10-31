import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AdminGuard,
  publicUser,
  SessionGuard,
  SessionService,
} from './auth.js';
import type { AuthRequest } from './auth.js';
import {
  CampaignDto,
  CollectionDto,
  EmailDto,
  LoginDto,
  OrderDto,
  ProductDto,
  RegisterDto,
} from './dto.js';
import { productInclude, ShopService } from './shop.service.js';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class ShopController {
  constructor(
    @Inject(PrismaService) private db: PrismaService,
    @Inject(ShopService) private shop: ShopService,
    @Inject(JwtService) private jwt: JwtService,
    @Inject(SessionService) private session: SessionService,
  ) {}
  @Get('health') health() {
    return { status: 'ok', service: 'atelier-lune' };
  }
  @Get('catalog') catalog() {
    return this.shop.catalog();
  }
  @Get('products/:slug') async product(@Param('slug') slug: string) {
    const product = await this.db.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product?.published)
      throw new NotFoundException('This piece could not be found.');
    return product;
  }
  @Get('lookbooks/:slug') async lookbook(@Param('slug') slug: string) {
    const lookbook = await this.db.lookbook.findUnique({
      where: { slug },
      include: {
        chapters: {
          orderBy: { sortOrder: 'asc' },
          include: {
            hotspots: { include: { product: { include: productInclude } } },
          },
        },
      },
    });
    if (!lookbook) throw new NotFoundException('Lookbook not found.');
    return {
      ...lookbook,
      chapters: lookbook.chapters.map((c) => ({
        ...c,
        hotspots: c.hotspots.filter((h) => h.product.published),
      })),
    };
  }
  @Get('stores') stores() {
    return this.db.store.findMany({ orderBy: { city: 'asc' } });
  }
  @Get('journal') journal() {
    return this.db.journalPost.findMany({
      where: { publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' },
    });
  }
  @Get('journal/:slug') async article(@Param('slug') slug: string) {
    const post = await this.db.journalPost.findUnique({ where: { slug } });
    if (!post || post.publishedAt > new Date())
      throw new NotFoundException('Article not found.');
    return post;
  }
  @Post('newsletter')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async newsletter(@Body() dto: EmailDto) {
    await this.db.newsletterSubscriber.upsert({
      where: { email: dto.email.toLowerCase() },
      create: { email: dto.email.toLowerCase() },
      update: {},
    });
    return {
      message: 'You’re on the list. A little inspiration, from time to time.',
    };
  }
  private async signIn(
    user: { id: string; email: string; name: string; role: string },
    res: Response,
  ) {
    const token = await this.jwt.signAsync({ sub: user.id });
    res.cookie('lune_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return user;
  }
  @Post('auth/register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = await this.db.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          name: dto.name.trim(),
          passwordHash: await bcrypt.hash(dto.password, 12),
        },
        select: publicUser,
      });
      return this.signIn(user, res);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        throw new ConflictException(
          'An account with this email already exists. Please sign in.',
        );
      throw e;
    }
  }
  @Post('auth/login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.db.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    const valid = await bcrypt.compare(
      dto.password,
      user?.passwordHash ??
        '$2b$12$JZyBS0kGZhN33CzRQqszP.khjZPkbIr2JfJl6B77S8ZXj.BnMHWaG',
    );
    if (!user || !valid)
      throw new UnauthorizedException('Email or password is incorrect.');
    const { passwordHash: _, ...safe } = user;
    return this.signIn(safe, res);
  }
  @Post('auth/logout') @HttpCode(200) logout(
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('lune_session', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return { success: true };
  }
  @Get('auth/me') me(@Req() req: Request) {
    return this.session.user(req);
  }
  @Get('wishlist') @UseGuards(SessionGuard) async wishlist(
    @Req() req: AuthRequest,
  ) {
    const items = await this.db.wishlistItem.findMany({
      where: { userId: req.user.id, product: { published: true } },
      include: { product: { include: productInclude } },
    });
    return items.map((i) => i.product);
  }
  @Put('wishlist/:productId') @UseGuards(SessionGuard) async addWish(
    @Req() req: AuthRequest,
    @Param('productId') productId: string,
  ) {
    if (
      !(await this.db.product.findFirst({
        where: { id: productId, published: true },
      }))
    )
      throw new NotFoundException('Product not found.');
    return this.db.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      create: { userId: req.user.id, productId },
      update: {},
    });
  }
  @Delete('wishlist/:productId') @UseGuards(SessionGuard) removeWish(
    @Req() req: AuthRequest,
    @Param('productId') productId: string,
  ) {
    return this.db.wishlistItem.deleteMany({
      where: { userId: req.user.id, productId },
    });
  }
  @Post('orders')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async order(@Body() dto: OrderDto, @Req() req: Request) {
    return this.shop.placeOrder(dto, await this.session.user(req));
  }
  @Get('orders') @UseGuards(SessionGuard) orders(@Req() req: AuthRequest) {
    return this.db.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    @Inject(PrismaService) private db: PrismaService,
    @Inject(ShopService) private shop: ShopService,
  ) {}
  @Get() async overview() {
    const [products, collections, campaigns, orders, subscriberCount] =
      await Promise.all([
        this.db.product.findMany({
          include: productInclude,
          orderBy: { createdAt: 'asc' },
        }),
        this.db.collection.findMany(),
        this.db.campaign.findMany(),
        this.db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
        this.db.newsletterSubscriber.count(),
      ]);
    return { products, collections, campaigns, orders, subscriberCount };
  }
  @Post('products') createProduct(@Body() dto: ProductDto) {
    return this.shop.saveProduct(dto);
  }
  @Put('products/:id') updateProduct(
    @Param('id') id: string,
    @Body() dto: ProductDto,
  ) {
    return this.shop.saveProduct(dto, id);
  }
  @Delete('products/:id') archiveProduct(@Param('id') id: string) {
    return this.db.product.update({
      where: { id },
      data: { published: false },
    });
  }
  @Post('collections') createCollection(@Body() dto: CollectionDto) {
    return this.db.collection.create({ data: dto });
  }
  @Put('collections/:id') updateCollection(
    @Param('id') id: string,
    @Body() dto: CollectionDto,
  ) {
    return this.db.collection.update({ where: { id }, data: dto });
  }
  @Delete('collections/:id') deleteCollection(@Param('id') id: string) {
    return this.db.collection.delete({ where: { id } });
  }
  @Post('campaigns') createCampaign(@Body() dto: CampaignDto) {
    return this.db.campaign.create({ data: dto });
  }
  @Put('campaigns/:id') updateCampaign(
    @Param('id') id: string,
    @Body() dto: CampaignDto,
  ) {
    return this.db.campaign.update({ where: { id }, data: dto });
  }
  @Delete('campaigns/:id') deleteCampaign(@Param('id') id: string) {
    return this.db.campaign.delete({ where: { id } });
  }
}
