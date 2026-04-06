import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Suspense } from 'react';
import { auth } from '@/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Base SQL',
  description: 'Private SQL Snippet Manager',
};

import { Providers } from '@/components/Providers';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-slate-300 h-screen flex overflow-hidden antialiased`} suppressHydrationWarning>
        <Providers>
          {session?.user ? (
            <>
              <Sidebar user={session.user} />
              <div className="flex flex-col flex-1 h-full min-w-0">
                <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800 w-full" />}>
                  <Header user={session.user} />
                </Suspense>
                <main className="flex-1 overflow-auto p-6 bg-slate-950 shadow-inner">
                  {children}
                </main>
              </div>
            </>
          ) : (
            <main className="flex-1 w-full h-full bg-slate-950">
              {children}
            </main>
          )}
        </Providers>
      </body>
    </html>
  );
}
