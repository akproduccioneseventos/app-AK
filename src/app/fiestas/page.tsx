import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessageCircle, Sparkles } from 'lucide-react';
import { LandingNav } from '@/components/landing/LandingNav';
import { PublicFooter } from '@/components/public-footer';
import { FAQSection } from '@/components/landing/FAQSection';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
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
    titulo: 'Bodas y Casamientos',
    descripcion: 'Salón, comida con vajilla y mobiliario, decoración, discoteca, fotografía, filmación y barra en una sola coordinación para tu casamiento en Salto.',
    href: '/bodas',
    imagen: '/media/catalogo-servicios/boda_persuasiva.png',
    alt: 'Imagen ilustrativa de una boda',
    ilustrativa: true,
    whatsappTexto: 'Hola AK Producciones, quiero consultar por bodas y casamientos en Salto.',
  },
  {
    id: 'quince',
    titulo: 'Fiestas de 15 años',
    descripcion: 'Tu fiesta de 15 personalizada con plan básico o completo, pista iluminada, decoración, discoteca, fotografía, filmación, fotocabina, Vogue y plataforma 360.',
    href: '/quinceaneras',
    imagen: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
    alt: 'Fiesta de 15 años en Salto producida por AK Producciones',
    ilustrativa: false,
    whatsappTexto: 'Hola AK Producciones, quiero consultar por fiestas de 15 años en Salto.',
  },
  {
    id: 'cumpleanos',
    titulo: 'Cumpleaños y fiestas',
    descripcion: 'Vos invitás y nosotros hacemos el resto: salón, comida, barra de tragos, discoteca con iluminación robótica, fotografía y cabinas.',
    href: '/cumpleanos',
    imagen: '/media/catalogo-servicios/social_persuasivo.png',
    alt: 'Imagen ilustrativa de una fiesta de cumpleaños',
    ilustrativa: true,
    whatsappTexto: 'Hola AK Producciones, quiero consultar por cumpleaños y fiestas en Salto.',
  },
  {
    id: 'empresas',
    titulo: 'Fiestas empresariales',
    descripcion: 'Servicios para eventos y cenas de empresa en Salto: salón, organización, comida con vajilla y mobiliario, decoración, discoteca, fotografía y barra.',
    href: '/fiestas-empresariales',
    imagen: '/media/catalogo-servicios/corporativo_persuasivo.png',
    alt: 'Imagen ilustrativa de un evento empresarial',
    ilustrativa: true,
    whatsappTexto: 'Hola AK Producciones, quiero consultar por fiestas empresariales en Salto.',
  },
  {
    id: 'infantiles',
    titulo: 'Fiestas infantiles',
    descripcion: 'Para que mamá y papá también disfruten: salón, organización, comida, decoración, discoteca, fotocabina y fotografía en un solo equipo.',
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
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <LocalBusinessJsonLd url="https://akproducciones.uy/fiestas" />
      <LandingNav />
      <main>
        <section className="bg-zinc-950 pt-28 pb-16 text-white sm:pt-36 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AK Producciones · Salto, Uruguay
            </p>
            <h1 className="mt-4 max-w-3xl font-headline text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Tipos de fiesta en Salto: un solo contacto, toda tu fiesta
            </h1>
            <div className="mt-4">
              <BotonComoFunciona clave="paginas-por-tipo" variant="dark" />
            </div>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              Elegí el tipo de celebración que estás planeando en Salto. Resolvemos salón, organización, comida con vajilla y mobiliario, decoración, discoteca, fotografía, filmación, barra de tragos, fotocabina, Vogue y plataforma 360 en un solo equipo.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Un solo contacto
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Una sola reunión
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Una sola seña
              </span>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {TIPOS_DE_FIESTA.map((tipo) => {
                const waHref = `https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent(tipo.whatsappTexto)}`;
                return (
                  <article
                    key={tipo.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tipo.imagen}
                        alt={tipo.alt}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      {tipo.ilustrativa && (
                        <span className="absolute right-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white">
                          Imagen ilustrativa
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <h2 className="text-xl font-black text-zinc-950">{tipo.titulo}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{tipo.descripcion}</p>
                      </div>
                      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                        <Link
                          href={tipo.href}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-800"
                        >
                          Ver página <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Hablar por WhatsApp
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <FAQSection faqs={FIESTAS_FAQS} includeJsonLd={true} />
      </main>
      <PublicFooter variant="dark" />
    </div>
  );
}
