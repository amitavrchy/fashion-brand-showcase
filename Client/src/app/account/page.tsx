import { Suspense } from 'react';
import { AccountPage } from '@/components/account';
import { Loading } from '@/components/ui';
export const metadata = { title: 'Your account', robots: { index: false, follow: false } };
export default function Page() { return <Suspense fallback={<Loading />}><AccountPage /></Suspense>; }
