
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Belleza, Playfair_Display, Dancing_Script } from 'next/font/google';
import { AuthGuard } from './auth-guard';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const belleza = Belleza({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-belleza',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair_display',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dancing_script',
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
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${belleza.variable} ${playfairDisplay.variable} ${dancingScript.variable}`}>
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
