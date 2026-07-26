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
import {
  appendCommercialAttribution,
  describeCommercialSource,
} from '@/lib/commercial/acquisition';

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
    `Llegué desde: ${sourceLabel}.`,
    'Prefiero que me orienten antes de simular.',
  ].join('\n');

  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <section id="simuladores" className="border-y border-white/5 bg-zinc-950 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-red-400">
            Tu evento a medida
          </p>
          <h2 className="text-4xl font-black leading-tight sm:text-6xl font-headline">
            Diseñá tu fiesta en minutos
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
            Los dos simuladores usan los servicios y precios configurados por AK. Cambia la forma de recorrerlos:
            conversando con Sofía o eligiendo cada opción visualmente.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Simulador IA */}
          <article className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-7 text-white sm:p-10">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-700 text-white">
                <Bot className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-red-400">Asistente IA</p>
              <h3 className="mt-3 text-3xl font-black sm:text-4xl font-headline">Hablá con Sofía</h3>
              <p className="mt-4 text-base leading-relaxed text-zinc-400">
                Sofía pregunta fecha, tipo de fiesta, invitados, duración, menú y servicios. Al final arma una
                referencia de presupuesto que podés descargar.
              </p>
              <ul className="mt-7 space-y-3 text-sm font-semibold text-zinc-300">
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  Ideal si preferís que te guíen.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  Permite preguntar y cambiar decisiones.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  Termina en presupuesto y seguimiento.
                </li>
              </ul>
            </div>
            <Link
              href={assistantHref}
              className="mt-10 inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-red-700 px-6 text-sm font-black uppercase tracking-widest text-white transition hover:bg-red-800"
            >
              Conversar con Sofía <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </article>

          {/* Cotizador Visual */}
          <article className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-7 text-white sm:p-10">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600 text-white">
                <Calculator className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-400">Cotizador visual</p>
              <h3 className="mt-3 text-3xl font-black sm:text-4xl font-headline">Armá tu propuesta</h3>
              <p className="mt-4 text-base leading-relaxed text-zinc-400">
                Recorré menús, paquetes y servicios con controles visuales. Ves cómo cambia la propuesta y comparás
                alternativas antes de descargarla.
              </p>
              <ul className="mt-7 space-y-3 text-sm font-semibold text-zinc-300">
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                  Ideal si querés explorar por tu cuenta.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                  Muestra opciones y precios paso a paso.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                  Usa el mismo catálogo real que Sofía.
                </li>
              </ul>
            </div>
            <Link
              href={visualHref}
              className="mt-10 inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-rose-600 px-6 text-sm font-black uppercase tracking-widest text-white transition hover:bg-rose-700 shadow-md shadow-rose-600/20"
            >
              Usar cotizador visual <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </article>
        </div>

        {/* Orientación */}
        <div className="mt-6 flex flex-col items-start justify-between gap-5 border-y border-white/5 py-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-black text-white">¿No sabés por dónde empezar?</p>
              <p className="mt-1 text-sm text-zinc-400">
                Un asesor puede orientarte y después dejarte el simulador preparado.
              </p>
            </div>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hablar con AK por WhatsApp (abre en nueva ventana)"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-5 text-sm font-black text-emerald-400 transition hover:bg-emerald-950/40 sm:w-auto"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" /> Hablar con AK
          </a>
        </div>

        <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-zinc-500">
          <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
          El presupuesto del simulador es una referencia y AK valida disponibilidad, menú y detalles antes del cierre.
        </div>
      </div>
    </section>
  );
}
