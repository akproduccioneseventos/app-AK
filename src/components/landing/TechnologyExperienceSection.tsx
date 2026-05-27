import Image from 'next/image';
import Link from 'next/link';
import {
  Camera,
  CheckCircle2,
  Globe,
  Monitor,
  QrCode,
  RotateCcw,
  Share2,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const techCards = [
  {
    title: 'Portal del cliente',
    copy: 'El cliente ve pagos, tareas, reuniones, musica, invitados y avances sin perderse.',
    icon: Users,
    tone: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    title: 'Invitacion web',
    copy: 'Cada fiesta tiene una pagina viva con RSVP, ubicacion, fotos, musica y detalles.',
    icon: Globe,
    tone: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    title: 'Muro social',
    copy: 'Los invitados suben contenido, participan y lo ven en pantalla gigante.',
    icon: Monitor,
    tone: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  },
  {
    title: 'Entretenimiento live',
    copy: 'Fotocabina, 360, Bogue y Espejo Magico con QR, marca del evento y salida lista para compartir.',
    icon: Camera,
    tone: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    title: 'Zona digital adolescente',
    copy: 'Retos, juegos, emojis, ranking y votaciones para que los invitados participen desde el celular.',
    icon: Sparkles,
    tone: 'bg-pink-50 text-pink-700 border-pink-100',
  },
  {
    title: 'Totems y barra tactil',
    copy: 'Pantallas sincronizadas, QR, fondos movibles y pedidos de tragos conectados con barman y muro.',
    icon: Smartphone,
    tone: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  },
  {
    title: 'Landing de campana',
    copy: 'Paginas de aterrizaje para anuncios con WhatsApp directo, mensaje precargado y foco en conversion.',
    icon: Share2,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
];

const semanticMap = [
  'Decoracion',
  'Catering',
  'Foto y video',
  'Fotocabina',
  'Plataforma 360',
  'Bogue',
  'Espejo Magico',
  'Zona digital',
  'Retos y juegos',
  'Barra tactil',
  'Totems',
  'Modo audiorritmico',
  'Musica',
  'Invitados',
  'Check-in QR',
  'Pantalla LED',
  'Portal cliente',
  'Portal invitado',
  'Post-evento',
];

interface TechnologyExperienceSectionProps {
  whatsappNumber?: string;
}

export function TechnologyExperienceSection({ whatsappNumber = '59898355530' }: TechnologyExperienceSectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hola AK Producciones, quiero conocer la experiencia tecnologica para mi fiesta.'
  )}`;

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <div className="absolute inset-0 opacity-60">
        <Image
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1800&q=85&auto=format&fit=crop"
          alt="Fiesta con luces y pantalla"
          fill
          className="object-cover"
          sizes="100vw"
          data-ai-hint="event lights crowd"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,6,23,0.96)_0%,rgba(15,23,42,0.86)_52%,rgba(30,41,59,0.58)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <div className="space-y-8">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-blue-200">
              Tecnologia que vende y se ve en la fiesta
            </p>
            <h2 className="font-headline text-5xl font-black leading-none sm:text-6xl">
              AK no solo organiza: convierte la fiesta en una experiencia conectada
            </h2>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-white/70">
              No es solamente organizar. Es mostrarle al cliente una fiesta conectada: portal, invitacion, muro social,
              pantalla gigante, fotocabina, plataforma 360 y paginas de campana trabajando como un solo sistema comercial.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {techCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                  <div className={cn('mb-4 inline-flex rounded-xl border p-3', card.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-black">{card.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-white/60">{card.copy}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-white px-6 font-black uppercase tracking-widest text-slate-950 shadow-2xl transition hover:-translate-y-0.5"
            >
              <Share2 className="h-5 w-5" />
              Consultar experiencia
            </a>
            <Link
              href="/landing/tecnologia-ak"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 font-black uppercase tracking-widest text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              Ver landing tech
            </Link>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-4 md:grid-cols-[.78fr_1fr]">
              <div className="rounded-[1.75rem] bg-slate-950/80 p-4">
                <div className="mx-auto max-w-[220px] rounded-[2rem] border border-white/15 bg-slate-900 p-3">
                  <div className="aspect-[9/16] rounded-[1.5rem] bg-gradient-to-b from-slate-800 via-indigo-950 to-slate-950 p-4">
                    <div className="flex h-full flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                        <span>Invitado</span>
                        <QrCode className="h-4 w-4" />
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-2xl bg-white/10 p-4">
                          <Smartphone className="mb-3 h-7 w-7 text-blue-200" />
                          <p className="text-xl font-black">Portal vivo</p>
                          <p className="mt-1 text-xs font-semibold text-white/60">RSVP, mesa, fotos y muro.</p>
                        </div>
                        <div className="rounded-2xl bg-white p-3 text-slate-950">
                          <div className="flex items-center gap-2">
                            <RotateCcw className="h-4 w-4 text-violet-700" />
                            <span className="text-xs font-black uppercase tracking-widest">Clip 360 listo</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white p-4 text-slate-950 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Mapa de fiesta</p>
                      <h3 className="text-2xl font-black">Todo conectado</h3>
                    </div>
                    <Sparkles className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {semanticMap.map((item, index) => (
                      <span
                        key={item}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-widest',
                          index % 3 === 0 && 'border-blue-100 bg-blue-50 text-blue-700',
                          index % 3 === 1 && 'border-amber-100 bg-amber-50 text-amber-700',
                          index % 3 === 2 && 'border-violet-100 bg-violet-50 text-violet-700'
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {['Antes', 'Durante', 'Despues'].map((stage, index) => (
                    <div key={stage} className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                      <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-300" />
                      <p className="text-lg font-black">{stage}</p>
                      <p className="mt-1 text-xs font-semibold text-white/60">
                        {index === 0 && 'Cliente e invitados reciben claridad.'}
                        {index === 1 && 'Pantalla, QR y contenido en vivo.'}
                        {index === 2 && 'Galeria, recuerdos y referidos.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
