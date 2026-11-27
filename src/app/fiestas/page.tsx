import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessageCircle, Sparkles } from 'lucide-react';
import { LandingNav } from '@/components/landing/LandingNav';
import { PublicFooter } from '@/components/public-footer';
import { FAQSection } from '@/components/landing/FAQSection';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { ServiceJsonLd } from '@/components/seo/ServiceJsonLd';
import { FAQJsonLd } from '@/components/seo/FAQJsonLd';
import { createEventLandingMetadata } from '@/lib/seo/event-landing';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import { BotonComoFunciona } from '@/components/tutorial/BotonComoFunciona';

export const metadata: Metadata = createEventLandingMetadata({
  slug: 'fiestas',
  title: 'Tipos de fiesta en Salto',
  description: 'Elegí tu tipo de fiesta en Salto: bodas, 15 años, cumpleaños, fiestas empresariales y fiestas infantiles. Un solo contacto, una sola seña y todos los servicios en un solo lugar.',
  image: '/media/catalogo-servicios/quinceanera_hero.png',
  imageAlt: 'Organización integral de fiestas y eventos en Salto, Uruguay',
});

const TIPOS_DE_FIESTA = [
  {
    id: 'bodas',
    badge: 'Casamientos',
    titulo: 'Bodas y Casamientos',
    descripcion: 'Salón, comida con vajilla y mobiliario, decoración, discoteca, fotografía, filmación y barra en un servicio integral para tu casamiento en Salto.',
    href: '/bodas',
    imagen: '/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg',
    alt: 'Decoración y armado de mesas para bodas en Salto por AK Producciones',
    ilustrativa: false,
    whatsappTexto: 'Hola AK Producciones, quiero consultar por bodas y casamientos en Salto.',
  },
  {
    id: 'quince',
    badge: '15 Años',
    titulo: 'Fiestas de 15 años',
    descripcion: 'Tu fiesta completa y personalizada con pista iluminada, decoración, comida, discoteca, fotografía, filmación, fotocabina, Vogue y plataforma 360.',
    href: '/quinceaneras',
    imagen: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
    alt: 'Fiesta de 15 años en Salto producida por AK Producciones',
    ilustrativa: false,
    whatsappTexto: 'Hola AK Producciones, quiero consultar por fiestas de 15 años en Salto.',
  },
  {
    id: 'cumpleanos',
    badge: 'Cumpleaños',
    titulo: 'Cumpleaños y fiestas',
    descripcion: 'Vos invitás y nosotros hacemos el resto: salón, comida, barra de tragos, discoteca con iluminación robótica, fotografía y cabinas.',
    href: '/cumpleanos',
    imagen: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
    alt: 'Discoteca e iluminación para cumpleaños y fiestas en Salto por AK Producciones',
    ilustrativa: false,
    whatsappTexto: 'Hola AK Producciones, quiero consultar por cumpleaños y fiestas en Salto.',
  },
  {
    id: 'empresas',
    badge: 'Empresariales',
    titulo: 'Fiestas empresariales',
    descripcion: 'Servicio integral para eventos y cenas de empresa en Salto: salón, organización, comida con vajilla y mobiliario, decoración, discoteca, fotografía y barra.',
    href: '/fiestas-empresariales',
    imagen: '/media/catalogo-servicios/corporativo_persuasivo.png',
    alt: 'Imagen ilustrativa de un evento empresarial',
    ilustrativa: true,
    whatsappTexto: 'Hola AK Producciones, quiero consultar por fiestas empresariales en Salto.',
  },
  {
    id: 'infantiles',
    badge: 'Infantiles',
    titulo: 'Fiestas infantiles',
    descripcion: 'Para que mamá y papá también disfruten: salón, organización, comida, decoración, discoteca, fotocabina y fotografía todo en un solo lugar.',
    href: '/fiestas-infantiles',
    imagen: '/media/catalogo-servicios/familia_feliz_evento.png',
    alt: 'Imagen ilustrativa de una fiesta infantil en familia',
    ilustrativa: true,
    whatsappTexto: 'Hola AK Producciones, quiero consultar por fiestas infantiles en Salto.',
  },
] as const;

const FIESTAS_FAQS = [
  {
    id: 'fiestas-faq-1',
    question: '¿Por qué organizar toda la fiesta con un solo equipo en Salto?',
    answer: 'En lugar de tener varias reuniones y pagar una seña distinta por cada servicio, con AK tenés un solo contacto, una sola reunión, una sola seña y una persona responsable toda la noche.',
  },
  {
    id: 'fiestas-faq-2',
    question: '¿Qué servicios reales ofrece AK Producciones?',
    answer: 'Salón de fiesta, organización, comida con vajilla y mobiliario, decoración, discoteca con iluminación robótica, fotografía, filmación, barra de tragos, fotocabina, Vogue y plataforma 360.',
  },
  {
    id: 'fiestas-faq-3',
    question: '¿Trabajan sólo en el Salón Club Uruguay o en otros salones de Salto?',
    answer: 'Trabajamos en el Salón Club Uruguay en el centro de Salto y también llevamos nuestros servicios a otros salones, chacras o domicilios de Salto y alrededores.',
  },
  {
    id: 'fiestas-faq-4',
    question: '¿Cómo puedo calcular un presupuesto preliminar?',
    answer: 'Podés usar nuestro simulador de presupuesto en línea eligiendo el tipo de fiesta, o escribirnos directo por WhatsApp para recibir una propuesta por escrito en pesos uruguayos.',
  },
];

