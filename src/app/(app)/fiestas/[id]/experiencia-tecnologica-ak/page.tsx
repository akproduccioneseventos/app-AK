import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bot, Gamepad2, MonitorPlay, QrCode, Sparkles } from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { buildAkTechnologySuite } from '@/lib/technology-ak/fiesta-technology-products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const icons = {
  demo_comercial: Sparkles,
  pase_invitado: QrCode,
  fiesta_en_vivo: MonitorPlay,
  zona_digital: Gamepad2,
  ia_operativa: Bot,
} as const;

type PageProps = { params: Promise<{ id: string }> };

export default async function ExperienciaTecnologicaAkPage(props: PageProps) {
  const params = await props.params;
  const fiesta = await getFiestaById(params.id);

  if (!fiesta) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Card className="rounded-3xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black text-slate-950">No encontré esta fiesta</h1>
            <Button asChild className="mt-6 rounded-2xl bg-red-600 font-bold hover:bg-red-700">
              <Link href="/eventos">Volver</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const suite = buildAkTechnologySuite(fiesta);

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-red-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-2xl bg-white font-bold">
            <Link href={`/fiestas/${encodeURIComponent(params.id)}/centro`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Centro de Fiesta
            </Link>
          </Button>
          <Badge className="bg-red-600 text-white">Tecnología AK</Badge>
        </div>

        <section className="rounded-[2rem] border border-red-100 bg-white p-6 shadow-xl shadow-red-900/5 md:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-red-600">Experiencia tecnológica AK</p>
          <div className="mt-3 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{suite.eventName}</h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">{suite.salesMessage}</p>
            </div>
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-red-200">Preparación</p>
              <p className="mt-2 text-6xl font-black">{suite.globalScore}%</p>
              <p className="mt-2 text-sm font-bold text-white/70">{suite.status}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {suite.products.map((product) => {
            const Icon = icons[product.id];
            return (
              <Card key={product.id} className="rounded-[2rem] border-slate-100 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="rounded-2xl bg-red-50 p-3 text-red-600"><Icon className="h-5 w-5" /></div>
                      <div>
                        <CardTitle className="text-xl font-black text-slate-950">{product.title}</CardTitle>
                        <p className="mt-1 text-sm font-bold text-red-600">{product.salesName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-black">{product.score}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">{product.clientPromise}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Ya conectado</p>
                      {(product.alreadyConnected.length ? product.alreadyConnected : ['Faltan datos reales.']).map((item) => <p key={item} className="mt-2 text-sm text-slate-600">• {item}</p>)}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-amber-600">Falta cerrar</p>
                      {(product.missingToClose.length ? product.missingToClose : ['Listo para mostrar.']).map((item) => <p key={item} className="mt-2 text-sm text-slate-600">• {item}</p>)}
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full rounded-2xl font-bold"><Link href={product.href}>Abrir módulo <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
