'use client';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, ShieldCheck, CircleX } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, money, message } from '@/lib/api';
import type { Order } from '@/lib/types';
import { consumeOrder, useAppDispatch, useAppSelector } from '@/features/store';
import { EmptyState, Loading, Photo } from './ui';

export function PaymentResult({ cancelled = false }: { cancelled?: boolean }) {
  const search = useSearchParams();
  const sessionId = search.get('session_id') || '';
  const orderId = search.get('order_id') || '';
  const dispatch = useAppDispatch();
  const client = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const consumed = useRef('');
  const result = useQuery({
    queryKey: ['payment-result', cancelled ? orderId : sessionId, cancelled],
    queryFn: () =>
      api<{ order: Order }>(
        cancelled
          ? `payments/cancel/${encodeURIComponent(orderId)}`
          : `payments/checkout/${encodeURIComponent(sessionId)}`,
        cancelled ? { method: 'POST' } : {},
      ),
    enabled: cancelled ? !!orderId : !!sessionId,
    retry: 1,
    refetchInterval: (query) =>
      !cancelled && query.state.data?.order.status === 'PENDING' ? 2500 : false,
  });
  const order = result.data?.order;
  useEffect(() => {
    if (!order) return;
    if (order.status === 'PAID' && consumed.current !== order.id) {
      consumed.current = order.id;
      try {
        if (sessionStorage.getItem('lune-active-checkout') === order.stripeSessionId) {
          dispatch(consumeOrder(order.itemsJson));
          sessionStorage.removeItem('lune-active-checkout');
        }
        sessionStorage.removeItem('lune-checkout-attempt');
      } catch {
        /* Order confirmation stays available when browser storage is restricted. */
      }
      client.invalidateQueries({ queryKey: ['catalog'] });
      client.invalidateQueries({ queryKey: ['orders'] });
      client.invalidateQueries({ queryKey: ['product'] });
    } else if (order.status === 'CANCELLED') {
      try {
        sessionStorage.removeItem('lune-checkout-attempt');
        sessionStorage.removeItem('lune-active-checkout');
      } catch {
        /* Optional browser storage. */
      }
      client.invalidateQueries({ queryKey: ['catalog'] });
    }
  }, [order, client, dispatch]);
  if (!(cancelled ? orderId : sessionId))
    return (
      <EmptyState
        title="Let’s begin with your bag."
        text="A secure payment link will appear after you choose your pieces."
        href="/cart"
        link="View your bag"
      />
    );
  if (result.isPending)
    return (
      <Loading
        label={cancelled ? 'Confirming your cancellation…' : 'Confirming your payment with Stripe…'}
      />
    );
  if (result.isError)
    return (
      <div className="empty-state">
        <ShieldCheck size={38} />
        <h1>A moment of care.</h1>
        <p>{message(result.error)}</p>
        <button className="button" onClick={() => result.refetch()}>
          Check again <ArrowRight size={18} />
        </button>
        <Link href="/account" className="text-link">
          Visit your account
        </Link>
      </div>
    );
  if (!order) return null;
  if (order.status === 'CANCELLED')
    return (
      <div className="order-confirmation">
        <CircleX size={44} strokeWidth={1} />
        <p className="eyebrow">Your bag is still here</p>
        <h1>
          A little more <em>time.</em>
        </h1>
        <p>
          Your payment was cancelled or expired. No payment was completed, and your reserved pieces
          have been returned to available stock.
        </p>
        <Link className="button" href="/checkout">
          Return to checkout <ArrowRight size={18} />
        </Link>
      </div>
    );
  if (order.status !== 'PAID' && order.status !== 'SHIPPED')
    return (
      <div className="order-confirmation">
        <ShieldCheck size={42} strokeWidth={1} />
        <p className="eyebrow">Secure payment by Stripe</p>
        <h1>
          Awaiting <em>confirmation.</em>
        </h1>
        <p>
          Your order is reserved. We will show a confirmation only after Stripe verifies a
          successful payment.
        </p>
        {order.checkoutUrl && (
          <a className="button" href={order.checkoutUrl}>
            Continue secure payment <ArrowRight size={18} />
          </a>
        )}
        <p className="muted">Already paid? This page checks automatically.</p>
      </div>
    );
  return (
    <div className="order-confirmation">
      <CheckCircle2 size={48} strokeWidth={1} />
      <p className="eyebrow">Your order is confirmed</p>
      <h1>
        Beautifully <em>chosen.</em>
      </h1>
      <p>
        Thank you for choosing Atelier Lune. Your payment is confirmed, and your selection is
        recorded below.
      </p>
      <div className="confirmation-details">
        <div className="summary-row">
          <span>Order reference</span>
          <strong>{order.id}</strong>
        </div>
        <div className="summary-row">
          <span>Status</span>
          <span>Payment confirmed</span>
        </div>
        <div className="summary-row">
          <span>Receipt email</span>
          <span>{order.email}</span>
        </div>
        {order.itemsJson.map((item) => (
          <div className="summary-line-item" key={item.variantId}>
            <div>
              <Photo src={item.image} alt={item.name} sizes="60px" />
            </div>
            <div>
              {item.name}
              <p className="muted">
                {item.color} / {item.size} · Qty {item.quantity}
              </p>
            </div>
            <span>{money(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="summary-row total">
          <span>Total paid</span>
          <span>{money(order.total)}</span>
        </div>
        <p className="muted">
          Delivery to {order.shippingJson.name}, {order.shippingJson.address},{' '}
          {order.shippingJson.city}, {order.shippingJson.country}.
        </p>
      </div>
      <Link href={user ? '/account' : '/collections'} className="button">
        {user ? 'View your orders' : 'Continue exploring'}
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}
