'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #1e293b',
        },
      }} />
      {children}
    </SessionProvider>
  );
}
