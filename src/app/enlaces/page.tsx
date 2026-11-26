import React from 'react';
import type { Metadata } from 'next';
import { BajaLaApp } from '@/components/BajaLaApp';
import { BotonComoFunciona } from '@/components/tutorial/BotonComoFunciona';

const SITE_URL = 'https://akproducciones.uy';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { absolute: 'AK Producciones en Salto | Enlaces, Presupuesto y Contacto' },
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
    images: [
      {
        url: '/media/catalogo-servicios/quinceanera_hero.png',
        width: 1200,
        height: 630,
        alt: 'AK Producciones Eventos en Salto',
      },
    ],
  },
};

export default function EnlacesPage() {

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">AK Producciones</h1>
          <p className="text-sm text-neutral-400">Todo para tu fiesta en un solo lugar</p>
          <div className="pt-1 flex justify-center">
            <BotonComoFunciona clave="enlaces-bio" variant="dark" />
          </div>
        </div>

        <div className="w-full flex flex-col space-y-4">
          <h2 className="text-center text-xs font-bold uppercase tracking-widest text-neutral-400">
            Lo que hacemos
          </h2>
          <a
            href="/api/enlaces/clic?d=presupuesto"
            className="w-full py-4 px-6 bg-white text-black font-semibold rounded-2xl text-center shadow-lg hover:bg-neutral-200 transition"
          >
            Armá tu presupuesto
          </a>

          <a
            href="/api/enlaces/clic?d=fiestas"
            className="w-full py-4 px-6 bg-neutral-900 border border-neutral-800 text-white font-semibold rounded-2xl text-center shadow-lg hover:bg-neutral-800 transition"
          >
            Mirá nuestras fiestas
          </a>

          <a
            href={`/api/enlaces/clic?d=whatsapp`}
            className="w-full py-4 px-6 bg-emerald-600 text-white font-semibold rounded-2xl text-center shadow-lg hover:bg-emerald-500 transition"
          >
            Escribinos por WhatsApp
          </a>

          <a
            href="/api/enlaces/clic?d=redes"
            className="w-full py-4 px-6 bg-neutral-900 border border-neutral-800 text-white font-semibold rounded-2xl text-center shadow-lg hover:bg-neutral-800 transition"
          >
            Instagram / Facebook
          </a>

          <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 text-center">
            <p className="mb-2 text-xs font-semibold text-neutral-300">Bajá la app de AK</p>
            <BajaLaApp />
          </div>
        </div>

        <footer className="text-xs text-neutral-500 pt-8 text-center">
          © AK Producciones. Todos los derechos reservados.
        </footer>
      </div>
    </main>
  );
}
