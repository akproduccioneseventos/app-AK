import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Calculator,
  LayoutDashboard,
  Smartphone,
  Ticket,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

interface TechnologyExperienceSectionProps {
  whatsappNumber?: string;
}

const techFeatures = [
  {
    icon: Smartphone,
    title: 'Portal de Cliente PRO',
    description: 'Contratos, pagos, reuniones y plano de mesas en una vista clara para la familia.',
    cta: 'Demo del portal',
    href: '/portal-cliente/demo',
  },
  {
    icon: Calculator,
    title: 'Simulador instantáneo',
    description: 'Armá tu fiesta ideal y conocé una estimación profesional sin esperar una cotización.',
    cta: 'Probar simulador',
    href: '/simulador-ak',
  },
  {
    icon: Bot,
    title: 'Asistencia inteligente',
    description: 'Respuestas rápidas y seguimiento para resolver dudas durante la organización.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda sincronizada',
    description: 'Reuniones, degustaciones y fechas importantes ordenadas en un mismo calendario.',
  },
  {
    icon: Ticket,
    title: 'Invitaciones digitales',
    description: 'Invitaciones con QR, confirmación, cronograma, dress code y cuenta regresiva.',
  },
  {
    icon: LayoutDashboard,
    title: 'Control del evento',
    description: 'El equipo AK coordina tiempos, mesas, personal e incidencias desde una vista operativa.',
  },
];

export default function TechnologyExperienceSection({
  whatsappNumber = '59898355530',
}: TechnologyExperienceSectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    '¡Hola! Me interesa saber más sobre la tecnología incluida en las fiestas.',
  )}`;

  return (
    <section
      id="tecnologia"
      className="ak-deferred-section relative overflow-hidden border-y border-white/10 bg-zinc-950 py-20 text-white"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <span className="mb-5 inline-flex items-center gap-2 border-l-2 border-red-500 pl-3 text-xs font-bold uppercase text-red-300">
            <Bot className="h-4 w-4" />
            Tecnología al servicio del evento
          </span>
          <h2 className="mb-5 text-3xl font-black text-white sm:text-5xl font-headline">
            Una organización más clara antes, durante y después.
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">
            Herramientas concretas para conectar a la familia, los invitados y el equipo AK sin agregar complejidad.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 md:grid-cols-2 lg:grid-cols-3">
          {techFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group bg-zinc-950 p-7 transition-colors duration-200 hover:bg-zinc-900"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                  <Icon className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-white">{feature.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-zinc-400">{feature.description}</p>

                {feature.href && (
                  <Link
                    href={feature.href}
                    className="inline-flex items-center text-sm font-bold text-red-300 transition-colors hover:text-white"
                  >
                    {feature.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative flex flex-col items-start justify-between gap-8 border-t border-zinc-800 py-8 md:flex-row md:items-center">
          <div className="relative z-10 max-w-xl">
            <h3 className="mb-3 text-2xl font-black text-white sm:text-3xl">
              Tecnología incluida, sin costos escondidos.
            </h3>
            <p className="text-lg text-zinc-400">
              No pagás licencias extra ni necesitás aplicaciones complicadas. Tu evento queda conectado desde el primer día.
            </p>
          </div>

          <div className="relative z-10 flex w-full shrink-0 flex-col gap-3 sm:flex-row md:w-auto">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-lg bg-red-700 px-7 text-base font-black text-white hover:bg-red-600"
            >
              <Link href="/simulador-ak" className="w-full sm:w-auto">
                Probar simulador
              </Link>
            </Button>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-lg border-zinc-700 bg-transparent px-7 text-base font-bold text-white hover:bg-zinc-900 hover:text-white"
              >
                Consultar ahora
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
