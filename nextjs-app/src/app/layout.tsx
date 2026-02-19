import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/shared/Providers';

export const metadata: Metadata = {
  title: 'Food Hall Experience',
  description: 'Multi-vendor food hall with group ordering, live tracking & AI concierge',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  themeColor: '#7e22ce',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
