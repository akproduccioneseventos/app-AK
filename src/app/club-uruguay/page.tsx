import Image from 'next/image';
import Link from 'next/link';
import { Box, Building2, CalendarCheck, Camera, CheckCircle2, Compass, Film, MapPin, MessageCircle, MonitorPlay, Palette, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getSalones } from '@/app/actions/salones';
import { isClubUruguay } from '@/lib/club-uruguay';
import { PublicFooter } from '@/components/public-footer';

const WHATSAPP_URL = 'https://wa.me/59898355530?text=Hola%20AK%20Producciones%2C%20quiero%20consultar%20por%20Club%20Uruguay%20para%20mi%20fiesta.';
const DEFAULT_MAP_URL = 'https://www.google.com/maps/search/?api=1&query=Club%20Uruguay%20Salto%20Uruguay';

function safeExternalUrl(url?: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

export default async function ClubUruguayPublicPage() {
  const salones = await getSalones().catch(() => []);
  const clubSalones = salones.filter((salon) => salon.esClubUruguay || isClubUruguay(salon.nombre));
  const mainSalon = clubSalones[0];
  const photos = clubSalones.flatMap((salon) => salon.fotos || []).slice(0, 12);
  const mapUrl = mainSalon?.googleMapsUrl || DEFAULT_MAP_URL;
  const capacity = mainSalon?.capacidad || 200;
  const videoUrl = safeExternalUrl(mainSalon?.experiencia3D?.videoUrl);
  const recorridoUrl = safeExternalUrl(mainSalon?.experiencia3D?.recorridoUrl);
  const modelo3dUrl = safeExternalUrl(mainSalon?.experiencia3D?.modelo3dUrl);
  const visualNotes = mainSalon?.experiencia3D?.notas?.trim();

  const benefits = [
    'Salon historico y centrico en Salto.',
    'Planificacion integral con AK: decoracion, catering, musica, foto, video y coordinacion.',
    'Diseno de salon 2D/3D para entender mesas, pista, ambientacion y flujo de invitados.',
    'Pagina e invitacion del evento conectadas con invitados, RSVP y muro social.',
  ];

  const visualActions = [
    { label: 'Video del salon', href: videoUrl, icon: Film },
    { label: 'Recorrido 360', href: recorridoUrl, icon: Compass },
    { label: 'Modelo 3D', href: modelo3dUrl, icon: Box },
  ].filter((item) => item.href);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.02fr_0.98fr] md:py-20">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit bg-red-50 text-red-700 ring-1 ring-red-100 hover:bg-red-50">Salon exclusivo AK Producciones</Badge>
            <h1 className="max-w-3xl text-4xl font-black tracking-normal text-slate-950 sm:text-6xl">
              Club Uruguay, presentado como una experiencia de evento completa
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
              Una pagina publica lista para vender el Club Uruguay: muestra el salon, explica como se arma la fiesta, conecta con el simulador y deja visible la propuesta visual 2D/3D de AK Producciones.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button className="h-12 rounded-xl bg-red-600 px-6 font-black text-white hover:bg-red-700">
                  <MessageCircle className="mr-2 h-5 w-5" /> Consultar por WhatsApp
                </Button>
              </a>
              <Link href="/simulador-de-presupuesto">
                <Button variant="outline" className="h-12 rounded-xl border-slate-300 bg-white px-6 font-black text-slate-900 hover:bg-slate-50">
                  Simular presupuesto
                </Button>
              </Link>
              <Link href="/presentacion-led">
                <Button variant="outline" className="h-12 rounded-xl border-red-200 bg-red-50 px-6 font-black text-red-700 hover:bg-red-100">
                  <MonitorPlay className="mr-2 h-5 w-5" /> Ver presentacion LED
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            {photos[0] ? (
              <Image src={photos[0]} alt="Club Uruguay" fill className="object-cover" priority />
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center bg-slate-950 p-8 text-center text-white">
                <Building2 className="mb-5 h-16 w-16 text-white/80" />
                <p className="text-2xl font-black">Club Uruguay</p>
                <p className="mt-2 text-sm text-white/70">Carga fotos desde el gestor de salones para mostrarlas aca.</p>
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/92 p-4 text-slate-950 shadow-lg backdrop-blur-md">
              <p className="text-xs font-black uppercase tracking-wider text-red-700">Servicio integral</p>
              <p className="mt-1 text-lg font-black">Salon + ambientacion + organizacion + experiencia digital</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-xl border-slate-200 bg-white shadow-sm"><CardContent className="p-5"><MapPin className="mb-3 h-6 w-6 text-red-600" /><p className="text-sm text-slate-500">Ubicacion</p><p className="text-lg font-black text-slate-950">Centro de Salto</p></CardContent></Card>
          <Card className="rounded-xl border-slate-200 bg-white shadow-sm"><CardContent className="p-5"><Users className="mb-3 h-6 w-6 text-red-600" /><p className="text-sm text-slate-500">Capacidad referencial</p><p className="text-lg font-black text-slate-950">Hasta {capacity} personas</p></CardContent></Card>
          <Card className="rounded-xl border-slate-200 bg-white shadow-sm"><CardContent className="p-5"><Palette className="mb-3 h-6 w-6 text-red-600" /><p className="text-sm text-slate-500">Diseno</p><p className="text-lg font-black text-slate-950">2D/3D a color</p></CardContent></Card>
          <Card className="rounded-xl border-slate-200 bg-white shadow-sm"><CardContent className="p-5"><CalendarCheck className="mb-3 h-6 w-6 text-red-600" /><p className="text-sm text-slate-500">Entrevista</p><p className="text-lg font-black text-slate-950">Sin costo</p></CardContent></Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Badge className="mb-4 bg-red-600 text-white hover:bg-red-600">Por que elegirlo</Badge>
          <h2 className="text-3xl font-black tracking-normal text-slate-950">Un salon que se vende mejor cuando el cliente puede imaginar la fiesta armada</h2>
          <div className="mt-6 space-y-4 text-slate-600">
            {benefits.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm font-medium leading-6">{item}</p>
              </div>
            ))}
          </div>

          <div id="diseno" className="mt-6 rounded-xl border border-red-100 bg-red-50 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-red-700">Diseno de salon</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              La parte que antes podia aparecer como croquis queda orientada a diseno de salon: mesas, pista, ingreso, decoracion y montaje visual a color. Sirve para mostrarle al cliente como puede quedar Club Uruguay antes de contratar.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-red-700">Experiencia visual</p>
              <h3 className="text-2xl font-black text-slate-950">Video, recorrido y modelo</h3>
            </div>
            <Sparkles className="h-6 w-6 text-red-600" />
          </div>

          {visualActions.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {visualActions.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-red-50">
                    <Icon className="mb-3 h-6 w-6 text-red-600" />
                    <p className="font-black text-slate-950">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">Abrir recurso visual</p>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm leading-6 text-slate-600">
              La pagina ya esta preparada para mostrar video, recorrido 360 y modelo 3D cuando esos links se carguen en el salon Club Uruguay. Mientras tanto, usa las fotos reales y la presentacion LED.
            </div>
          )}

          {visualNotes && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-red-700">Notas visuales</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{visualNotes}</p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-red-700">Galeria</p>
            <h2 className="text-3xl font-black tracking-normal text-slate-950">Fotos del Club Uruguay</h2>
          </div>
          <Camera className="h-7 w-7 text-red-600" />
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {photos.map((photo, index) => (
              <div key={`${photo}_${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                <Image src={photo} alt={`Club Uruguay foto ${index + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Todavia no hay fotos cargadas. Cuando agregues fotos al salon Club Uruguay en el gestor interno, se van a mostrar aca.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-6 rounded-xl border border-slate-200 bg-slate-950 p-6 text-white md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl font-black">Queres conocer Club Uruguay para tu evento?</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-300">
              Coordinamos una entrevista sin costo y revisamos salon, fecha, invitados, estilo de decoracion, distribucion y presupuesto integral.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-xl border-white/20 bg-white/10 font-bold text-white hover:bg-white/20"><MapPin className="mr-2 h-4 w-4" /> Ver ubicacion</Button>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-xl border-white/20 bg-white/10 font-bold text-white hover:bg-white/20"><MessageCircle className="mr-2 h-4 w-4" /> Hablar con AK</Button>
              </a>
            </div>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button className="h-12 rounded-xl bg-red-600 px-8 font-black hover:bg-red-700">Agendar entrevista</Button>
          </a>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
