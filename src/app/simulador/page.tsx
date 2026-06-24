import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bot, Calculator, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';
import {
  appendCommercialAttribution,
  commercialAttributionFromRecord,
  describeCommercialSource,
} from '@/lib/commercial/acquisition';

type SimulatorHubProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const options = [
  {
    id: 'assistant',
    title: 'Conversar con Sofia',
    description: 'Sofia te hace las preguntas necesarias y arma una referencia con el catalogo real de AK.',
    href: '/simulador-ak',
    icon: Bot,
    accent: 'bg-fuchsia-600',
    features: ['Conversacion guiada', 'Ideal para empezar sin saber que elegir', 'Presupuesto descargable'],
  },
  {
    id: 'visual',
    title: 'Armar la propuesta',
    description: 'Compara menu, paquetes y tecnologia mientras ves como cambia el presupuesto.',
    href: '/simulador-de-presupuesto',
    icon: Calculator,
    accent: 'bg-red-600',
    features: ['Seleccion visual', 'Catalogo y precios configurados por AK', 'LED y entretenimiento incluidos'],
  },
] as const;

export default async function SimulatorHubPage(props: SimulatorHubProps) {
  const searchParams = await props.searchParams;
  const attribution = commercialAttributionFromRecord(searchParams, 'direct');
  const sourceLabel = describeCommercialSource(attribution);
  const whatsappText = [
    'Hola AK Producciones, quiero que me orienten para organizar mi evento.',
    `Llegue desde: ${sourceLabel}.`,
  ].join('\n');
  const whatsappHref = `https://wa.me/59898355530?text=${encodeURIComponent(whatsappText)}`;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative min-h-[42vh] overflow-hidden bg-slate-950 text-white">
        <Image
          src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1800&q=86"
          alt="Fiesta producida por AK"
          fill
          priority
          unoptimized
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative mx-auto flex min-h-[42vh] max-w-7xl flex-col justify-end px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Presupuesto AK</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
            Elegi como queres construir tu fiesta
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/80 sm:text-lg">
            Los dos simuladores usan la misma configuracion real. Cambia la forma de recorrerla.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {options.map((option) => {
            const Icon = option.icon;
            const href = appendCommercialAttribution(option.href, {
              ...attribution,
              entryPath: '/simulador',
              simulatorMode: option.id,
            });
            return (
              <article key={option.id} className="flex min-h-[420px] flex-col border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <span className={`flex h-14 w-14 items-center justify-center rounded-lg text-white ${option.accent}`}>
                  <Icon className="h-7 w-7" />
                </span>
                <h2 className="mt-7 text-3xl font-black">{option.title}</h2>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">{option.description}</p>
                <ul className="mt-7 space-y-3">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className="mt-auto inline-flex min-h-14 items-center justify-center gap-3 rounded-lg bg-slate-950 px-5 text-sm font-black uppercase tracking-widest text-white transition hover:bg-red-700"
                >
                  Empezar <ArrowRight className="h-5 w-5" />
                </Link>
              </article>
            );
          })}

          <article className="flex min-h-[420px] flex-col border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <MessageCircle className="h-7 w-7" />
            </span>
            <h2 className="mt-7 text-3xl font-black">Hablar con un asesor</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
              Para eventos complejos, condiciones especiales o cuando preferis resolverlo directamente con el equipo.
            </p>
            <div className="mt-7 flex gap-3 border-y border-emerald-200 py-5 text-sm font-bold text-emerald-900">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              El equipo revisa disponibilidad, menu, salon y tecnologia antes de confirmar.
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex min-h-14 items-center justify-center gap-3 rounded-lg bg-emerald-700 px-5 text-sm font-black uppercase tracking-widest text-white transition hover:bg-emerald-800"
            >
              Abrir WhatsApp <ArrowRight className="h-5 w-5" />
            </a>
          </article>
        </div>
      </section>
    </main>
  );
}
