import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Shell } from '@/components/shell';
import './globals.css';
import './refinement.css';
import './homepage.css';

const sans = Manrope({
  variable: '--font-ui',
  subsets: ['latin'],
});

const serif = Cormorant_Garamond({
  variable: '--font-display',
  weight: ['400', '500', '600'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'ATELIER LUNE — Clothing as quiet architecture',
    template: '%s | ATELIER LUNE',
  },
  description:
    'Considered clothing for a life well lived. Discover contemporary ready-to-wear, natural materials and timeless silhouettes from ATELIER LUNE.',
  openGraph: {
    title: 'ATELIER LUNE',
    description: 'Clothing as quiet architecture. Autumn / Winter 2026.',
    type: 'website',
    images: [{ url: '/images/studio-coat.webp', width: 1600, height: 2400 }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
