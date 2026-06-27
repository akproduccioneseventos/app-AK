import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Camera, HeartHandshake, Sparkles } from 'lucide-react';

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
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-primary">Quiénes organizan</p>
            <h2 className="text-4xl font-black leading-tight text-slate-950 sm:text-6xl font-headline">
              Detrás de una buena fiesta hay método, equipo y criterio
            </h2>
            <p className="mt-5 text-lg font-semibold leading-relaxed text-slate-500">
              Planificamos y ejecutamos cada detalle de tu evento con un método probado que garantiza tranquilidad, orden y un resultado espectacular.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: HeartHandshake, label: 'Acompañamiento real' },
              { icon: Camera, label: 'Fotos y recuerdos' },
              { icon: Sparkles, label: 'Tecnología propia' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <Icon className="mb-3 h-6 w-6 text-slate-950" />
                  <p className="text-sm font-black text-slate-900">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {storyCards.map((card) => (
            <article key={card.title} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
              <div className="relative aspect-[4/3]">
                <Image src={card.image} alt={card.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-black text-slate-950 font-headline">{card.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{card.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-5 rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl lg:grid-cols-[.7fr_1.3fr] lg:p-7">
          <div>
            <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3">
              <BookOpen className="h-6 w-6 text-amber-200" />
            </div>
            <h3 className="text-3xl font-black font-headline">Guías útiles y consejos prácticos</h3>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-white/60">
              Descubrí nuestras guías completas para sacarte todas las dudas sobre presupuestos, distribución de mesas, comida e iluminación.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {blogIdeas.map((idea) => (
              <div key={idea} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950">
                {idea}
              </div>
            ))}
            <Link href="/public/blog" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-white/15 sm:col-span-2">
              Ver contenido público
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
