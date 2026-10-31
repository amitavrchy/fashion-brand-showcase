import { AdminPage } from '@/components/admin';
import { ClientReady } from '@/components/client-ready';
export const metadata = { title: 'The atelier — Administration', robots: { index: false, follow: false } };
export default function Page() { return <ClientReady><AdminPage /></ClientReady>; }
