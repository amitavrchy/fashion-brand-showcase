'use client';
import { useSyncExternalStore } from 'react';
import { Loading } from './ui';

const subscribe = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
export function ClientReady({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  return hydrated ? children : <Loading />;
}
