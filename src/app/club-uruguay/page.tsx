import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Accessibility,
  Building2,
  CalendarDays,
  Car,
  Check,
  Clock,
  History,
  MapPin,
  PartyPopper,
  Sparkles,
  Users,
  UtensilsCrossed,
  Volume2,
} from 'lucide-react';
import { LandingNav } from '@/components/landing/LandingNav';
import { PublicFooter } from '@/components/public-footer';
import { getSalonesPublicos } from '@/app/actions/salones';
import { isClubUruguay } from '@/lib/club-uruguay';
import {
  dedupeSalonPhotos,
  getClubUruguayHeroPhoto,
  getDynamicSalonPhotos,
  type SalonPhoto,
} from '@/lib/salon-helper';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import {
  ClubUruguayClosingActions,
  ClubUruguayHeroActions,
  ClubUruguayInteractive,
  SalonMedia,
} from '@/components/club-uruguay/ClubUruguayInteractive';

export const metadata: Metadata = {
  title: 'Club Uruguay Salto | Salón de Fiestas y Eventos | AK Producciones',
  description:
    'Conocé el salón Club Uruguay en Uruguay 754, Salto. Opciones informadas para 50 y 250 personas, montajes reales y organización integral con AK Producciones.',
  alternates: {
    canonical: 'https://akproducciones.uy/club-uruguay',
  },
  openGraph: {
    title: 'Club Uruguay Salto | Salón para Fiestas y Eventos',
    description:
      'Salón patrimonial en pleno centro de Salto (Uruguay 754). Espacios para 50 y 250 invitados con organización integral de AK Producciones.',
    url: 'https://akproducciones.uy/club-uruguay',
    images: [
      {
        url: 'https://akproducciones.uy/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
        width: 1200,
        height: 630,
        alt: 'Salón Club Uruguay Salto preparado por AK Producciones',
      },
    ],
  },
};

const WHATSAPP = AK_WHATSAPP_NUMBER;

