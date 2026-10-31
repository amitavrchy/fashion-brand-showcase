import { Suspense } from 'react';
import { PaymentResult } from '@/components/payment-result';
import { ClientReady } from '@/components/client-ready';
import { Loading } from '@/components/ui';
export const metadata = { title: 'Your checkout', robots: { index: false, follow: false } };
export default function Page() { return <Suspense fallback={<Loading />}><ClientReady><PaymentResult cancelled /></ClientReady></Suspense>; }
