'use client';
import { useSyncExternalStore } from 'react';
import { Loading } from './ui';

const subscribe = () => () => {};
export function ClientReady({ children }: { children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return hydrated ? children : <Loading />;
}
