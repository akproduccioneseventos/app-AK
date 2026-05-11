import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bot, Briefcase, CheckCircle2, Download, MonitorPlay, PartyPopper, QrCode, Sparkles, Users } from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { buildAk100Readiness, type Ak100AreaId, type Ak100Status } from '@/lib/ak-100/ak-100-readiness';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const statusLabel: Record<Ak100Status, string> = {
  listo: 'Listo',
  falta_cerrar: 'Falta cerrar',
  pendiente: 'Pendiente',
};

const statusClass: Record<Ak100Status, string> = {
  listo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  falta_cerrar: 'border-amber-200 bg-amber-50 text-amber-700',
  pendiente: 'border-rose-200 bg-rose-50 text-rose-700',
};

const iconByArea: Record<Ak100AreaId, typeof Sparkles> = {
  venta: Briefcase,
  cliente: Users,
  invitado: QrCode,
  operacion: PartyPopper,
  ia: Bot,
  tecnologia: MonitorPlay,
  post_fiesta: Sparkles,
  instalacion: Download,
};

type PageProps = { params: { id: string } };

export default async function Ak100Page({ params }: PageProps) {
  const fiesta = await getFiestaById(params.id);

  if (!fiesta) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
        <Card className="rounded-3xl bg-white shadow-xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-black text-slate-950">No encontré esta fiesta</h1>
            <Button asChild className="mt-6 rounded-2xl bg-red-600 font-bold hover:bg-red-700">
              <Link href="/eventos">Volver a eventos</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const readiness = buildAk100Readiness(fiesta);

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-red-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-2xl bg-white font-bold">
            <Link href={`/fiestas/${encodeURIComponent(params.id)}/comando-total`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al comando
            </Link>
          </Button>
          <Badge className="bg-red-600 text-white">AK 100%</Badge>
        </div>

        <section className="rounded-[2rem] border border-red-100 bg-white p-6 shadow-xl shadow-red-900/5 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-600">Cierre total de la fiesta</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{readiness.eventName}</h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">{readiness.message}</p>
            </div>
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
              <p className="text-xs font-black uppercase tracking-widest text-red-200">Preparación 100%</p>
              <p className="mt-2 text-6xl font-black">{readiness.globalScore}%</p>
              <Badge variant="outline" className={cn('mt-3 border font-black', statusClass[readiness.status])}>{statusLabel[readiness.status]}</Badge>
            </div>
          </div>
        </section>

        {readiness.nextWork.length > 0 && (
          <Card className="rounded-[2rem] border-amber-200 bg-amber-50 shadow-sm">
            <CardHeader><CardTitle className="text-lg font-black text-amber-950">Lo que falta para poder decir 100%</CardTitle></CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {readiness.nextWork.map((item) => <p key={item} className="text-sm font-bold leading-6 text-amber-900">• {item}</p>)}
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          {readiness.areas.map((area) => {
            const Icon = iconByArea[area.id];
            return (
              <Card key={area.id} className="rounded-[2rem] border-slate-100 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="rounded-2xl bg-red-50 p-3 text-red-600"><Icon className="h-5 w-5" /></div>
                      <div>
                        <CardTitle className="text-xl font-black text-slate-950">{area.title}</CardTitle>
                        <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{area.promise}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('border font-black', statusClass[area.status])}>{area.score}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Listo</p>
                      {(area.ready.length ? area.ready : ['Todavía falta cargar datos.']).map((item) => (
                        <p key={item} className="mt-2 flex gap-2 text-sm text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{item}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-amber-600">Falta cerrar</p>
                      {(area.missing.length ? area.missing : ['Este bloque está pronto.']).map((item) => <p key={item} className="mt-2 text-sm font-medium leading-5 text-slate-600">• {item}</p>)}
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full rounded-2xl font-bold">
                    <Link href={area.href}>{area.actionLabel}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
