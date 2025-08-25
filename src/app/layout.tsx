import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/app/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { Poppins, Belleza } from 'next/font/google';
import { AuthGuard } from '@/components/auth-guard';

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const belleza = Belleza({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-belleza',
});


export const metadata: Metadata = {
  title: 'AK Producciones',
  description: 'Plataforma integral para la planificación y gestión de eventos de AK Producciones.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${poppins.variable} ${belleza.variable}`}>
      <head>
      </head>
      <body className={`font-body antialiased`}>
        <AuthGuard>
          <AppShell>{children}</AppShell>
        </AuthGuard>
        <Toaster />
      </body>
    </html>
  );
}
