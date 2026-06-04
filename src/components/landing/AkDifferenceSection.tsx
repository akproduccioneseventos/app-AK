import Image from 'next/image';
import { CalendarCheck, CheckCircle2, ClipboardList, Gem, Sparkles, Users } from 'lucide-react';

const benefits = [
  {
    title: 'Organizamos la fiesta por vos',
    text: 'AK coordina salón, servicios, tiempos, proveedores, equipo y detalles para que la familia no cargue con todo.',
    icon: ClipboardList,
  },
  {
    title: 'Todos los servicios conectados',
    text: 'Decoración, catering, DJ, foto, video, entretenimiento, pantalla, invitación y portal trabajan bajo una misma planificación.',
    icon: Sparkles,
  },
  {
    title: 'Salón y producción en un lugar',
    text: 'La propuesta no queda partida entre proveedores sueltos: el cliente ve una solución completa y controlada.',
    icon: Gem,
  },
  {
    title: 'Equipo organizador presente',
    text: 'Antes, durante y después del evento hay responsables cuidando agenda, pagos, cambios, montaje y cierre.',
    icon: Users,
  },
];

const differentiators = [
  'Una sola reunión puede ordenar presupuesto, salón, servicios y próximos pasos.',
  'La familia ve avances, pagos, contrato y tareas sin perder conversaciones.',
  'La pantalla LED, QR, muro social y entretenimiento convierten la fiesta en experiencia.',
  'Después del evento quedan galería, recuerdos y contenido para compartir.',
];

export function AkDifferenceSection() {
  return (
    <section className="overflow-hidden bg-slate-950 py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:px-8">
        <div className="space-y-7">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-amber-200">Por qué AK es diferente</p>
            <h2 className="text-4xl font-black leading-tight sm:text-6xl">
              No vendemos servicios sueltos: resolvemos la fiesta completa
            </h2>
            <p className="mt-5 max-w-xl text-lg font-semibold leading-relaxed text-white/65">
              El diferencial de AK es que la familia no tiene que perseguir proveedores, comparar partes aisladas
              ni llegar al día del evento con dudas. La experiencia se piensa como un sistema completo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <Icon className="mb-4 h-6 w-6 text-amber-200" />
                  <h3 className="text-lg font-black">{benefit.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-white/60">{benefit.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl">
            <div className="grid gap-4 md:grid-cols-[.9fr_1.1fr]">
              <div className="relative min-h-[360px] overflow-hidden rounded-[1.6rem]">
                <Image
                  src="/media/catalogo-servicios/xv-decoracion-equipo-ak-01.jpeg"
                  alt="Equipo AK preparando una fiesta"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 42vw"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-5">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">Equipo de organización</p>
                  <p className="mt-2 text-2xl font-black">Personas cuidando detalles reales</p>
                </div>
              </div>
              <div className="relative min-h-[360px] overflow-hidden rounded-[1.6rem]">
                <Image
                  src="/media/catalogo-servicios/xv-pista-iluminada-01.jpeg"
                  alt="Pista iluminada AK"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 42vw"
                />
                <div className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-950 shadow-xl">
                  Salón + tecnología
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {differentiators.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-white p-4 text-slate-950">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm font-bold leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4">
            <CalendarCheck className="h-6 w-6 shrink-0 text-blue-200" />
            <p className="text-sm font-bold leading-relaxed text-white/70">
              La venta se apoya en tranquilidad: fecha, salón, servicios, presupuesto y coordinación quedan claros desde el inicio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
