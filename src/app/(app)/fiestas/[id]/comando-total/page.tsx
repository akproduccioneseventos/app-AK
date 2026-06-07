import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  ImagePlus,
  Mail,
  MonitorPlay,
  Route,
  Sparkles,
} from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { buildEventCommandCenter, type CommandStatus } from '@/lib/product-launch/event-command-center';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusCopy: Record<CommandStatus, string> = {
  listo: 'Listo',
  revisar: 'Revisar',
  pendiente: 'Pendiente',
};

const statusStyles: Record<CommandStatus, string> = {
  listo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  revisar: 'border-amber-200 bg-amber-50 text-amber-700',
  pendiente: 'border-rose-200 bg-rose-50 text-rose-700',
};

type PageProps = {
  params: {
    id: string;
  };
};

function MissingFiesta() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 text-2xl font-black text-slate-950">No encontre esta fiesta</h1>
          <p className="mt-2 text-slate-500">El comando total necesita una fiesta concreta para unir venta, cliente, invitados, operacion, vivo y post-fiesta.</p>
          <Button asChild className="mt-6 bg-red-600 hover:bg-red-700">
            <Link href="/eventos">Volver a eventos</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreBlock({ score, status }: { score: number; status: CommandStatus }) {
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-xl shadow-red-950/10">
      <p className="text-xs font-black uppercase tracking-widest text-red-700">Comando total</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-6xl font-black tracking-tight text-slate-950">{score}</span>
        <span className="pb-2 text-2xl font-black text-slate-400">%</span>
      </div>
      <Badge variant="outline" className={cn('mt-4 border font-black', statusStyles[status])}>{statusCopy[status]}</Badge>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-red-600" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default async function ComandoTotalPage({ params }: PageProps) {
  const fiesta = await getFiestaById(params.id);

  if (!fiesta) return <MissingFiesta />;

  const command = buildEventCommandCenter(fiesta);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.10),_transparent_34%),linear-gradient(135deg,_#ffffff,_#f8fafc_58%,_#fff1f2)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="border-slate-200 bg-white/85">
            <Link href="/eventos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a eventos
            </Link>
          </Button>
          <Badge className="bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">Comando total AK</Badge>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-2xl shadow-red-950/10 backdrop-blur">
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-700">
                <ClipboardCheck className="h-4 w-4" />
                Panel unico por fiesta
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{command.eventName}</h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{command.message}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-red-600" />
                  {command.eventDateLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <MonitorPlay className="h-4 w-4 text-red-600" />
                  {command.eventPlaceLabel}
                </span>
              </div>
              <div>
                <Button asChild className="rounded-2xl bg-red-600 font-black hover:bg-red-700">
                  <Link href={`/fiestas/${encodeURIComponent(params.id)}/experiencia-tecnologica-ak`}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ver Tecnología AK
                  </Link>
                </Button>
              </div>
            </div>
            <ScoreBlock score={command.globalScore} status={command.status} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {command.signals.map((signal) => (
            <Card key={signal.label} className="border-slate-200 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{signal.label}</p>
                  <Badge variant="outline" className={cn('border text-[10px] font-black', statusStyles[signal.status])}>{statusCopy[signal.status]}</Badge>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-950">{signal.value}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{signal.detail}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {command.urgent.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black text-amber-950">
                <AlertTriangle className="h-5 w-5" />
                Lo primero que hay que cerrar
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {command.urgent.map((item) => (
                <Link key={`${item.source}-${item.label}`} href={item.href} className="rounded-2xl border border-amber-200 bg-white/85 p-4 transition hover:bg-white">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-700">{item.source}</p>
                  <p className="mt-2 font-black text-amber-950">{item.label}</p>
                  <p className="mt-1 text-sm leading-5 text-amber-800/80">{item.detail}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
                <Route className="h-5 w-5 text-red-600" />
                Rutas de trabajo por area
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {command.routes.map((route) => (
                <Link key={route.label} href={route.href} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/40 hover:shadow-lg hover:shadow-red-950/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">{route.area} · {route.priority}</Badge>
                      <p className="mt-3 font-black text-slate-950">{route.label}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{route.goal}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-red-600" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black">
                <Sparkles className="h-5 w-5 text-red-200" />
                Trabajo por agente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {command.agentBriefs.map((brief) => (
                <Link key={brief.agent} href={brief.href} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-red-200/40 hover:bg-white/10">
                  {brief.status === 'listo' ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> : <CircleDot className="mt-1 h-4 w-4 shrink-0 text-amber-300" />}
                  <div>
                    <p className="font-black text-white">{brief.agent}</p>
                    <p className="mt-1 text-sm leading-5 text-white/65">{brief.mission}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-red-200">{brief.nextAction}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Link href={`/fiestas/${encodeURIComponent(params.id)}/experiencia-tecnologica-ak`} className="rounded-3xl border border-red-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-lg hover:shadow-red-950/10">
            <Sparkles className="h-6 w-6 text-red-600" />
            <h2 className="mt-4 text-xl font-black text-slate-950">Tecnología AK</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Mostrar demo, pase invitado, vivo e IA operativa.</p>
          </Link>
          <Link href="/settings/cierre-global-producto" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg hover:shadow-red-950/10">
            <Sparkles className="h-6 w-6 text-red-600" />
            <h2 className="mt-4 text-xl font-black text-slate-950">Cierre global</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Ver toda la app como sistema completo.</p>
          </Link>
          <Link href="/settings/biblioteca-visual-ak" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg hover:shadow-red-950/10">
            <ImagePlus className="h-6 w-6 text-red-600" />
            <h2 className="mt-4 text-xl font-black text-slate-950">Biblioteca visual</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Ordenar fotos y videos por uso real.</p>
          </Link>
          <Link href={`/settings/google-workspace?fiestaId=${encodeURIComponent(params.id)}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg hover:shadow-red-950/10">
            <Mail className="h-6 w-6 text-red-600" />
            <h2 className="mt-4 text-xl font-black text-slate-950">Mail y Calendar</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Revisar comunicaciones utiles para cliente, invitados y personal.</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
