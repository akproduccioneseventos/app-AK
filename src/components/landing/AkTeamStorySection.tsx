import Image from 'next/image';
import { Camera, HeartHandshake, Sparkles } from 'lucide-react';
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

export function AkTeamStorySection() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 text-white border-y border-white/5">
      {/* Glow blobs */}
      <div className="absolute top-1/2 left-0 h-96 w-96 rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-red-950/40 border border-red-500/25 text-xs font-black uppercase tracking-widest text-red-400">
            <HeartHandshake className="w-3.5 h-3.5" />
            Nuestra Historia y Compromiso
          </span>
          <h2 className="text-4xl sm:text-5xl font-black font-headline tracking-tight text-white">
            El valor de contar con un equipo completo
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 font-medium leading-relaxed">
            Desde la primera entrevista hasta el último tema de la noche, cada parte de la fiesta se coordina en conjunto para que no tengas que preocuparte por nada.
          </p>
        </div>

        {/* Narrative Cards */}
        <div className="grid gap-8 md:grid-cols-3 text-left">
          {storyCards.map((card) => (
            <article
              key={card.title}
              className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 p-2 transition-all hover:border-red-500/30 hover:bg-white/[0.06] hover:shadow-2xl"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-zinc-900 mb-6">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white border border-white/10">
                  <Sparkles className="w-3 h-3 text-red-400" />
                  Equipo AK
                </span>
              </div>

              <div className="px-5 pb-6 space-y-2">
                <h3 className="text-xl font-black font-headline text-white group-hover:text-red-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">
                  {card.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
