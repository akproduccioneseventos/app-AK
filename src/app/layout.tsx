
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { Poppins } from 'next/font/google';
import { AuthGuard } from '@/components/auth-guard';

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Plataforma de Eventos - AK Producciones',
  description: 'Plataforma integral de planificación y gestión de eventos para AK Producciones.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${poppins.variable}`}>
      <head>
      </head>
      <body className={`${poppins.className} font-body antialiased`}>
        <AuthGuard>
          <AppShell>{children}</AppShell>
        </AuthGuard>
        <Toaster />
      </body>
    </html>
  );
}
