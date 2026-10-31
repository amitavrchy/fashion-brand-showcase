import { Suspense } from 'react';
import { AccountPage } from '@/components/account';
import { Loading } from '@/components/ui';
import { ClientReady } from '@/components/client-ready';
export const metadata = { title: 'Your account', robots: { index: false, follow: false } };
export default function Page() { return <Suspense fallback={<Loading />}><ClientReady><AccountPage /></ClientReady></Suspense>; }
