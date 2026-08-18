import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import './ak-global-premium.css';
import './ak-public-experience.css';
import './ak-motion-effects.css';
import './ak-release-polish.css';
import './ak-internal-experience-polish.css';
import './ak-no-red-experience.css';
import './ak-budget-mobile-fixes.css';
import { Toaster } from "@/components/ui/toaster";
import { DeploymentRecovery } from '@/components/deployment-recovery';
import { GoogleAnalytics } from '@/components/google-analytics';
import { getSearchConsoleVerification } from '@/lib/google-search-console';
import { AsistenteVirtual } from '@/components/public/AsistenteVirtual';
import { LocalBusinessSchema } from '@/components/public/LocalBusinessSchema';
import localFont from 'next/font/local';

const inter = localFont({
  src: [
    { path: './fonts/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/inter-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './fonts/inter-latin-900-normal.woff2', weight: '900', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-inter',
});

const belleza = localFont({
  src: './fonts/belleza-latin-400-normal.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-belleza',
});

const playfairDisplay = localFont({
  src: [
    { path: './fonts/playfair-display-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/playfair-display-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/playfair-display-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './fonts/playfair-display-latin-700-italic.woff2', weight: '700', style: 'italic' },
    { path: './fonts/playfair-display-latin-900-normal.woff2', weight: '900', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-playfair_display',
});

const dancingScript = localFont({
  src: [
    { path: './fonts/dancing-script-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/dancing-script-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-dancing_script',
});

export const viewport: Viewport = {
  themeColor: '#d71920',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://akproducciones.uy'),
  title: {
    default: 'AK Producciones | Organización Integral de Fiestas y Eventos en Salto',
    template: '%s | AK Producciones',
  },
  description: 'Organización completa de bodas, fiestas de 15 años y eventos empresariales en Salto, Uruguay. Discoteca, gastronomía gourmet, fotografía y salones de fiesta con tecnología interactiva.',
  keywords: [
    'fiestas de 15 salto',
    'organización de eventos salto uruguay',
    'bodas salto',
    'discoteca salto',
    'catering salto',
    'salon club uruguay salto',
    'ak producciones',
  ],
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'AK Producciones | Fiestas y Eventos en Salto',
    description: 'Producción integral de 15 años, bodas y eventos en Salto, Uruguay. Viví tu fiesta como un invitado más.',
    url: 'https://akproducciones.uy',
    siteName: 'AK Producciones',
    locale: 'es_UY',
    type: 'website',
    images: [
      {
        url: '/media/catalogo-servicios/quinceanera_hero.png',
        width: 1200,
        height: 630,
        alt: 'AK Producciones Eventos Salto',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AK Producciones | Fiestas y Eventos en Salto',
    description: 'Producción integral de 15 años, bodas y eventos en Salto, Uruguay.',
    images: ['/media/catalogo-servicios/quinceanera_hero.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AK Producciones',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
  /**
   * Verificaciones de dominio. Son etiquetas publicas a proposito: aparecen en
   * el codigo de la pagina para que Google y Pinterest confirmen que el sitio es
   * de la empresa. No son claves y no dan acceso a nada.
   */
  verification: {
    ...getSearchConsoleVerification(),
    other: {
      'p:domain_verify': '63a807fc1e918f1541a865a1794e7852',
    },
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${belleza.variable} ${playfairDisplay.variable} ${dancingScript.variable}`}>
      <head>
        <LocalBusinessSchema />
      </head>
      <body className="ak-motion-system font-body antialiased">
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <DeploymentRecovery />
        {children}
        <AsistenteVirtual />
        <Toaster />
      </body>
    </html>
  );
}
