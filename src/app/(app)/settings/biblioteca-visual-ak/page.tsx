import Link from 'next/link';
import { ArrowUpRight, Camera, CheckCircle2, ImagePlus, MonitorPlay, Sparkles } from 'lucide-react';
import { getProductLaunchPlan } from '@/lib/product-launch/global-product-launch';
import { Card, CardContent } from '@/components/ui/card';

export default function BibliotecaVisualAkPage() {
  const plan = getProductLaunchPlan();

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#ffffff,_#f8fafc_58%,_#fff1f2)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-red-950/10 backdrop-blur sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-700">
                <ImagePlus className="h-4 w-4" />
                Biblioteca visual AK
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Fotos y videos ordenados por uso real</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Esta pantalla no sube archivos todavía. Define el mapa operativo: donde cargar cada recurso para que web, cliente, invitado, LED, portfolio y post-fiesta no usen imagenes sueltas sin criterio.
              </p>
            </div>
            <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-950/20">
              <CardContent className="p-5">
                <MonitorPlay className="h-8 w-8 text-red-200" />
                <p className="mt-4 text-2xl font-black">Regla base</p>
                <p className="mt-2 text-sm leading-6 text-white/70">Cada foto debe tener destino: venta, cliente, invitado, LED, salon, caso real o recuerdo.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {plan.visualLibrary.map((item) => (
            <Link key={item.title} href={item.href} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-red-950/10">
              <div className="flex h-32 items-center justify-center bg-slate-950 text-white">
                <Camera className="h-10 w-10 text-red-200 transition group-hover:scale-110" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-red-600" />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.whereItShows}</p>
                <div className="mt-4 space-y-2">
                  {item.requiredAssets.map((asset) => (
                    <div key={asset} className="flex gap-2 text-xs font-bold text-slate-500">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                      {asset}
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-red-50 p-3 text-red-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-700">Uso recomendado</p>
              <h2 className="text-2xl font-black text-slate-950">Como cargar contenido sin duplicar trabajo</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-lg font-black text-slate-950">1. Primero venta</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Subir fotos que ayuden a cerrar: salon, pista, decoracion, barra, comida, LED y experiencia.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-lg font-black text-slate-950">2. Luego evento</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Por fiesta: portada, invitacion, portal cliente, invitados, pantalla y recuerdos.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-lg font-black text-slate-950">3. Despues caso real</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Al cerrar la fiesta, elegir mejores fotos, testimonio y servicios usados para vender la siguiente.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
