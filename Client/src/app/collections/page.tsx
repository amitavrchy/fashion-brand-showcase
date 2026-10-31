import { Suspense } from 'react';
import { CatalogPage } from '@/components/catalog';
import { Loading } from '@/components/ui';
export const metadata = {
  title: 'The collection',
  description: 'Discover considered ready-to-wear. Filter by category, color and available size.',
};
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <CatalogPage />
    </Suspense>
  );
}
