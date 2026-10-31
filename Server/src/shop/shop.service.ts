import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { OrderDto, ProductDto } from './dto.js';
import type { SessionUser } from './auth.js';

export const productInclude = { media: { orderBy: { sortOrder: 'asc' as const } }, variants: { orderBy: { sku: 'asc' as const } }, collection: true };

@Injectable()
export class ShopService {
  constructor(@Inject(PrismaService) private db: PrismaService) {}

  async catalog() {
    const [products, collections, campaigns] = await Promise.all([
      this.db.product.findMany({ where: { published: true }, include: productInclude, orderBy: { createdAt: 'asc' } }),
      this.db.collection.findMany({ orderBy: { title: 'asc' } }),
      this.db.campaign.findMany({ where: { active: true }, orderBy: { id: 'asc' } }),
    ]);
    return { products, collections, campaigns };
  }

  async placeOrder(dto: OrderDto, user: SessionUser | null) {
    const email = dto.email.trim().toLowerCase();
    if (user && user.email !== email) throw new BadRequestException('Use the email address associated with your account.');
    const previous = await this.db.order.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
    const sameOwner = (order: { email: string; userId: string | null }) => order.email === email && order.userId === (user?.id ?? null);
    if (previous) {
      if (!sameOwner(previous)) throw new ConflictException('Please start a new checkout.');
      return previous;
    }
    const merged = new Map<string, number>();
    for (const item of dto.items) merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
    if ([...merged.values()].some(q => q > 10)) throw new BadRequestException('Maximum 10 of each item per order.');
    try {
      return await this.db.$transaction(async tx => {
        const items: Array<{ variantId: string; productId: string; name: string; slug: string; image: string; size: string; color: string; quantity: number; price: number }> = [];
        let subtotalCents = 0;
        // A stable lock order prevents deadlocks across overlapping baskets.
        for (const [variantId, quantity] of [...merged.entries()].sort(([a], [b]) => a.localeCompare(b))) {
          const variant = await tx.variant.findUnique({ where: { id: variantId }, include: { product: { include: { media: { orderBy: { sortOrder: 'asc' } } } } } });
          if (!variant || !variant.product.published) throw new BadRequestException('An item is no longer available. Please review your bag.');
          const updated = await tx.variant.updateMany({ where: { id: variantId, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } });
          if (updated.count !== 1) throw new ConflictException(`${variant.product.name} (${variant.colorName}, ${variant.size}) has insufficient stock. Please update your bag.`);
          const price = Number(variant.product.price);
          subtotalCents += Math.round(price * 100) * quantity;
          items.push({ variantId, productId: variant.productId, name: variant.product.name, slug: variant.product.slug, image: variant.product.media[0]?.url ?? '', size: variant.size, color: variant.colorName, quantity, price });
        }
        const shippingCents = subtotalCents >= 30000 ? 0 : 1500;
        return tx.order.create({ data: {
          email, userId: user?.id, status: 'PENDING', total: (subtotalCents + shippingCents) / 100,
          itemsJson: items, shippingJson: { ...dto.shipping, shippingCost: shippingCents / 100 }, idempotencyKey: dto.idempotencyKey,
        } });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const order = await this.db.order.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
        if (order && sameOwner(order)) return order;
      }
      throw error;
    }
  }

  async saveProduct(dto: ProductDto, id?: string) {
    const { media, variants, ...data } = dto;
    const signatures = variants.map(v => `${v.colorName.toLowerCase()}:${v.size.toLowerCase()}`);
    if (new Set(signatures).size !== signatures.length) throw new BadRequestException('Each color and size combination must be unique.');
    return this.db.$transaction(async tx => {
      if (id && !await tx.product.findUnique({ where: { id } })) throw new NotFoundException('Product not found.');
      const product = id ? await tx.product.update({ where: { id }, data: { ...data, collectionId: data.collectionId || null } }) : await tx.product.create({ data: { ...data, collectionId: data.collectionId || null } });
      await tx.productMedia.deleteMany({ where: { productId: product.id } });
      await tx.productMedia.createMany({ data: media.map((m, i) => ({ ...m, productId: product.id, sortOrder: i })) });
      const skus = variants.map(v => `${product.id}-${v.colorName.toLowerCase()}-${v.size.toLowerCase()}`);
      // Preserve variant identities so existing bags remain valid after edits.
      const existing = await tx.variant.findMany({ where: { productId: product.id } });
      const retained: string[] = [];
      for (const [i, variant] of variants.entries()) {
        const current = existing.find(v => v.colorName === variant.colorName && v.size === variant.size);
        const saved = current ? await tx.variant.update({ where: { id: current.id }, data: variant }) : await tx.variant.create({ data: { ...variant, productId: product.id, sku: skus[i] } });
        retained.push(saved.id);
      }
      await tx.variant.deleteMany({ where: { productId: product.id, id: { notIn: retained } } });
      return tx.product.findUnique({ where: { id: product.id }, include: productInclude });
    });
  }
}
