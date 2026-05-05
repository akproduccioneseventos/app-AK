import Image from 'next/image';
import Link from 'next/link';
import { Box, Building2, CalendarCheck, Camera, CheckCircle2, Compass, Film, MapPin, MessageCircle, Sparkles, Users } from 'lucide-react';
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
  const photos = clubSalones.flatMap((salon) => salon.fotos || []).slice(0, 9);
  const mapUrl = mainSalon?.googleMapsUrl || DEFAULT_MAP_URL;
  const capacity = mainSalon?.capacidad || 200;
  const videoUrl = safeExternalUrl(mainSalon?.experiencia3D?.videoUrl);
  const recorridoUrl = safeExternalUrl(mainSalon?.experiencia3D?.recorridoUrl);
  const modelo3dUrl = safeExternalUrl(mainSalon?.experiencia3D?.modelo3dUrl);
  const visualNotes = mainSalon?.experiencia3D?.notas?.trim();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.22),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit bg-red-600 text-white">Salon destacado AK Producciones</Badge>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
              Club Uruguay para tu fiesta en Salto
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-300 sm:text-lg">
              Un salon con historia, ubicacion centrica y la posibilidad de vivir tu evento con el servicio integral de AK Producciones: organizacion, catering, decoracion, coordinacion, discoteca y mucho mas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button className="h-12 rounded-2xl bg-red-600 px-6 font-black text-white hover:bg-red-700">
                  <MessageCircle className="mr-2 h-5 w-5" /> Consultar por WhatsApp
                </Button>
              </a>
              <Link href="/simulador-de-presupuesto">
                <Button variant="outline" className="h-12 rounded-2xl border-white/20 bg-white/10 px-6 font-black text-white hover:bg-white/20">
                  Simular presupuesto
                </Button>
              </Link>
            </div>

            {(videoUrl || recorridoUrl || modelo3dUrl) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {videoUrl && (
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20">
                      <Film className="mr-2 h-4 w-4" /> Ver video
                    </Button>
                  </a>
                )}
                {recorridoUrl && (
                  <a href={recorridoUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20">
                      <Compass className="mr-2 h-4 w-4" /> Recorrido 360
                    </Button>
                  </a>
                )}
                {modelo3dUrl && (
                  <a href={modelo3dUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20">
                      <Box className="mr-2 h-4 w-4" /> Modelo 3D
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl">
            {photos[0] ? (
              <Image src={photos[0]} alt="Club Uruguay" fill className="object-cover" priority />
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center bg-gradient-to-br from-red-900 via-slate-900 to-amber-900 p-8 text-center">
                <Building2 className="mb-5 h-16 w-16 text-white/80" />
                <p className="text-2xl font-black">Club Uruguay</p>
                <p className="mt-2 text-sm text-white/70">Carga fotos desde el gestor de salones para mostrarlas aca.</p>
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 rounded-3xl bg-black/55 p-4 backdrop-blur-md">
              <p className="text-xs font-black uppercase tracking-wider text-red-200">Servicio integral</p>
              <p className="mt-1 text-lg font-black">Salon + organizacion completa con AK Producciones</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-3xl border-white/10 bg-white/10 text-white"><CardContent className="p-5"><MapPin className="mb-3 h-6 w-6 text-red-400" /><p className="text-sm text-slate-300">Ubicacion</p><p className="text-lg font-black">Centro de Salto</p></CardContent></Card>
          <Card className="rounded-3xl border-white/10 bg-white/10 text-white"><CardContent className="p-5"><Users className="mb-3 h-6 w-6 text-red-400" /><p className="text-sm text-slate-300">Capacidad referencial</p><p className="text-lg font-black">Hasta {capacity} personas</p></CardContent></Card>
          <Card className="rounded-3xl border-white/10 bg-white/10 text-white"><CardContent className="p-5"><Sparkles className="mb-3 h-6 w-6 text-red-400" /><p className="text-sm text-slate-300">Diferencial</p><p className="text-lg font-black">Todo en un solo equipo</p></CardContent></Card>
          <Card className="rounded-3xl border-white/10 bg-white/10 text-white"><CardContent className="p-5"><CalendarCheck className="mb-3 h-6 w-6 text-red-400" /><p className="text-sm text-slate-300">Entrevista</p><p className="text-lg font-black">Sin costo</p></CardContent></Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Badge className="mb-4 bg-red-600 text-white">Por que elegirlo</Badge>
          <h2 className="text-3xl font-black tracking-tight">Un salon pensado para disfrutar la fiesta, no para complicarte</h2>
          <div className="mt-6 space-y-4 text-slate-300">
            {[
              'Ubicacion practica para invitados y proveedores.',
              'Ideal para bodas, 15 anos, cumpleanos y eventos empresariales.',
              'Posibilidad de planificar distribucion de mesas y decoracion desde la app de AK.',
              'Servicio integral para evitar coordinar todo por separado.',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-white/5 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <p className="text-sm font-medium leading-6">{item}</p>
              </div>
            ))}
          </div>

          {visualNotes && (
            <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-red-200">Experiencia visual</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">{visualNotes}</p>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-red-200">Galeria</p>
              <h3 className="text-2xl font-black">Fotos del salon</h3>
            </div>
            <Camera className="h-6 w-6 text-red-300" />
          </div>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {photos.map((photo, index) => (
                <div key={`${photo}_${index}`} className="relative aspect-square overflow-hidden rounded-2xl bg-white/10">
                  <Image src={photo} alt={`Club Uruguay foto ${index + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-slate-300">
              Todavia no hay fotos cargadas. Cuando agregues fotos al salon Club Uruguay en el gestor interno, se van a mostrar aca.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/10 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl font-black">Queres conocer Club Uruguay para tu evento?</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-300">
              Coordinamos una entrevista sin costo y revisamos salon, fecha, invitados, estilo de decoracion y presupuesto integral.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-2xl border-white/20 bg-white/10 font-bold text-white hover:bg-white/20"><MapPin className="mr-2 h-4 w-4" /> Ver ubicacion</Button>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-2xl border-white/20 bg-white/10 font-bold text-white hover:bg-white/20"><MessageCircle className="mr-2 h-4 w-4" /> Hablar con AK</Button>
              </a>
            </div>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button className="h-12 rounded-2xl bg-red-600 px-8 font-black hover:bg-red-700">Agendar entrevista</Button>
          </a>
        </div>
      </section>
      <PublicFooter variant="dark" />
    </main>
  );
}
