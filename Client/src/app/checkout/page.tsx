import { CheckoutPage } from '@/components/checkout';
import { ClientReady } from '@/components/client-ready';
export const metadata = { title: 'Checkout', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <ClientReady>
      <CheckoutPage />
    </ClientReady>
  );
}
