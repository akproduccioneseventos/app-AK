import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { PublicNav } from '@/components/public/PublicNav';
import { PackageCard } from '@/components/public/PackageCard';
import { PublicFooter } from '@/components/public-footer';
import { getCatalogBySlug, allCatalogs } from '@/data/event-catalogs';

interface Props {
  params: { eventType: string };
}

export async function generateStaticParams() {
  return allCatalogs.map((catalog) => ({ eventType: catalog.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const catalog = getCatalogBySlug(params.eventType);
  if (!catalog) return {};
  return {
    title: `${catalog.title} — AK Producciones`,
    description: catalog.description,
    openGraph: {
      title: `${catalog.title} — AK Producciones`,
      description: catalog.description,
      type: 'website',
      images: [{ url: catalog.heroImageUrl, width: 1200, height: 630, alt: catalog.title }],
    },
  };
}

const WHATSAPP_NUMBER = '59899123456';

export default function EventTypePage({ params }: Props) {
  const catalog = getCatalogBySlug(params.eventType);
  if (!catalog) notFound();

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(catalog.whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav whatsappNumber={WHATSAPP_NUMBER} />

      {/* Hero */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${catalog.heroImageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-5xl mx-auto shadow-lg">
            {catalog.emoji}
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-pink-300">{catalog.subtitle}</p>
          <h1 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight">
            {catalog.title}
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">{catalog.description}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors shadow-lg"
            >
              <MessageSquare className="w-5 h-5" />
              Cotizar por WhatsApp
            </a>
            <Link
              href="/public"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-colors backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Ver todos los eventos
            </Link>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10 space-y-2">
          <h2 className="font-headline text-3xl sm:text-4xl font-black text-slate-800">
            Nuestros Paquetes
          </h2>
          <p className="text-slate-500">
            Elegí el que más se adapte a tu sueño y te asesoramos sin compromiso.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {catalog.packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              accentColor={catalog.accentColor}
              whatsappNumber={WHATSAPP_NUMBER}
              whatsappMessage={catalog.whatsappMessage}
            />
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="bg-gradient-to-br from-purple-900 via-slate-900 to-fuchsia-900 py-16 text-center px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="font-headline text-3xl sm:text-4xl font-black text-white">
            ¿Listo para empezar?
          </h3>
          <p className="text-white/70 text-lg">
            Contáctanos y empezamos a planificar juntos el evento de tus sueños.
          </p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg transition-colors shadow-xl"
          >
            <MessageSquare className="w-6 h-6" />
            Cotizar Ahora
          </a>
        </div>
      </section>

      <PublicFooter variant="dark" />
    </div>
  );
}
