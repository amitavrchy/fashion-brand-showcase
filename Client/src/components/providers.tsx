'use client';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import Lenis from 'lenis';
import { api } from '@/lib/api';
import type { CartLine, Product, User } from '@/lib/types';
import { hydrateCart, makeStore, setUser, setWishlist, type AppStore } from '@/features/store';

function safeRead(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
}
export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }));
  return <Provider store={store}><QueryClientProvider client={client}><MotionConfig reducedMotion="user"><Bootstrap store={store} />{children}</MotionConfig></QueryClientProvider></Provider>;
}
function Bootstrap({ store }: { store: AppStore }) {
  useEffect(() => {
    let active = true;
    const saved = safeRead('lune-bag');
    const wishes = safeRead('lune-wishlist');
    const valid = Array.isArray(saved) ? saved.filter((i): i is CartLine => i && typeof i.variantId === 'string' && typeof i.quantity === 'number' && i.quantity > 0 && i.quantity <= 10 && typeof i.price === 'number' && typeof i.name === 'string' && typeof i.stock === 'number') : [];
    store.dispatch(hydrateCart(valid));
    const guestWishes = Array.isArray(wishes) ? wishes.filter((id): id is string => typeof id === 'string') : [];
    store.dispatch(setWishlist(guestWishes));
    api<User | null>('auth/me').then(async user => {
      if (!active) return;
      store.dispatch(setUser(user));
      if (user) {
        const serverWishes = await api<Product[]>('wishlist').catch(() => null);
        if (active && serverWishes) store.dispatch(setWishlist(serverWishes.map(p => p.id)));
      }
    }).catch(() => { if (active) store.dispatch(setUser(null)); });
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      try {
        localStorage.setItem('lune-bag', JSON.stringify(state.cart.items));
        if (!state.auth.user) localStorage.setItem('lune-wishlist', JSON.stringify(state.wishlist.ids));
      } catch { /* Shopping remains usable when browser storage is disabled. */ }
    });
    return () => { active = false; unsubscribe(); };
  }, [store]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | undefined;
    const sync = () => { lenis?.destroy(); lenis = media.matches ? undefined : new Lenis({ autoRaf: true, smoothWheel: true, duration: 1.05, anchors: true }); };
    sync(); media.addEventListener('change', sync);
    return () => { lenis?.destroy(); media.removeEventListener('change', sync); };
  }, []);
  return null;
}
