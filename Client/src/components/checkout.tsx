'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, message, money } from '@/lib/api';
import type { Catalog, Order } from '@/lib/types';
import { clearCart, useAppDispatch, useAppSelector } from '@/features/store';
import { BagItems } from './shell';
import { EmptyState, Photo } from './ui';

const schema = z.object({ email: z.email('Please enter a valid email address.'), name: z.string().trim().min(2, 'Please enter your full name.').max(100), address: z.string().trim().min(5, 'Please enter your street address.').max(200), city: z.string().trim().min(2, 'Please enter your city.').max(100), postalCode: z.string().trim().min(2, 'Please enter your postal code.').max(20), country: z.string().min(2, 'Please choose your country.').max(80) });
type CheckoutValues = z.infer<typeof schema>;
export function CartPage() {
  const items = useAppSelector(s => s.cart.items);
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: () => api<Catalog>('catalog'), staleTime: 0 });
  const issues = items.filter(i => { const v = catalog.data?.products.find(p => p.id === i.productId)?.variants.find(v => v.id === i.variantId); return catalog.data && (!v || v.stock < i.quantity); });
  if (!items.length) return <EmptyState title="Room for something lovely." text="Your bag is waiting for a considered addition. Discover pieces made to become part of your everyday." />;
  return <><div className="page-heading"><p className="eyebrow">A considered selection</p><h1>Your bag.</h1><p>{items.reduce((s, i) => s + i.quantity, 0)} pieces, chosen by you.</p></div><div className="cart-layout"><div>{issues.length > 0 && <p className="form-error" role="alert">Some pieces have less stock than the quantity in your bag. Reduce the quantity or remove them before checkout.</p>}<BagItems /><Link className="text-link" href="/collections" style={{ marginTop: 25 }}>Continue exploring</Link></div><OrderSummary disabled={issues.length > 0} /></div></>;
}
function OrderSummary({ checkout = false, disabled = false }: { checkout?: boolean; disabled?: boolean }) {
  const items = useAppSelector(s => s.cart.items);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 300 ? 0 : 15;
  return <aside className="order-summary"><h2>Your considered selection</h2>{checkout && items.map(i => <div className="summary-line-item" key={i.variantId}><div><Photo src={i.image} alt={i.name} sizes="60px" /></div><div>{i.name}<p className="muted">{i.color} / {i.size} · Qty {i.quantity}</p></div><span>{money(i.price * i.quantity)}</span></div>)}<div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-row"><span>Delivery</span><span>{shipping ? money(shipping) : 'Complimentary'}</span></div><div className="summary-row"><span>VAT</span><span>Included</span></div><div className="summary-row total"><span>Total</span><span>{money(subtotal + shipping)}</span></div>{!checkout && (disabled ? <button className="button full" disabled>Review stock in your bag</button> : <Link className="button" href="/checkout">Continue to checkout <ArrowRight size={18} /></Link>)}<p className="muted">{checkout ? 'Final price and availability confirmed when you place your order.' : 'Secure checkout · 30-day returns'}</p></aside>;
}
export function CheckoutPage() {
  const items = useAppSelector(s => s.cart.items);
  const user = useAppSelector(s => s.auth.user);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const key = useRef('');
  const [order, setOrder] = useState<Order | null>(null);
  const form = useForm<CheckoutValues>({ resolver: zodResolver(schema), defaultValues: { email: user?.email || '', name: user?.name || '', address: '', city: '', postalCode: '', country: '' } });
  const submit = useMutation({ mutationFn: (values: CheckoutValues) => {
    if (!key.current) key.current = crypto.randomUUID();
    const { email, ...shipping } = values;
    return api<Order>('orders', { method: 'POST', body: JSON.stringify({ email: user?.email || email, shipping, items: items.map(i => ({ variantId: i.variantId, quantity: i.quantity })), idempotencyKey: key.current }) });
  }, onSuccess: data => {
    setOrder(data); dispatch(clearCart()); queryClient.invalidateQueries({ queryKey: ['catalog'] }); queryClient.invalidateQueries({ queryKey: ['orders'] }); queryClient.invalidateQueries({ queryKey: ['product'] });
  } });
  if (order) return <div className="order-confirmation"><CheckCircle2 size={48} strokeWidth={1} /><p className="eyebrow">A little anticipation</p><h1>Beautifully <em>chosen.</em></h1><p>Your mock order has been recorded and inventory reserved. No payment was taken. Keep the reference below for your records.</p><div className="confirmation-details"><h3>Order details</h3><div className="summary-row"><span>Reference</span><strong>{order.id}</strong></div><div className="summary-row"><span>Email</span><span>{order.email}</span></div><div className="summary-row"><span>Status</span><span>Mock order · Pending</span></div>{order.itemsJson.map(i => <div className="summary-row" key={i.variantId}><span>{i.name} · {i.size} × {i.quantity}</span><span>{money(i.price * i.quantity)}</span></div>)}<div className="summary-row total"><span>Total</span><span>{money(order.total)}</span></div></div><Link className="button" href={user ? '/account' : '/collections'}>{user ? 'View your orders' : 'Continue exploring'}<ArrowRight size={18} /></Link></div>;
  if (!items.length) return <EmptyState title="A good place to begin." text="Choose a piece you love before continuing to checkout." />;
  return <><div className="checkout-heading"><Link className="text-link" href="/cart">Back to your bag</Link><h1>The final <em>details.</em></h1></div><div className="checkout-layout"><div><div className="mock-note"><ShieldCheck size={20} /><span>This is a demonstration checkout. No payment information is requested and no charge will be made. Placing an order updates inventory.</span></div><form className="checkout-form" onSubmit={form.handleSubmit(values => submit.mutate(values))} noValidate><h2>01 / A way to reach you</h2><div className="field"><label htmlFor="checkout-email">Email address</label><input id="checkout-email" type="email" autoComplete="email" {...form.register('email')} aria-invalid={!!form.formState.errors.email} />{form.formState.errors.email && <p className="form-error">{form.formState.errors.email.message}</p>}</div>{user && <p className="muted" style={{ marginTop: 10 }}>Your order will be linked to {user.email}.</p>}<h2>02 / Somewhere to arrive</h2><div className="form-grid">{(['name', 'address', 'city', 'postalCode'] as const).map(field => <div className={`field ${['name', 'address'].includes(field) ? 'span-2' : ''}`} key={field}><label htmlFor={`checkout-${field}`}>{({ name: 'Full name', address: 'Street address', city: 'City', postalCode: 'Postal code' })[field]}</label><input id={`checkout-${field}`} autoComplete={({ name: 'name', address: 'street-address', city: 'address-level2', postalCode: 'postal-code' })[field]} {...form.register(field)} aria-invalid={!!form.formState.errors[field]} />{form.formState.errors[field] && <p className="form-error">{form.formState.errors[field]?.message}</p>}</div>)}<div className="field span-2"><label htmlFor="checkout-country">Country</label><select id="checkout-country" autoComplete="country-name" {...form.register('country')} aria-invalid={!!form.formState.errors.country}><option value="">Choose your country</option>{['Bangladesh', 'Belgium', 'Canada', 'Denmark', 'France', 'Germany', 'India', 'Ireland', 'Italy', 'Netherlands', 'Portugal', 'Spain', 'Sweden', 'United Kingdom', 'United States'].map(c => <option key={c}>{c}</option>)}</select>{form.formState.errors.country && <p className="form-error">{form.formState.errors.country.message}</p>}</div></div><h2>03 / A considered next step</h2><p className="muted">By placing this mock order, you agree to our <Link className="text-link" href="/terms">terms</Link>. Delivery and returns shown here are illustrative.</p>{submit.isError && <p className="form-error" role="alert">{message(submit.error)} <Link href="/cart" className="text-link">Review your bag</Link></p>}<button type="submit" className="button" disabled={submit.isPending}>{submit.isPending ? 'Recording your order…' : 'Place mock order'}<ArrowRight size={18} /></button></form></div><OrderSummary checkout /></div></>;
}
