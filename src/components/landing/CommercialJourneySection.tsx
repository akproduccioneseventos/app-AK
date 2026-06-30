import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Calculator,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import type { CommercialAttribution } from '@/lib/commercial/acquisition';
import { appendCommercialAttribution, describeCommercialSource } from '@/lib/commercial/acquisition';

interface CommercialJourneySectionProps {
  attribution: CommercialAttribution;
  whatsappNumber: string;
}

export function CommercialJourneySection({
  attribution,
  whatsappNumber,
}: CommercialJourneySectionProps) {
  const assistantHref = appendCommercialAttribution('/simulador-ak', {
    ...attribution,
    entryPath: '/landing',
    simulatorMode: 'assistant',
  });
  const visualHref = appendCommercialAttribution('/simulador-de-presupuesto', {
    ...attribution,
    entryPath: '/landing',
    simulatorMode: 'visual',
  });
  const sourceLabel = describeCommercialSource(attribution);
  const whatsappText = [
    'Hola AK Producciones, quiero organizar una fiesta.',
    `Llegue desde: ${sourceLabel}.`,
    'Prefiero que me orienten antes de simular.',
  ].join('\n');
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <section id="simuladores" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-indigo-600">
            Tu evento a medida
          </p>
          <h2 className="text-4xl font-black leading-tight text-slate-950 sm:text-6xl font-headline">
            Diseñá tu fiesta en minutos
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Los dos simuladores usan los servicios y precios configurados por AK. Cambia la forma de recorrerlos:
            conversando con Sofia o eligiendo cada opcion visualmente.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-lg bg-slate-950 p-7 text-white sm:p-10">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Bot className="h-7 w-7" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-300">Asistente IA</p>
              <h3 className="mt-3 text-3xl font-black sm:text-4xl font-headline">Hablá con Sofía</h3>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Sofia pregunta fecha, tipo de fiesta, invitados, duracion, menu y servicios. Al final arma una
                referencia de presupuesto que podes descargar.
              </p>
              <ul className="mt-7 space-y-3 text-sm font-semibold text-slate-200">
                <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />Ideal si preferis que te guien.</li>
                <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />Permite preguntar y cambiar decisiones.</li>
                <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />Termina en presupuesto y seguimiento.</li>
              </ul>
            </div>
            <Link
              href={assistantHref}
              className="mt-10 inline-flex min-h-14 items-center justify-center gap-3 rounded-lg bg-white px-6 text-sm font-black uppercase tracking-widest text-slate-950 transition hover:bg-indigo-50"
            >
              Conversar con Sofía <ArrowRight className="h-5 w-5" />
            </Link>
          </article>

          <article className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-7 text-slate-950 sm:p-10">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-lg bg-purple-600 text-white">
                <Calculator className="h-7 w-7" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-600">Cotizador visual</p>
              <h3 className="mt-3 text-3xl font-black sm:text-4xl font-headline">Armá tu propuesta</h3>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Recorre menus, paquetes y servicios con controles visuales. Ves como cambia la propuesta y comparas
                alternativas antes de descargarla.
              </p>
              <ul className="mt-7 space-y-3 text-sm font-semibold text-slate-700">
                <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-red-600" />Ideal si queres explorar por tu cuenta.</li>
                <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-red-600" />Muestra opciones y precios paso a paso.</li>
                <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-red-600" />Usa el mismo catalogo real que Sofia.</li>
              </ul>
            </div>
            <Link
              href={visualHref}
              className="mt-10 inline-flex min-h-14 items-center justify-center gap-3 rounded-lg bg-purple-600 px-6 text-sm font-black uppercase tracking-widest text-white transition hover:bg-purple-700 shadow-md shadow-purple-600/20"
            >
              Usar cotizador visual <ArrowRight className="h-5 w-5" />
            </Link>
          </article>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-5 border-y border-slate-200 py-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-slate-950">No sabes por donde empezar?</p>
              <p className="mt-1 text-sm text-slate-600">
                Un asesor puede orientarte y despues dejarte el simulador preparado.
              </p>
            </div>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
          >
            <MessageCircle className="h-5 w-5" /> Hablar con AK
          </a>
        </div>

        <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-slate-500">
          <Sparkles className="h-5 w-5 text-amber-500" />
          El presupuesto del simulador es una referencia y AK valida disponibilidad, menu y detalles antes del cierre.
        </div>
      </div>
    </section>
  );
}
