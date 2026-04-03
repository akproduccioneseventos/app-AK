import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare } from 'lucide-react';
import { catalogList } from '@/data/event-catalogs';
import { PublicFooter } from '@/components/public-footer';

export const metadata: Metadata = {
  title: 'Catálogo de Eventos | AK Producciones',
  description:
    'Bodas, XV Años, Fiestas, Cumpleaños, Eventos Corporativos y Aniversarios. Conocé todos nuestros servicios y paquetes.',
};

const WHATSAPP_NUMBER = '59899123456';
const WHATSAPP_MESSAGE =
  '¡Hola AK Producciones! Visité su catálogo y me gustaría consultar sobre sus servicios de eventos.';
const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export default function PublicCatalogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 font-body">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 shrink-0">
              <Image
                src="/logo_ak_producciones.png"
                alt="AK Producciones"
                fill
                className="object-contain"
                sizes="36px"
              />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-slate-800 hidden sm:block">
              AK Producciones
            </span>
          </div>

          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all duration-200 hover:scale-105 active:scale-95">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">¡Consultanos!</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-purple-200/25 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-pink-200/25 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          <div className="relative w-24 h-24 drop-shadow-xl">
            <Image
              src="/logo_ak_producciones.png"
              alt="AK Producciones"
              fill
              className="object-contain"
              sizes="96px"
            />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-2">
              Catálogo de Servicios
            </p>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
              🎉 AK Producciones
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
              Más de 10 años organizando los mejores eventos de Uruguay. Elegí el tipo de
              celebración y descubrí todo lo que podemos hacer por vos.
            </p>
          </div>

          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-base uppercase tracking-widest shadow-xl shadow-green-900/25 transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse hover:animate-none motion-reduce:animate-none">
              <MessageSquare className="w-5 h-5 shrink-0" />
              Consultanos por WhatsApp
            </button>
          </a>
        </div>
      </section>

      {/* Event type catalog grid */}
      <section className="py-12 px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              ¿Qué tipo de evento estás planeando?
            </h2>
            <p className="mt-2 text-slate-500">
              Tocá el tipo de evento para ver todos los detalles, paquetes y más.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogList.map((catalog) => (
              <Link
                key={catalog.slug}
                href={`/public/${catalog.slug}`}
                className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <span
                  className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow"
                  role="img"
                  aria-label={catalog.name}
                >
                  {catalog.hero.emoji}
                </span>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-purple-600 transition-colors duration-200">
                  {catalog.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">
                  {catalog.hero.subheadline}
                </p>
                <span className="mt-4 text-xs font-black uppercase tracking-wider text-purple-500 group-hover:underline">
                  Ver paquetes →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals strip */}
      <section className="py-8 px-4 bg-gradient-to-br from-slate-900 to-purple-950 text-white">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          {[
            { icon: '🏆', label: '+10 años de experiencia' },
            { icon: '🎉', label: '+500 eventos realizados' },
            { icon: '⭐', label: '100% clientes satisfechos' },
            { icon: '📍', label: 'Uruguay' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-3xl">{icon}</span>
              <p className="text-xs font-black uppercase tracking-wider text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter variant="light" />
    </div>
  );
}
