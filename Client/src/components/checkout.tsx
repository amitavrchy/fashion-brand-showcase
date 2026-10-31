'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, message, money } from '@/lib/api';
import type { Catalog, CheckoutSession } from '@/lib/types';
import { reconcileCart, useAppDispatch, useAppSelector } from '@/features/store';
import { BagItems } from './shell';
import { EmptyState, Photo } from './ui';

const schema = z.object({
  email: z.email('Please enter a valid email address.'),
  name: z.string().trim().min(2, 'Please enter your full name.').max(100),
  address: z.string().trim().min(5, 'Please enter your street address.').max(200),
  city: z.string().trim().min(2, 'Please enter your city.').max(100),
  postalCode: z.string().trim().min(2, 'Please enter your postal code.').max(20),
  country: z.string().min(2, 'Please choose your country.').max(80),
});
type CheckoutValues = z.infer<typeof schema>;
function useCartCatalog() {
  const dispatch = useAppDispatch();
  const catalog = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api<Catalog>('catalog'),
    staleTime: 0,
  });
  useEffect(() => {
    if (catalog.data) dispatch(reconcileCart(catalog.data.products));
  }, [catalog.data, dispatch]);
  return catalog;
}
export function CartPage() {
  const items = useAppSelector((s) => s.cart.items);
  const catalog = useCartCatalog();
  const issues = items.filter((i) => {
    const v = catalog.data?.products
      .find((p) => p.id === i.productId)
      ?.variants.find((v) => v.id === i.variantId);
    return catalog.data && (!v || v.stock < i.quantity);
  });
  if (!items.length)
    return (
      <EmptyState
        title="Room for something lovely."
        text="Your bag is waiting for a considered addition. Discover pieces made to become part of your everyday."
      />
    );
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">A considered selection</p>
        <h1>Your bag.</h1>
        <p>{items.reduce((s, i) => s + i.quantity, 0)} pieces, chosen by you.</p>
      </div>
      <div className="cart-layout">
        <div>
          {issues.length > 0 && (
            <p className="form-error" role="alert">
              Some pieces have less stock than the quantity in your bag. Reduce the quantity or
              remove them before checkout.
            </p>
          )}
          <BagItems />
          <Link className="text-link" href="/collections" style={{ marginTop: 25 }}>
            Continue exploring
          </Link>
        </div>
        <OrderSummary disabled={issues.length > 0} />
      </div>
    </>
  );
}
function OrderSummary({
  checkout = false,
  disabled = false,
}: {
  checkout?: boolean;
  disabled?: boolean;
}) {
  const items = useAppSelector((s) => s.cart.items);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 300 ? 0 : 15;
  return (
    <aside className="order-summary">
      <h2>Your considered selection</h2>
      {checkout &&
        items.map((i) => (
          <div className="summary-line-item" key={i.variantId}>
            <div>
              <Photo src={i.image} alt={i.name} sizes="60px" />
            </div>
            <div>
              {i.name}
              <p className="muted">
                {i.color} / {i.size} · Qty {i.quantity}
              </p>
            </div>
            <span>{money(i.price * i.quantity)}</span>
          </div>
        ))}
      <div className="summary-row">
        <span>Subtotal</span>
        <span>{money(subtotal)}</span>
      </div>
      <div className="summary-row">
        <span>Delivery</span>
        <span>{shipping ? money(shipping) : 'Complimentary'}</span>
      </div>
      <div className="summary-row">
        <span>VAT</span>
        <span>Included</span>
      </div>
      <div className="summary-row total">
        <span>Total</span>
        <span>{money(subtotal + shipping)}</span>
      </div>
      {!checkout &&
        (disabled ? (
          <button className="button full" disabled>
            Review stock in your bag
          </button>
        ) : (
          <Link className="button" href="/checkout">
            Continue to checkout <ArrowRight size={18} />
          </Link>
        ))}
      <p className="muted">
        {checkout
          ? 'Final price and availability confirmed when you place your order.'
          : 'Secure checkout · 30-day returns'}
      </p>
    </aside>
  );
}
export function CheckoutPage() {
  const items = useAppSelector((s) => s.cart.items);
  const user = useAppSelector((s) => s.auth.user);
  const catalog = useCartCatalog();
  const hasStockIssue = items.some((i) => i.stock < i.quantity);
  const key = useRef('');
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email || '',
      name: user?.name || '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
    },
  });
  useEffect(() => {
    if (!user) return;
    if (!form.getFieldState('email').isDirty) form.setValue('email', user.email);
    if (!form.getFieldState('name').isDirty) form.setValue('name', user.name);
  }, [user, form]);
  const submit = useMutation({
    mutationFn: (values: CheckoutValues) => {
      const { email, ...shipping } = values;
      const fingerprint = JSON.stringify({ values, items: items.map(i => ({ variantId: i.variantId, quantity: i.quantity })) });
      try { const previous = JSON.parse(sessionStorage.getItem('lune-checkout-attempt') || 'null'); key.current = previous?.fingerprint === fingerprint ? previous.key : crypto.randomUUID(); sessionStorage.setItem('lune-checkout-attempt', JSON.stringify({ fingerprint, key: key.current })); } catch { if (!key.current) key.current = crypto.randomUUID(); }
      return api<CheckoutSession>('orders', {
        method: 'POST',
        body: JSON.stringify({
          email: user?.email || email,
          shipping,
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          idempotencyKey: key.current,
        }),
      });
    },
    onSuccess: (data) => {
      try { sessionStorage.setItem('lune-active-checkout', data.sessionId); } catch { /* Payment continues without optional browser storage. */ }
      window.location.assign(data.checkoutUrl);
    },
  });
  if (!items.length)
    return (
      <EmptyState
        title="A good place to begin."
        text="Choose a piece you love before continuing to checkout."
      />
    );
  return (
    <>
      <div className="checkout-heading">
        <Link className="text-link" href="/cart">
          Back to your bag
        </Link>
        <h1>
          The final <em>details.</em>
        </h1>
      </div>
      <div className="checkout-layout">
        <div>
          <div className="mock-note">
            <ShieldCheck size={20} />
            <span>
              Stripe test mode. Your payment details are entered securely on Stripe. No real
              funds are charged, and your pieces are reserved while you complete payment.
            </span>
          </div>
          <form
            className="checkout-form"
            onSubmit={form.handleSubmit((values) => submit.mutate(values))}
            noValidate
          >
            <h2>01 / A way to reach you</h2>
            <div className="field">
              <label htmlFor="checkout-email">Email address</label>
              <input
                id="checkout-email"
                type="email"
                autoComplete="email"
                {...form.register('email')}
                aria-invalid={!!form.formState.errors.email}
              />
              {form.formState.errors.email && (
                <p className="form-error">{form.formState.errors.email.message}</p>
              )}
            </div>
            {user && (
              <p className="muted" style={{ marginTop: 10 }}>
                Your order will be linked to {user.email}.
              </p>
            )}
            <h2>02 / Somewhere to arrive</h2>
            <div className="form-grid">
              {(['name', 'address', 'city', 'postalCode'] as const).map((field) => (
                <div
                  className={`field ${['name', 'address'].includes(field) ? 'span-2' : ''}`}
                  key={field}
                >
                  <label htmlFor={`checkout-${field}`}>
                    {
                      {
                        name: 'Full name',
                        address: 'Street address',
                        city: 'City',
                        postalCode: 'Postal code',
                      }[field]
                    }
                  </label>
                  <input
                    id={`checkout-${field}`}
                    autoComplete={
                      {
                        name: 'name',
                        address: 'street-address',
                        city: 'address-level2',
                        postalCode: 'postal-code',
                      }[field]
                    }
                    {...form.register(field)}
                    aria-invalid={!!form.formState.errors[field]}
                  />
                  {form.formState.errors[field] && (
                    <p className="form-error">{form.formState.errors[field]?.message}</p>
                  )}
                </div>
              ))}
              <div className="field span-2">
                <label htmlFor="checkout-country">Country</label>
                <select
                  id="checkout-country"
                  autoComplete="country-name"
                  {...form.register('country')}
                  aria-invalid={!!form.formState.errors.country}
                >
                  <option value="">Choose your country</option>
                  {[
                    'Bangladesh',
                    'Belgium',
                    'Canada',
                    'Denmark',
                    'France',
                    'Germany',
                    'India',
                    'Ireland',
                    'Italy',
                    'Netherlands',
                    'Portugal',
                    'Spain',
                    'Sweden',
                    'United Kingdom',
                    'United States',
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                {form.formState.errors.country && (
                  <p className="form-error">{form.formState.errors.country.message}</p>
                )}
              </div>
            </div>
            <h2>03 / A considered next step</h2>
            <p className="muted">
              By continuing to secure payment, you agree to our{' '}
              <Link className="text-link" href="/terms">
                terms
              </Link>
              . Your pieces are reserved while you complete payment.
            </p>
            {submit.isError && (
              <p className="form-error" role="alert">
                {message(submit.error)}{' '}
                <Link href="/cart" className="text-link">
                  Review your bag
                </Link>
              </p>
            )}
            {hasStockIssue && (
              <p className="form-error" role="alert">
                Stock has changed. Please{' '}
                <Link className="text-link" href="/cart">
                  review your bag
                </Link>{' '}
                before placing an order.
              </p>
            )}
            {catalog.isError && (
              <p className="form-error" role="alert">
                We could not confirm availability.{' '}
                <button className="text-link" type="button" onClick={() => catalog.refetch()}>
                  Try again
                </button>
              </p>
            )}
            <button
              type="submit"
              className="button"
              disabled={submit.isPending || !catalog.isSuccess || hasStockIssue}
            >
              {submit.isPending ? 'Recording your order…' : 'Place mock order'}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
        <OrderSummary checkout />
      </div>
    </>
  );
}
