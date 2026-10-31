import { CartPage } from '@/components/checkout';
import { ClientReady } from '@/components/client-ready';
export const metadata = { title: 'Your bag', robots: { index: false, follow: true } };
export default function Page() {
  return (
    <ClientReady>
      <CartPage />
    </ClientReady>
  );
}
