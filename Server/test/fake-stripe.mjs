import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
export const signingSecret =
  'whsec_isolated_tests_only_not_a_real_endpoint_secret';
export class FakeStripeGateway {
  sessions = new Map();
  orders = new Map();
  failNext = false;
  available() {
    return true;
  }
  async create(order) {
    if (this.failNext) {
      this.failNext = false;
      const error = new Error('Fixture request was rejected.');
      error.definite = true;
      throw error;
    }
    if (this.orders.has(order.id))
      return this.sessions.get(this.orders.get(order.id));
    const id = `cs_test_${randomUUID().replaceAll('-', '')}`;
    const session = {
      id,
      object: 'checkout.session',
      mode: 'payment',
      currency: 'eur',
      amount_total: Math.round(Number(order.total) * 100),
      metadata: { orderId: order.id },
      client_reference_id: order.id,
      url: `https://checkout.stripe.com/c/pay/${id}`,
      livemode: false,
      status: 'open',
      payment_status: 'unpaid',
      payment_intent: null,
      success_url: `${order.checkoutOrigin}/checkout/return?session_id=${id}`,
      cancel_url: `${order.checkoutOrigin}/checkout/cancel?order_id=${order.id}`,
    };
    this.sessions.set(id, session);
    this.orders.set(order.id, id);
    return session;
  }
  async retrieve(id) {
    if (!this.sessions.has(id)) throw new Error('Unknown fixture session.');
    return this.sessions.get(id);
  }
  async expire(id) {
    const session = await this.retrieve(id);
    if (session.status === 'complete') throw new Error('Already paid.');
    session.status = 'expired';
    return session;
  }
  async pay(id) {
    const session = await this.retrieve(id);
    session.status = 'complete';
    session.payment_status = 'paid';
    session.payment_intent = `pi_test_${id.slice(8)}`;
    return session;
  }
  event(payload, signature) {
    return Stripe.webhooks.constructEvent(payload, signature, signingSecret);
  }
  definiteFailure(error) {
    return error?.definite === true;
  }
}
export function signedEvent(session, type = 'checkout.session.completed') {
  const payload = JSON.stringify({
    id: `evt_test_${randomUUID().replaceAll('-', '')}`,
    object: 'event',
    type,
    livemode: false,
    data: { object: session },
  });
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: signingSecret,
  });
  return { payload, signature };
}
