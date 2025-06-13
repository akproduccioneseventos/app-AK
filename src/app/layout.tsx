import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { Poppins } from 'next/font/google';

// Configure Poppins font with specified weights
const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins', // Optional: if you want to use it as a CSS variable
});

export const metadata: Metadata = {
  title: 'Presupuestador AK Producciones',
  description: 'Gestión de facturas y presupuestos para AK Producciones',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${poppins.variable}`}>
      <head>
        {/* Google Font <link> tags for Poppins are removed as next/font handles it */}
      </head>
      <body className={`${poppins.className} font-body antialiased`}>
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
