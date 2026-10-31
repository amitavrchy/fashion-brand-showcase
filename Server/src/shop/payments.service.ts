import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Order } from '@prisma/client';
import type Stripe from 'stripe';
import type { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShopService } from './shop.service.js';
import { StripeGateway, type OrderLineSnapshot } from './stripe.gateway.js';
import type { OrderDto } from './dto.js';
import type { SessionUser } from './auth.js';

@Injectable()
export class PaymentsService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(PaymentsService.name);
  private timer?: ReturnType<typeof setInterval>;
  private reconciling = false;
  constructor(
    @Inject(PrismaService) private db: PrismaService,
    @Inject(ShopService) private shop: ShopService,
    @Inject(StripeGateway) private gateway: StripeGateway,
    @Inject(ConfigService) private config: ConfigService,
  ) {}
  onModuleInit() {
    if (process.env.NODE_ENV === 'test' || !this.gateway.available()) return;
    this.timer = setInterval(() => {
      void this.reconcilePending();
    }, 60_000);
    this.timer.unref();
    void this.reconcilePending();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  private token(orderId: string) {
    return createHmac('sha256', this.config.getOrThrow<string>('JWT_SECRET'))
      .update(`checkout:${orderId}`)
      .digest('hex');
  }
  private cookieName(orderId: string) {
    return `lune_order_${orderId}`;
  }
  private authorize(order: Order, request: Request, user: SessionUser | null) {
    if (user && order.userId === user.id) return;
    const cookie =
      request.headers.cookie
        ?.split(';')
        .map((s) => s.trim())
        .find((s) => s.startsWith(`${this.cookieName(order.id)}=`))
        ?.split('=')[1] || '';
    const expected = this.token(order.id);
    if (
      !/^[0-9a-f]{64}$/.test(cookie) ||
      !timingSafeEqual(Buffer.from(cookie), Buffer.from(expected))
    )
      throw new ForbiddenException(
        'Open this payment from the browser where you began checkout, or sign in to your account.',
      );
  }
  async begin(
    dto: OrderDto,
    user: SessionUser | null,
    request: Request,
    response: Response,
  ) {
    if (!this.gateway.available())
      throw new ServiceUnavailableException(
        'Stripe test payments are not available right now.',
      );
    const origins = (
      this.config.get<string>('CLIENT_ORIGIN') || 'http://localhost:3000'
    )
      .split(',')
      .map((v) => v.trim());
    const origin = request.headers.origin || origins[0];
    if (!origins.includes(origin))
      throw new BadRequestException('Invalid checkout origin.');
    const order = await this.shop.placeOrder(dto, user, { origin });
    if (order.paymentProvider !== 'STRIPE')
      throw new ConflictException('Please start a new checkout.');
    if (order.status === 'CANCELLED')
      throw new ConflictException({
        message: 'This checkout expired. Please try again.',
        code: 'CHECKOUT_CLOSED',
      });
    response.cookie(this.cookieName(order.id), this.token(order.id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 24 * 60 * 60_000,
    });
    let saved = order;
    if (!order.stripeSessionId) {
      try {
        const session = await this.gateway.create(order);
        saved = await this.attachSession(order, session);
      } catch (error) {
        const rejected = this.gateway.definiteFailure(error);
        if (rejected) await this.release(order.id);
        throw new ServiceUnavailableException({
          message:
            'We could not open secure payment. Your bag is safe. Please try again.',
          code: rejected ? 'CHECKOUT_REJECTED' : 'CHECKOUT_RETRY',
        });
      }
    }
    if (saved.status === 'PAID')
      return {
        ...saved,
        sessionId: saved.stripeSessionId,
        checkoutUrl: `${saved.checkoutOrigin}/checkout/return?session_id=${saved.stripeSessionId}`,
        paymentMode: 'test',
      };
    return { ...saved, sessionId: saved.stripeSessionId, paymentMode: 'test' };
  }
  private async attachSession(order: Order, session: Stripe.Checkout.Session) {
    if (
      session.livemode ||
      !session.url ||
      !session.url.startsWith('https://checkout.stripe.com/')
    )
      throw new BadRequestException('Invalid test checkout session.');
    return this.db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id, checkoutUrl: session.url },
    });
  }
  async synchronize(session: Stripe.Checkout.Session) {
    const order = await this.db.order.findUnique({
      where: { stripeSessionId: session.id },
    });
    if (!order) throw new NotFoundException('Payment could not be found.');
    if (
      session.livemode ||
      session.mode !== 'payment' ||
      session.metadata?.orderId !== order.id ||
      session.currency !== 'eur' ||
      session.amount_total !== Math.round(Number(order.total) * 100)
    )
      throw new ConflictException(
        'Payment details do not match this order. Please contact client care.',
      );
    if (session.payment_status === 'paid') {
      await this.db.order.updateMany({
        where: { id: order.id, status: 'PENDING', stockReleasedAt: null },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          stripePaymentIntentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id,
        },
      });
    } else if (session.status === 'expired') await this.release(order.id);
    return this.db.order.findUniqueOrThrow({ where: { id: order.id } });
  }
  async status(sessionId: string, request: Request, user: SessionUser | null) {
    if (!/^cs_test_[a-zA-Z0-9_]+$/.test(sessionId))
      throw new NotFoundException('Payment could not be found.');
    const order = await this.db.order.findUnique({
      where: { stripeSessionId: sessionId },
    });
    if (!order) throw new NotFoundException('Payment could not be found.');
    this.authorize(order, request, user);
    const saved = await this.synchronize(
      await this.gateway.retrieve(sessionId),
    );
    return { order: saved, paymentMode: 'test' };
  }
  async cancel(
    orderId: string,
    request: Request,
    user: SessionUser | null,
  ): Promise<{ order: Order }> {
    const order = await this.db.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentProvider !== 'STRIPE')
      throw new NotFoundException('Checkout could not be found.');
    this.authorize(order, request, user);
    if (order.status !== 'PENDING') return { order };
    if (order.stripeSessionId) {
      let session = await this.gateway.retrieve(order.stripeSessionId);
      if (session.status === 'open') {
        try {
          session = await this.gateway.expire(session.id);
        } catch {
          session = await this.gateway.retrieve(session.id);
        }
      }
      const saved = await this.synchronize(session);
      if (saved.status === 'PENDING')
        throw new ConflictException(
          'Payment is still processing. Please check its status before trying again.',
        );
      return { order: saved };
    }
    // Resolve a possibly timed-out creation with the same Stripe idempotency key before releasing stock.
    try {
      const session = await this.gateway.create(order);
      await this.attachSession(order, session);
      return this.cancel(order.id, request, user);
    } catch (error) {
      if (!this.gateway.definiteFailure(error))
        throw new ServiceUnavailableException(
          'We could not confirm cancellation. Please try again.',
        );
      await this.release(order.id);
      return {
        order: await this.db.order.findUniqueOrThrow({
          where: { id: order.id },
        }),
      };
    }
  }
  async release(orderId: string) {
    await this.db.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({
        where: {
          id: orderId,
          paymentProvider: 'STRIPE',
          status: 'PENDING',
          stockReleasedAt: null,
        },
        data: { status: 'CANCELLED', stockReleasedAt: new Date() },
      });
      if (!changed.count) return;
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      const lines = order.itemsJson as unknown as OrderLineSnapshot[];
      for (const line of [...lines].sort((a, b) =>
        a.variantId.localeCompare(b.variantId),
      ))
        await tx.variant.updateMany({
          where: { id: line.variantId },
          data: { stock: { increment: line.quantity } },
        });
    });
  }
  async webhook(payload: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.gateway.event(payload, signature);
    } catch {
      throw new BadRequestException('Invalid webhook signature.');
    }
    if (
      [
        'checkout.session.completed',
        'checkout.session.async_payment_succeeded',
        'checkout.session.expired',
        'checkout.session.async_payment_failed',
      ].includes(event.type)
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (
        await this.db.order.findUnique({
          where: { stripeSessionId: session.id },
        })
      )
        await this.synchronize(await this.gateway.retrieve(session.id));
      else {
        // Return a retryable response if a real event raced with saving the session ID.
        if (
          session.metadata?.orderId &&
          (await this.db.order.findUnique({
            where: { id: session.metadata.orderId, paymentProvider: 'STRIPE' },
          }))
        )
          throw new ServiceUnavailableException(
            'Checkout is being saved. Retry this event.',
          );
      }
    }
    return { received: true };
  }
  async reconcilePending() {
    if (this.reconciling) return;
    this.reconciling = true;
    try {
      const orders = await this.db.order.findMany({
        where: { paymentProvider: 'STRIPE', status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });
      for (const order of orders) {
        try {
          if (order.stripeSessionId)
            await this.synchronize(
              await this.gateway.retrieve(order.stripeSessionId),
            );
          else if (Date.now() - order.createdAt.getTime() > 60_000) {
            try {
              const session = await this.gateway.create(order);
              await this.attachSession(order, session);
              await this.synchronize(session);
            } catch (error) {
              if (this.gateway.definiteFailure(error))
                await this.release(order.id);
              else throw error;
            }
          }
        } catch {
          this.logger.warn(
            'A pending checkout could not be reconciled; it will be retried.',
          );
        }
      }
    } finally {
      this.reconciling = false;
    }
  }
}
