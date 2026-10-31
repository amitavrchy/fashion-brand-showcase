'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, LogOut } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, message, money } from '@/lib/api';
import type { Order, Product, User } from '@/lib/types';
import { setUser, setWishlist, useAppDispatch, useAppSelector } from '@/features/store';
import { ProductCard } from './product-card';
import { EmptyState, ErrorState, Loading, Photo } from './ui';

export function AccountPage() {
  const { user, ready } = useAppSelector((s) => s.auth);
  if (!ready) return <Loading />;
  return (
    <div className="account-page">{user ? <AccountDashboard user={user} /> : <AuthForm />}</div>
  );
}
function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [syncError, setSyncError] = useState('');
  const dispatch = useAppDispatch();
  const guestIds = useAppSelector((s) => s.wishlist.ids);
  const client = useQueryClient();
  const schema = z.object({
    email: z.email('Please enter a valid email.'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(72, 'Use 72 characters or fewer.'),
    name:
      mode === 'register'
        ? z.string().trim().min(2, 'Please enter your name.').max(80)
        : z.string(),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      api<User>(`auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(
          mode === 'login' ? { email: values.email, password: values.password } : values,
        ),
      }),
    onSuccess: async (user) => {
      dispatch(setUser(user));
      try {
        await Promise.all(guestIds.map((id) => api(`wishlist/${id}`, { method: 'PUT' })));
        const saved = await api<Product[]>('wishlist');
        dispatch(setWishlist(saved.map((p) => p.id)));
        try {
          localStorage.removeItem('lune-wishlist');
        } catch {
          /* Optional guest storage. */
        }
        client.invalidateQueries({ queryKey: ['wishlist'] });
      } catch {
        setSyncError('Your account is ready. Some guest wishlist pieces could not be transferred.');
      }
    },
  });
  return (
    <div className="auth-layout">
      <div className="auth-photo">
        <Photo src="/images/dress.jpg" alt="A quiet expression of individual style" priority />
        <span>
          A little space.
          <br />
          <em>Just for you.</em>
        </span>
      </div>
      <div className="auth-form">
        <p className="eyebrow">Your Atelier Lune</p>
        <h1>{mode === 'login' ? 'Welcome back.' : 'Make yourself at home.'}</h1>
        <p>
          {mode === 'login'
            ? 'Your favourite pieces, considered selections, and a world to come back to.'
            : 'Save the pieces you love and keep your considered selections in one place.'}
        </p>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="auth-name">Your name</label>
              <input
                id="auth-name"
                autoComplete="name"
                {...form.register('name')}
                aria-invalid={!!form.formState.errors.name}
              />
              {form.formState.errors.name && (
                <p className="form-error">{form.formState.errors.name.message}</p>
              )}
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              {...form.register('email')}
              aria-invalid={!!form.formState.errors.email}
            />
            {form.formState.errors.email && (
              <p className="form-error">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <div className="password-input">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                {...form.register('password')}
                aria-invalid={!!form.formState.errors.password}
              />
              <button
                className="icon-button"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="form-error">{form.formState.errors.password.message}</p>
            )}
          </div>
          {mode === 'register' && (
            <p className="muted">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-link">
                terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-link">
                privacy policy
              </Link>
              .
            </p>
          )}
          {mutation.isError && (
            <p role="alert" className="form-error">
              {message(mutation.error)}
            </p>
          )}
          {syncError && (
            <p role="status" className="form-error">
              {syncError}
            </p>
          )}
          <button className="button" disabled={mutation.isPending}>
            {mutation.isPending
              ? 'A moment, please…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create your account'}
            <ArrowRight size={18} />
          </button>
        </form>
        <button
          className="text-link"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            mutation.reset();
            form.clearErrors();
          }}
        >
          {mode === 'login' ? 'New here? Create an account' : 'Already at home here? Sign in'}
        </button>
      </div>
    </div>
  );
}
function AccountDashboard({ user }: { user: User }) {
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'wishlist' ? 'wishlist' : 'orders');
  const dispatch = useAppDispatch();
  const client = useQueryClient();
  const ids = useAppSelector((s) => s.wishlist.ids);
  const wishlist = useQuery({
    queryKey: ['wishlist', user.id],
    queryFn: () => api<Product[]>('wishlist'),
  });
  const orders = useQuery({ queryKey: ['orders', user.id], queryFn: () => api<Order[]>('orders') });
  useEffect(() => {
    if (wishlist.data) dispatch(setWishlist(wishlist.data.map((p) => p.id)));
  }, [wishlist.data, dispatch]);
  const logout = useMutation({
    mutationFn: () => api('auth/logout', { method: 'POST' }),
    onSuccess: () => {
      dispatch(setUser(null));
      dispatch(setWishlist([]));
      client.removeQueries({ queryKey: ['wishlist'] });
      client.removeQueries({ queryKey: ['orders'] });
      client.removeQueries({ queryKey: ['admin'] });
    },
  });
  return (
    <>
      <div className="account-heading">
        <div>
          <p className="eyebrow">A space of your own</p>
          <h1>
            Hello, <em>{user.name.split(' ')[0]}.</em>
          </h1>
        </div>
        <button className="text-link" onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut size={15} style={{ display: 'inline', marginRight: 8 }} />
          Sign out
        </button>
      </div>
      {logout.isError && (
        <p role="alert" className="form-error">
          {message(logout.error)}
        </p>
      )}
      <nav className="account-tabs" aria-label="Your account">
        <button className={tab === 'orders' ? 'selected' : ''} onClick={() => setTab('orders')}>
          Your orders
        </button>
        <button className={tab === 'wishlist' ? 'selected' : ''} onClick={() => setTab('wishlist')}>
          Saved pieces ({ids.length})
        </button>
        <button className={tab === 'details' ? 'selected' : ''} onClick={() => setTab('details')}>
          Your details
        </button>
        {user.role === 'ADMIN' && (
          <Link href="/admin">
            Manage atelier <ArrowRight size={15} style={{ display: 'inline', marginLeft: 6 }} />
          </Link>
        )}
      </nav>
      {tab === 'wishlist' &&
        (wishlist.isPending ? (
          <Loading />
        ) : wishlist.isError ? (
          <ErrorState retry={() => wishlist.refetch()} />
        ) : wishlist.data.filter((p) => ids.includes(p.id)).length ? (
          <div className="catalog-grid">
            {wishlist.data
              .filter((p) => ids.includes(p.id))
              .map((p) => (
                <ProductCard key={p.id} product={p} index={5} />
              ))}
          </div>
        ) : (
          <EmptyState
            title="Keep something close."
            text="Select the heart on any piece to save it here, ready for another look."
          />
        ))}
      {tab === 'orders' &&
        (orders.isPending ? (
          <Loading />
        ) : orders.isError ? (
          <ErrorState retry={() => orders.refetch()} />
        ) : orders.data.length ? (
          orders.data.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-card-heading">
                <div>
                  <h3>Order {order.id.slice(-8).toUpperCase()}</h3>
                  <p className="muted">
                    {new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(
                      new Date(order.createdAt),
                    )}
                  </p>
                </div>
                <span className="status-tag">
                  {order.paymentProvider === 'MOCK'
                    ? 'Previous demo order'
                    : order.status === 'PENDING'
                      ? 'Awaiting payment'
                      : order.status === 'PAID'
                        ? 'Payment confirmed'
                        : order.status.toLowerCase()}
                </span>
              </div>
              {order.itemsJson.map((i) => (
                <div className="summary-line-item" key={i.variantId}>
                  <div>
                    <Photo src={i.image} alt={i.name} sizes="60px" />
                  </div>
                  <div>
                    <Link href={`/product/${i.slug}`}>{i.name}</Link>
                    <p className="muted">
                      {i.color} / {i.size} · Qty {i.quantity}
                    </p>
                  </div>
                  <span>{money(i.price * i.quantity)}</span>
                </div>
              ))}
              <div className="summary-row">
                <span>Total · VAT included</span>
                <span>{money(order.total)}</span>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title="The beginning of a wardrobe."
            text="Your considered selections will appear here when you place an order while signed in."
          />
        ))}
      {tab === 'details' && (
        <div className="settings-panel">
          <p className="eyebrow">Your account details</p>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <p className="muted">
            Your bag stays in this browser; your saved pieces and signed-in orders stay with your
            account.
          </p>
          <Link href="/privacy" className="text-link">
            How we care for your information
          </Link>
        </div>
      )}
    </>
  );
}
