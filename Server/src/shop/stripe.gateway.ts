import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { Order } from '@prisma/client';

export type OrderLineSnapshot = {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
};
export type ShippingSnapshot = {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  shippingCost: number;
};

@Injectable()
export class StripeGateway {
  private stripe?: Stripe;
  constructor(@Inject(ConfigService) private config: ConfigService) {}
  private client() {
    if (this.stripe) return this.stripe;
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key || !/^(sk|rk)_test_/.test(key))
      throw new ServiceUnavailableException(
        'Stripe test payments are not configured. Please try again later.',
      );
    this.stripe = new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000 });
    return this.stripe;
  }
  available() {
    return /^(sk|rk)_test_/.test(
      this.config.get<string>('STRIPE_SECRET_KEY') || '',
    );
  }
  async create(order: Order) {
    const items = order.itemsJson as unknown as OrderLineSnapshot[];
    const shipping = order.shippingJson as unknown as ShippingSnapshot;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.name,
            description: `${item.color} / ${item.size}`,
            metadata: { variantId: item.variantId },
          },
        },
      }),
    );
    if (shipping.shippingCost)
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(shipping.shippingCost * 100),
          product_data: {
            name: 'Standard delivery',
            description: 'Complimentary on orders of €300 or more',
          },
        },
      });
    return this.client().checkout.sessions.create(
      {
        mode: 'payment',
        allowed_payment_method_types: ['card'],
        customer_email: order.email,
        line_items: lineItems,
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        success_url: `${order.checkoutOrigin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${order.checkoutOrigin}/checkout/cancel?order_id=${order.id}`,
        expires_at: Math.floor(order.expiresAt!.getTime() / 1000),
        custom_text: {
          submit: {
            message:
              'ATELIER LUNE · Test payment. No real funds will be charged.',
          },
        },
      },
      { idempotencyKey: `atelier-checkout-${order.id}` },
    );
  }
  retrieve(id: string) {
    return this.client().checkout.sessions.retrieve(id);
  }
  expire(id: string) {
    return this.client().checkout.sessions.expire(id);
  }
  event(payload: Buffer, signature: string) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret)
      throw new ServiceUnavailableException(
        'Webhook verification is not configured.',
      );
    return Stripe.webhooks.constructEvent(payload, signature, secret);
  }
  definiteFailure(error: unknown): boolean {
    return (
      error instanceof Stripe.errors.StripeInvalidRequestError ||
      error instanceof Stripe.errors.StripeAuthenticationError ||
      error instanceof Stripe.errors.StripePermissionError
    );
  }
}
