import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = 'https://akproducciones.uy';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'AK Producciones en Salto | Enlaces, Presupuesto y Contacto',
  description:
    'Armá tu presupuesto de fiesta al instante, mirá nuestras celebraciones en Salto y escribinos directo por WhatsApp.',
  alternates: { canonical: '/enlaces' },
  openGraph: {
    title: 'AK Producciones en Salto | Enlaces, Presupuesto y Contacto',
    description:
      'Armá tu presupuesto de fiesta al instante, mirá nuestras celebraciones en Salto y escribinos directo por WhatsApp.',
    type: 'website',
    url: `${SITE_URL}/enlaces`,
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
  },
};

export default function EnlacesPage() {

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">AK Producciones</h1>
          <p className="text-sm text-neutral-400">Todo para tu fiesta en un solo lugar</p>
        </div>

        <div className="w-full flex flex-col space-y-4">
          <Link
            href="/api/enlaces/clic?d=presupuesto"
            className="w-full py-4 px-6 bg-white text-black font-semibold rounded-2xl text-center shadow-lg hover:bg-neutral-200 transition"
          >
            Armá tu presupuesto
          </Link>

          <Link
            href="/api/enlaces/clic?d=fiestas"
            className="w-full py-4 px-6 bg-neutral-900 border border-neutral-800 text-white font-semibold rounded-2xl text-center shadow-lg hover:bg-neutral-800 transition"
          >
            Mirá nuestras fiestas
          </Link>

          <a
            href={`/api/enlaces/clic?d=whatsapp`}
            className="w-full py-4 px-6 bg-emerald-600 text-white font-semibold rounded-2xl text-center shadow-lg hover:bg-emerald-500 transition"
          >
            Escribinos por WhatsApp
          </a>

          <Link
            href="/api/enlaces/clic?d=redes"
            className="w-full py-4 px-6 bg-neutral-900 border border-neutral-800 text-white font-semibold rounded-2xl text-center shadow-lg hover:bg-neutral-800 transition"
          >
            Instagram / Facebook
          </Link>
        </div>

        <footer className="text-xs text-neutral-500 pt-8 text-center">
          © AK Producciones. Todos los derechos reservados.
        </footer>
      </div>
    </main>
  );
}
