import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Camera, HeartHandshake, Sparkles } from 'lucide-react';

const storyCards = [
  {
    title: 'Organizador principal',
    text: 'Un responsable ordena la reunion, escucha la idea, baja el presupuesto a tierra y transforma deseos en pasos concretos.',
    image: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
  },
  {
    title: 'Equipo de montaje',
    text: 'La decoracion, la pista, la mesa principal, el catering y la tecnologia se preparan con una mirada integral.',
    image: '/media/catalogo-servicios/xv-mesa-principal-ak-02.jpeg',
  },
  {
    title: 'Experiencia visible',
    text: 'La familia no solo compra una lista: ve salon, fotos, demos, pantalla, portal y recuerdos posibles.',
    image: '/media/catalogo-servicios/candy-bar-completo-ak-02.jpeg',
  },
];

const blogIdeas = [
  'Como organizar una fiesta sin estres',
  'Que mirar antes de reservar salon',
  'Como vender una experiencia con pantalla LED',
  'Que preguntas hacer antes de cerrar un paquete',
];

export function AkTeamStorySection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-primary">Quienes organizan</p>
            <h2 className="text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
              Detras de una buena fiesta hay metodo, equipo y criterio
            </h2>
            <p className="mt-5 text-lg font-semibold leading-relaxed text-slate-500">
              La web debe mostrar que AK no improvisa: hay una forma de vender, planificar, montar, acompañar y cerrar cada evento.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: HeartHandshake, label: 'Acompanamiento real' },
              { icon: Camera, label: 'Fotos y recuerdos' },
              { icon: Sparkles, label: 'Tecnologia propia' },
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
                <h3 className="text-xl font-black text-slate-950">{card.title}</h3>
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
            <h3 className="text-3xl font-black">Blog y consejos que ayudan a vender</h3>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-white/60">
              El blog puede explicar beneficios, ordenar dudas frecuentes y llevar a WhatsApp con mejor contexto.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {blogIdeas.map((idea) => (
              <div key={idea} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950">
                {idea}
              </div>
            ))}
            <Link href="/landing/eventos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-white/15 sm:col-span-2">
              Ver contenido publico
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
