import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Camera, HeartHandshake, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const storyCards = [
  {
    title: 'Planificación Profesional',
    text: 'Un organizador experto escucha tu idea, proyecta el presupuesto y planifica cada paso de forma ordenada.',
    image: '/media/catalogo-servicios/organizador_equipo.png',
  },
  {
    title: 'Coordinación y Montaje',
    text: 'Nuestro equipo monta la decoración, la gastronomía, la discoteca y la tecnología bajo un control estricto.',
    image: '/media/catalogo-servicios/montaje_equipo.png',
  },
  {
    title: 'Festejo en Familia',
    text: 'Creamos la puesta en escena perfecta para que tu familia disfrute sin estrés, guardando recuerdos inolvidables.',
    image: '/media/catalogo-servicios/familia_feliz_evento.png',
  },
];

const blogIdeas = [
  'Cómo organizar una fiesta sin estrés',
  'Qué mirar antes de reservar el salón',
  'Cómo crear una experiencia digital',
  'Qué preguntas hacer antes de contratar',
];

export function AkTeamStorySection() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 text-white border-y border-white/5">
      {/* Glow blobs */}
      <div className="absolute top-1/2 left-0 h-96 w-96 rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Grid */}
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-end mb-16">
          <div className="text-left space-y-4">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-400 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-red-500" />
              Equipo y Método
            </span>
            <h2 className="font-headline text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
              Detrás de una buena fiesta hay equipo y criterio
            </h2>
            <p className="text-lg leading-relaxed text-zinc-400 font-medium max-w-xl">
              Planificamos y ejecutamos cada detalle de tu evento con un método probado que garantiza tranquilidad, orden y un resultado espectacular.
            </p>
          </div>
          
          <div className="grid gap-3.5 sm:grid-cols-3 text-left">
            {[
              { icon: HeartHandshake, label: 'Acompañamiento real' },
              { icon: Camera, label: 'Fotos y recuerdos' },
              { icon: Sparkles, label: 'Tecnología propia' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.03] hover:border-white/10"
                >
                  <Icon className="mb-4 h-6 w-6 text-red-400" />
                  <p className="text-xs font-black text-white uppercase tracking-widest leading-normal">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Story Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {storyCards.map((card) => (
            <article
              key={card.title}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/30 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-red-500/25"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              </div>
              <div className="p-7 text-left space-y-3">
                <h3 className="text-xl font-black text-white font-headline group-hover:text-red-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-zinc-400">
                  {card.text}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Resources Banner Box */}
        <div className="mt-12 grid gap-6 rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900/40 to-slate-950 border border-white/10 p-7 text-left shadow-2xl lg:grid-cols-[1fr_1.3fr] lg:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-red-600/5 blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="inline-flex rounded-2xl bg-red-950/40 border border-red-500/25 p-3.5 text-red-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-3xl font-black font-headline text-white">Guías útiles y consejos</h3>
            <p className="text-sm font-medium leading-relaxed text-zinc-400 max-w-md">
              Descubrí nuestras guías completas para sacarte todas las dudas sobre presupuestos, distribución de mesas, comida e iluminación.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 items-center">
            {blogIdeas.map((idea) => (
              <div
                key={idea}
                className="rounded-2xl bg-white/[0.02] border border-white/5 px-5 py-4 text-xs font-black uppercase tracking-wider text-zinc-300"
              >
                {idea}
              </div>
            ))}
            <Link
              href="/blog"
              className={cn(
                'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-700 px-6 text-xs font-black uppercase tracking-widest text-white transition-all shadow-md',
                'hover:bg-red-800 hover:scale-[1.02] active:scale-[0.98]',
                'sm:col-span-2'
              )}
            >
              Ver contenido público
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}

