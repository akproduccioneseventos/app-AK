import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CalendarDays, CheckCircle2, MessageCircle } from 'lucide-react';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';
import { PublicFooter } from '@/components/public-footer';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import type { LandingLeadData } from '@/app/actions/crm';

interface LandingService {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface EventLandingPageProps {
  eventType: string;
  source: LandingLeadData['fuente'];
  heroImage: string;
  heroImageAlt: string;
  intro: string;
  detailTitle: string;
  detailDescription: string;
  detailImage: string;
  detailImageAlt: string;
  simulatorHref: string;
  services: LandingService[];
}

export function EventLandingPage({
  eventType,
  source,
  heroImage,
  heroImageAlt,
  intro,
  detailTitle,
  detailDescription,
  detailImage,
  detailImageAlt,
  simulatorHref,
  services,
}: EventLandingPageProps) {
  const whatsappMessage = `Hola AK Producciones, quiero cotizar ${eventType.toLowerCase()}.`;
  const whatsappHref = `https://wa.me/${AK_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <LandingNav />
      <main>
        <HeroSection
          headline={eventType}
          subheadline={intro}
          backgroundImageUrl={heroImage}
          backgroundImageAlt={heroImageAlt}
          whatsappMessage={whatsappMessage}
          ctaLabel="Hablar por WhatsApp"
          simulatorHref={simulatorHref}
          simulatorLabel="Usar el simulador"
          showEventTypes={false}
        />

        <section id="servicios" className="bg-zinc-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-red-700">Producción integral</p>
              <h2 className="mt-3 text-3xl font-black text-zinc-950 sm:text-4xl">Una propuesta hecha para tu evento</h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">Armamos cada servicio alrededor de la fecha, las personas invitadas y el estilo que querés lograr.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {services.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-red-200">
                  <Icon className="h-6 w-6 text-red-700" aria-hidden="true" />
                  <h3 className="mt-5 text-lg font-bold text-zinc-950">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="experiencia" className="py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="relative min-h-80 overflow-hidden rounded-lg bg-zinc-200 sm:min-h-96">
              <Image src={detailImage} alt={detailImageAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="max-w-xl">
              <p className="text-sm font-bold uppercase tracking-widest text-red-700">Acompañamiento real</p>
              <h2 className="mt-3 text-3xl font-black text-zinc-950 sm:text-4xl">{detailTitle}</h2>
              <p className="mt-5 text-base leading-relaxed text-zinc-600">{detailDescription}</p>
              <ul className="mt-7 space-y-3 text-sm font-medium text-zinc-700">
                {['Una consulta clara desde el primer contacto.', 'Opciones que se ajustan a tu evento.', 'Un equipo que coordina cada momento.'].map((item) => (
                  <li key={item} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />{item}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={simulatorHref} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-800">
                  Simular mi evento <ArrowRight className="h-4 w-4" />
                </Link>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-3 text-sm font-bold text-zinc-800 transition-colors hover:border-zinc-500 hover:bg-zinc-50">
                  <MessageCircle className="h-4 w-4 text-emerald-600" /> Consultar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="contacto" className="border-y border-zinc-200 bg-zinc-50 py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div className="lg:pt-8">
              <CalendarDays className="h-7 w-7 text-red-700" aria-hidden="true" />
              <h2 className="mt-5 text-3xl font-black text-zinc-950 sm:text-4xl">Empecemos a planificar</h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">Contanos la fecha aproximada y las personas invitadas. Nuestro equipo recibe tu consulta en el CRM para continuar por el canal que prefieras.</p>
            </div>
            <LeadCaptureForm fuente={source} tipoEventoDefault={eventType} title={`Cotizá ${eventType}`} subtitle="Dejanos tus datos y te contactamos con una propuesta para tu evento." />
          </div>
        </section>
      </main>
      <PublicFooter variant="dark" />
    </div>
  );
}