async function getSalonesWithoutBlockingSale() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      getSalonesPublicos(),
      new Promise<Awaited<ReturnType<typeof getSalonesPublicos>>>((resolve) => {
        timeout = setTimeout(() => resolve([]), 2_500);
      }),
    ]);
  } catch {
    return [];
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export default async function ClubUruguayPage() {
  const salones = await getSalonesWithoutBlockingSale();
  const salon = salones.find((item) => item.esClubUruguay || isClubUruguay(item.nombre));

  const masterPhotos: SalonPhoto[] = (salon?.fotos || []).map((src, index) => ({
    src,
    alt: `Club Uruguay, vista ${index + 1}`,
    title: index === 0 ? 'El salón' : `Vista del salón ${index + 1}`,
    description: 'Foto cargada desde el módulo maestro de salones.',
    aprobada: true,
  }));

  const curated = getDynamicSalonPhotos();
  const heroPhoto = getClubUruguayHeroPhoto(curated);
  // El hero aprobado siempre encabeza la presentación sin ser desplazado por el orden del maestro
  const allPhotos = dedupeSalonPhotos([
    heroPhoto,
    ...curated.filter((p) => p.src !== heroPhoto.src),
    ...masterPhotos,
  ]);

  const salonAddress = salon?.direccion?.trim() || 'Uruguay 754, Salto';
  const salonDescription = salon?.descripcion?.trim();
  const salonEstacionamiento = salon?.estacionamiento?.trim();
  const salonAccesibilidad = salon?.accesibilidad?.trim();

  const whatsappHeroHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    'Hola AK Producciones. Quiero coordinar una visita para conocer el Club Uruguay.',
  )}`;

  const mapsUrl =
    salon?.googleMapsUrl ||
    'https://www.google.com/maps/search/?api=1&query=Uruguay+754,+Salto,+Uruguay';

  /**
   * Ficha técnica del salón para motores de búsqueda (JSON-LD).
   * Dirección confirmada en calle Uruguay 754, Salto.
   * Sin atribuciones legales no certificadas.
   */
  const salonJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EventVenue',
    name: 'Club Uruguay Salto',
    description:
      'Salón histórico en el centro de Salto con dos espacios (principal e íntimo), climatización y cocina para bodas, 15 años y eventos con organización de AK Producciones.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Uruguay 754',
      addressLocality: 'Salto',
      addressRegion: 'Salto',
      addressCountry: 'UY',
    },
    telephone: `+${WHATSAPP}`,
    url: 'https://akproducciones.uy/club-uruguay',
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white selection:bg-red-700">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(salonJsonLd) }}
      />
      <LandingNav />

      <main>
        {/* ── BANDA 1: Portada + Dirección Uruguay 754 + Capacidades informadas 50/250 ── */}
        <section className="relative flex min-h-[82vh] items-end overflow-hidden border-b border-white/10 pt-28">
          <SalonMedia
            src={heroPhoto.src}
            alt={heroPhoto.alt}
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Contraste medido: deja inspeccionar el espacio sin oscurecer toda la sala */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-black/55 to-black/35" />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/60 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-300 backdrop-blur-sm">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                Uruguay 754 • Centro de Salto
              </div>

              <h1 className="font-headline text-5xl font-black leading-[1.03] tracking-tight sm:text-7xl lg:text-8xl">
                Club Uruguay Salto
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-200 sm:text-xl">
                Espacio con historia en el centro de Salto, con organización integral de AK Producciones.
              </p>

              {/* Resumen de capacidades informadas 50/250 */}
              <div className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-zinc-300 backdrop-blur-sm">
                <Users className="h-4 w-4 text-red-400" aria-hidden="true" />
                <span>
                  <strong>Opciones informadas:</strong> 50 a 250 personas según el montaje (informadas, no habilitación legal certificada).
                </span>
              </div>

              <div className="mt-8">
                <ClubUruguayHeroActions whatsappHref={whatsappHeroHref} />
                <p className="mt-3 text-xs text-zinc-400">
                  La consulta por WhatsApp inicia la conversación para coordinar fecha y horario; no es una cita confirmada automáticamente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── BANDA 2 & 3: Dos espacios comparables & Galería real con lightbox ── */}
        <ClubUruguayInteractive photos={allPhotos} whatsappNumber={WHATSAPP} />

        {/* ── BANDA 4: Historia y patrimonio breve (no museo) ── */}
        <section className="border-b border-white/10 bg-zinc-900 py-20 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-md bg-red-950/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-800/40">
                  <History className="h-3.5 w-3.5" aria-hidden="true" />
                  Patrimonio vivo
                </span>
                <h2 className="mt-4 font-headline text-3xl font-black sm:text-5xl">
                  150 aniversario en 2025: celebrar donde la historia tiene peso
                </h2>
                <p className="mt-5 text-base leading-relaxed text-zinc-300 sm:text-lg">
                  Fundado en 1875, el Club Uruguay conmemora su sesquicentenario en 2025 en el corazón de Salto. No es un museo intocable: es un edificio vivo donde conviven techos altos de época y arquitectura clásica con la dinámica de una fiesta moderna.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                  El salón resguarda su mural patrimonial característico como rasgo de identidad visual, aportando un marco señorial que realza tanto una recepción protocolar como una fiesta bailable de quince años o una boda.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-xl">
                <h3 className="font-headline text-xl font-black text-white">
                  Por qué elegir un salón patrimonial
                </h3>
                <ul className="mt-6 space-y-4 text-sm text-zinc-300">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                    <span><strong>Presencia fotográfica:</strong> La altura de los techos y las molduras clásicas brindan fondos naturales con porte propio.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                    <span><strong>Identidad local:</strong> Una referencia indiscutida en Salto que todo invitado ubica con facilidad.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                    <span><strong>Contraste con tecnología moderna:</strong> Pistas de luces LED, sonido robótico y estaciones interactivas integradas sin desentonar con la estructura.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── BANDA 5: Ubicación y visita práctica ── */}
        <section id="ubicacion" className="border-b border-white/10 bg-white py-20 text-zinc-950 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-widest text-red-600">
                Llegada práctica y punto de encuentro
              </p>
              <h2 className="mt-3 font-headline text-3xl font-black sm:text-5xl">
                Ubicación céntrica en Uruguay 754
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
                Ubicado sobre la arteria principal de Salto, permite una llegada cómoda y directa desde todos los barrios y accesos a la ciudad.
              </p>
            </div>

            <div className={`mt-10 grid gap-4 ${
              salonEstacionamiento || salonAccesibilidad
                ? 'sm:grid-cols-2 lg:grid-cols-4'
                : 'sm:grid-cols-3'
            }`}>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <MapPin className="mb-3 h-6 w-6 text-red-600" aria-hidden="true" />
                <h3 className="font-headline text-lg font-black">Dirección física</h3>
                <p className="mt-2 text-sm text-zinc-600">{salonAddress}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-800"
                >
                  Abrir en Google Maps →
                </a>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <Building2 className="mb-3 h-6 w-6 text-red-600" aria-hidden="true" />
                <h3 className="font-headline text-lg font-black">Zona comercial</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  En pleno centro de Salto, con disponibilidad de taxis, transporte y cercanía a hoteles para invitados del interior.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <Clock className="mb-3 h-6 w-6 text-red-600" aria-hidden="true" />
                <h3 className="font-headline text-lg font-black">Coordinación de visita</h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Recorridos presenciales coordinados con antelación junto al equipo de producción de AK.
                </p>
              </div>

              {salonEstacionamiento && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                  <Car className="mb-3 h-6 w-6 text-red-600" aria-hidden="true" />
                  <h3 className="font-headline text-lg font-black">Estacionamiento</h3>
                  <p className="mt-2 text-sm text-zinc-600">{salonEstacionamiento}</p>
                </div>
              )}

              {salonAccesibilidad && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                  <Accessibility className="mb-3 h-6 w-6 text-red-600" aria-hidden="true" />
                  <h3 className="font-headline text-lg font-black">Accesibilidad</h3>
                  <p className="mt-2 text-sm text-zinc-600">{salonAccesibilidad}</p>
                </div>
              )}
            </div>

            {salonDescription && (
              <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm leading-relaxed text-zinc-700">
                <p>{salonDescription}</p>
              </div>
            )}
          </div>
        </section>

        {/* ── BANDA 6: Organización con AK (contratables vs instalaciones + tecnología visible) ── */}
        <section id="organizacion-ak" className="border-b border-white/10 bg-zinc-950 py-20 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-md bg-red-950/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-800/40">
                <PartyPopper className="h-3.5 w-3.5" aria-hidden="true" />
                Producción integral
              </span>
              <h2 className="mt-4 font-headline text-3xl font-black sm:text-5xl">
                Organización integral con AK Producciones
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
                Diferenciamos con honestidad las instalaciones provistas por el club de los servicios de producción integral que podés contratar con AK.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {/* Instalaciones incluidas del club */}
              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-lg">
                <h3 className="font-headline text-2xl font-black text-white">
                  Instalaciones incluidas del salón
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Infraestructura propia del edificio de Club Uruguay en Uruguay 754:
                </p>

                <ul className="mt-6 space-y-4 text-sm text-zinc-300">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span><strong>Climatización integral:</strong> Equipos de frío y calor para mantener la temperatura en cualquier época del año.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span><strong>Área técnica para cocina:</strong> Espacio de soporte para preparación y servicio de catering.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span><strong>Batería de baños higienizados:</strong> Servicios higiénicos con personal de mantenimiento durante el evento.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span><strong>Seguridad básica edilicia:</strong> Ingreso céntrico controlado según protocolo de recepción.</span>
                  </li>
                </ul>
              </div>

              {/* Servicios contratables con AK Producciones */}
              <div className="rounded-3xl border border-red-600/40 bg-zinc-900/90 p-8 shadow-xl">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-headline text-2xl font-black text-white">
                    Servicios contratables con AK
                  </h3>
                  <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                    Catálogo vigente
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  Soluciones de producción coordinadas bajo un único contrato y equipo:
                </p>

                <ul className="mt-6 space-y-4 text-sm text-zinc-200">
                  <li className="flex items-start gap-3">
                    <UtensilsCrossed className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                    <span><strong>Gastronomía & Catering:</strong> Bocados fríos/calientes, plato principal, postres y opciones celíacas/vegetarianas.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Volume2 className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                    <span><strong>Discoteca & Pistas de luces:</strong> Sonido profesional, iluminación robótica y pista LED de alto impacto.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                    <span><strong>Ambientación & Barras:</strong> Livings, mantelería, centros de mesa y coctelería con/sin alcohol.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Camera className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                    <span><strong>Fotografía & Video profesional:</strong> Registro en vivo de toda la fiesta.</span>
                  </li>
                </ul>

                {/* TECNOLOGÍA VISIBLE (fotocabina, 360, espejo) */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-400">
                    Estaciones interactivas visibles
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-zinc-300">
                    <div className="rounded-xl border border-white/10 bg-zinc-800/60 p-3">
                      <p className="font-bold text-white">Fotocabina QR</p>
                      <p className="mt-1 text-[11px] text-zinc-400">Impresión de tiras al instante y descarga digital.</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-800/60 p-3">
                      <p className="font-bold text-white">Plataforma 360°</p>
                      <p className="mt-1 text-[11px] text-zinc-400">Videos lentos con efectos dinámicos para redes.</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-zinc-800/60 p-3">
                      <p className="font-bold text-white">Espejo Mágico</p>
                      <p className="mt-1 text-[11px] text-zinc-400">Animaciones interactivas táctiles y recuerdos.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonificación comercial del 50% en alquiler */}
            <div className="mt-10 rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-950/60 via-zinc-900 to-zinc-950 p-8 shadow-xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                    Condición comercial del dueño
                  </span>
                  <h3 className="mt-3 font-headline text-2xl font-black text-white sm:text-3xl">
                    50% de bonificación en el alquiler del salón
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                    Acuerdo comercial directo con la dirección del Club Uruguay para eventos contratados con producción integral de AK Producciones. El descuento aplica al valor del alquiler del local según las condiciones del catálogo vigente. Sin cuentas regresivas inventadas ni modificaciones en el simulador.
                  </p>
                </div>
                <div className="shrink-0">
                  <Link
                    href="/simulador-de-presupuesto?salon=club"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 font-black text-zinc-950 transition hover:bg-zinc-200"
                  >
                    <CalendarDays className="h-4 w-4 text-red-600" aria-hidden="true" />
                    Calcular en el simulador
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BANDA 7: FAQ corta y cierre con CTAs ── */}
        <section id="faq-cierre" className="border-b border-white/10 bg-white py-20 text-zinc-950 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest text-red-600">
                Respuestas directas
              </p>
              <h2 className="mt-3 font-headline text-3xl font-black sm:text-5xl">
                Preguntas frecuentes sobre Club Uruguay
              </h2>
              <p className="mt-4 text-base text-zinc-600">
                Información transparente para que evalúes tu evento con tranquilidad.
              </p>
            </div>

            <div className="mt-12 space-y-4">
              <details className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-headline text-lg font-black text-zinc-900">
                  <span>¿Cómo se coordina una visita para conocer el salón?</span>
                  <span className="ml-4 text-red-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                  Nos escribís por WhatsApp y coordinamos un día y horario para recorrer las instalaciones con el equipo de AK Producciones. El clic inicia la consulta; coordinamos la cita con vos según disponibilidad.
                </p>
              </details>

              <details className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-headline text-lg font-black text-zinc-900">
                  <span>¿A qué aplica la bonificación del 50% en el alquiler?</span>
                  <span className="ml-4 text-red-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                  Aplica sobre el costo de alquiler del espacio de Club Uruguay cuando se contrata la producción integral de la fiesta con AK Producciones. No modifica los costos de servicios individuales (comida, discoteca o barras).
                </p>
              </details>

              <details className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-headline text-lg font-black text-zinc-900">
                  <span>¿Puedo elegir qué servicios contratar con AK?</span>
                  <span className="ml-4 text-red-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                  Sí. Podés armar una propuesta a medida desde el simulador de presupuesto, eligiendo la combinación de gastronomía, sonido, decoración, tecnología interactiva y fotografía que se ajuste a tu plan.
                </p>
              </details>

              <details className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between font-headline text-lg font-black text-zinc-900">
                  <span>¿Qué aforo real tienen los dos espacios?</span>
                  <span className="ml-4 text-red-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                  Las capacidades informadas son de hasta ~250 personas en el salón principal y hasta ~50 en el espacio íntimo, sujetas a la distribución de mesas, pista de baile y livings. Son espacios independientes, no un aforo acumulativo de 300 invitados.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* ── Cierre de página con CTAs ── */}
        <section className="bg-zinc-950 py-20 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 rounded-3xl border border-white/10 bg-zinc-900 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-red-400">
                  Propuesta clara y sin compromiso
                </p>
                <h2 className="mt-3 font-headline text-3xl font-black sm:text-5xl">
                  Coordiná tu visita o calculá tu presupuesto
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
                  Escribinos para recorrer las instalaciones en Uruguay 754 o simulá los números de tu fiesta con el catálogo vigente de AK Producciones.
                </p>
              </div>

              <div className="w-full lg:w-auto">
                <ClubUruguayClosingActions whatsappHref={whatsappHeroHref} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter variant="dark" />
    </div>
  );
}
