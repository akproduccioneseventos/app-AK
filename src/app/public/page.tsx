import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { PublicNav } from '@/components/public/PublicNav';
import { EventCatalogCard } from '@/components/public/EventCatalogCard';
import { PublicFooter } from '@/components/public-footer';
import { allCatalogs } from '@/data/event-catalogs';

export const metadata: Metadata = {
  title: 'Catálogo de Eventos — AK Producciones',
  description:
    'Descubrí todos nuestros servicios: Bodas, XV Años, Cumpleaños, Eventos Corporativos y más. AK Producciones — producción integral de eventos en Uruguay.',
  openGraph: {
    title: 'Catálogo de Eventos — AK Producciones',
    description: 'Producción integral de eventos en Uruguay. ¡Elegí tu tipo de evento y cotizá!',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'AK Producciones Eventos',
      },
    ],
  },
};

const WHATSAPP_NUMBER = '59899123456';

export default function PublicCatalogPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav whatsappNumber={WHATSAPP_NUMBER} />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AK Producciones — Uruguay
          </div>
          <h1 className="font-headline text-5xl sm:text-6xl font-black text-slate-900 leading-tight">
            ¿Qué tipo de evento <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              querés celebrar?
            </span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            Elegí tu tipo de evento y descubrí todos los paquetes disponibles.
            Producción integral con calidad premium en Uruguay.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                '¡Hola AK Producciones! Me gustaría cotizar mi evento.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors shadow-lg"
            >
              <MessageSquare className="w-5 h-5" />
              Cotizar por WhatsApp
            </a>
            <Link
              href="/simulador-de-presupuesto"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-colors shadow"
            >
              Simulador de Presupuesto
            </Link>
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {allCatalogs.map((catalog) => (
            <EventCatalogCard
              key={catalog.id}
              catalog={catalog}
              whatsappNumber={WHATSAPP_NUMBER}
            />
          ))}
        </div>
      </section>

      <PublicFooter variant="light" />
    </div>
  );
}
