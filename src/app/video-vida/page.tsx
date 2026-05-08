import Link from 'next/link';
import { ArrowRight, Camera, Film, MonitorPlay, PartyPopper, Sparkles } from 'lucide-react';

import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatDate(date?: string) {
  if (!date) return 'Fecha a definir';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('es-UY', { dateStyle: 'medium' }).format(parsed);
}

export default async function VideoVidaHubPage() {
  const fiestas = (await getFiestas(false)).slice(0, 8);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_58%,#ffffff_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-2xl shadow-slate-950/10">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <Badge className="border-red-200 bg-red-50 text-red-700">Video de Vida</Badge>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
                Elegi una fiesta para armar o mostrar su Video de Vida.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Esta pagina evita que el acceso general de Centro de Control termine en una pantalla vacia. El Video de Vida siempre necesita una fiesta concreta para cargar fotos, ordenar material y abrir la experiencia publica.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-red-600 text-white hover:bg-red-700">
                  <Link href="/eventos">
                    <PartyPopper className="mr-2 h-4 w-4" />
                    Ver eventos
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-red-200 text-red-700 hover:bg-red-50">
                  <Link href="/settings/cierre-operativo-final">
                    Cierre operativo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative min-h-[380px] overflow-hidden bg-slate-950 p-6 text-white sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.44),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.2),transparent_24%),linear-gradient(135deg,#111827,#450a0a)]" />
              <div className="relative flex h-full flex-col justify-end">
                <Film className="h-11 w-11 text-red-100" />
                <p className="mt-6 text-sm uppercase tracking-[0.28em] text-red-100">Recuerdo + pantalla + cliente</p>
                <h2 className="mt-3 text-4xl font-black sm:text-5xl">Una entrada clara</h2>
                <p className="mt-4 text-sm leading-7 text-slate-200">
                  Desde aca se llega al modulo real por fiesta. Si todavia no hay fiesta cargada, primero hay que crearla o abrir Eventos Activos.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="border-slate-200 bg-white shadow-lg shadow-slate-950/5">
            <CardHeader>
              <Camera className="h-6 w-6 text-red-600" />
              <CardTitle className="text-xl font-black text-slate-950">1. Cargar material</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">Fotos y videos se administran dentro de una fiesta concreta para no mezclar material entre eventos.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-lg shadow-slate-950/5">
            <CardHeader>
              <MonitorPlay className="h-6 w-6 text-red-600" />
              <CardTitle className="text-xl font-black text-slate-950">2. Mostrar experiencia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">El resultado puede usarse en pantalla o compartirse como parte de la experiencia del evento.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-lg shadow-slate-950/5">
            <CardHeader>
              <Sparkles className="h-6 w-6 text-red-600" />
              <CardTitle className="text-xl font-black text-slate-950">3. Conectar con venta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">Sirve para explicar al cliente que AK no solo organiza: tambien crea recuerdos y tecnologia visible.</p>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Fiestas recientes</h2>
              <p className="mt-1 text-sm text-slate-500">Abri el modulo real de Video de Vida desde una fiesta.</p>
            </div>
            <Button asChild variant="outline" className="rounded-full border-red-200 text-red-700 hover:bg-red-50">
              <Link href="/eventos">Ver todas</Link>
            </Button>
          </div>

          {fiestas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-bold text-slate-700">No hay fiestas activas para mostrar.</p>
              <p className="mt-2 text-sm text-slate-500">Crea o abre una fiesta desde Eventos Activos para usar Video de Vida.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {fiestas.map((fiesta) => (
                <Link
                  key={fiesta.id}
                  href={`/video-vida/${encodeURIComponent(fiesta.id)}`}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/50 hover:shadow-lg hover:shadow-red-950/10"
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">{formatDate(fiesta.configuracion.fechaEvento)}</p>
                  <h3 className="mt-2 font-black text-slate-950">{fiesta.configuracion.nombreEvento || fiesta.configuracion.tipoCelebracion || 'Fiesta AK'}</h3>
                  <p className="mt-1 text-sm text-slate-500">{fiesta.configuracion.nombreLugar || 'Lugar a definir'}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-bold text-red-700">
                    Abrir Video de Vida
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