export default function FiestasIndexPage() {
  const faqJsonLdItems = FIESTAS_FAQS.map(({ question, answer }) => ({
    question,
    answer,
  }));

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-zinc-900">
      <LocalBusinessJsonLd url="https://akproducciones.uy/fiestas" />
      <ServiceJsonLd
        name="Organización integral de fiestas y eventos en Salto"
        description="Salón, organización, comida con vajilla y mobiliario, decoración, discoteca, fotografía, filmación, barra de tragos, fotocabina, Vogue y plataforma 360 todo en un solo lugar."
        image="https://akproducciones.uy/media/catalogo-servicios/quinceanera_hero.png"
        url="https://akproducciones.uy/fiestas"
        serviceType="Event Planning"
      />
      <FAQJsonLd items={faqJsonLdItems} />
      <LandingNav />
      <main>
        <section className="bg-zinc-950 pt-28 pb-16 text-white sm:pt-36 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              AK Producciones · Salto, Uruguay
            </p>
            <h1 className="mt-4 max-w-3xl font-headline text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Tipos de fiesta en Salto: un solo contacto, toda tu fiesta
            </h1>
            <div className="mt-4">
              <BotonComoFunciona clave="paginas-por-tipo" variant="dark" />
            </div>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              Elegí la celebración que estás planeando en Salto y olvidate de coordinar proveedores por separado. Resolvemos salón, organización, comida con vajilla y mobiliario, decoración, discoteca, fotografía, filmación, barra de tragos, fotocabina, Vogue y plataforma 360 todo en un solo lugar.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5 text-xs font-semibold text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> Un solo contacto
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> Una sola reunión
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> Una sola seña
              </span>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/simulador-de-presupuesto"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-800"
              >
                <span className="truncate">Explorar opciones en el simulador</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
              <a
                href={`https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola AK Producciones, quiero consultar por una fiesta completa en Salto.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                <span className="truncate">Consultar por WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <p className="text-xs font-black uppercase tracking-widest text-red-700">
                Servicio integral por celebración
              </p>
              <h2 className="mt-2 font-headline text-2xl font-black text-zinc-950 sm:text-3xl">
                Elegí tu tipo de fiesta para ver qué incluye
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">
                Cada propuesta se adapta a tu fecha, tus invitados y tu presupuesto en pesos uruguayos, con la tranquilidad de llegar a disfrutar sin correr atrás de nada.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {TIPOS_DE_FIESTA.map((tipo) => {
                const waHref = `https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent(tipo.whatsappTexto)}`;
                return (
                  <article
                    key={tipo.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                      <Image
                        src={tipo.imagen}
                        alt={tipo.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-zinc-900 shadow-sm">
                        {tipo.badge}
                      </span>
                      {tipo.ilustrativa && (
                        <span className="absolute right-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white">
                          Imagen ilustrativa
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                      <div>
                        <h2 className="text-xl font-black text-zinc-950 transition-colors group-hover:text-red-700">
                          {tipo.titulo}
                        </h2>
                        <p className="mt-2.5 text-sm leading-relaxed text-zinc-600">{tipo.descripcion}</p>
                      </div>
                      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                        <Link
                          href={tipo.href}
                          className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-700 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-red-800"
                        >
                          <span className="truncate">Ver detalles</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </Link>
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="max-w-xl">
                <p className="text-xs font-black uppercase tracking-widest text-red-700">
                  Armado rápido sin compromiso
                </p>
                <h2 className="mt-1.5 text-xl font-black text-zinc-950 sm:text-2xl">
                  ¿Querés ver qué servicios combinan mejor para tu fiesta completa?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Probá el simulador eligiendo comida, discoteca, decoración, salón o cabinas según tu cantidad de invitados.
                </p>
              </div>
              <Link
                href="/simulador-de-presupuesto"
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 sm:w-auto"
              >
                <span className="truncate">Ir al simulador</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <FAQSection faqs={FIESTAS_FAQS} includeJsonLd={false} />

        <div className="border-t border-zinc-200 bg-white py-4 text-center text-xs text-zinc-500">
          Actualizado el 27 de noviembre de 2026
        </div>
      </main>
      <PublicFooter variant="dark" />
    </div>
  );
}
