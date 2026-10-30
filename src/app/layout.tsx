import type { Metadata } from 'next';
import { Mulish } from 'next/font/google';
import './globals.css';

const mulish = Mulish({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mulish',
});

export const metadata: Metadata = {
  title: 'Tanzania Demographic & Health Choropleth Map',
  description: 'Interactive subnational choropleth map and drill-down visualization for Tanzania 2022 Census, DHS, and facilities data.',
  icons: {
    icon: [{ url: '/tanzania.png', type: 'image/png' }],
    shortcut: '/tanzania.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${mulish.variable}`}>
      <body className="bg-slate-950 text-slate-100 antialiased h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}

