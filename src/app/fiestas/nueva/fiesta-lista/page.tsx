import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Layers3,
  MonitorPlay,
  ShieldAlert,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta-actual';
import { buildFiestaListaReport, type FiestaListaCheck } from '@/lib/experience-ak/fiesta-lista';
import { PREMIUM_EXPERIENCE_TEMPLATES } from '@/lib/experience-ak/premium-templates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PageProps = {
  searchParams: {
    fiestaId?: string;
  };
};

const ownerLabel: Record<FiestaListaCheck['owner'], string> = {
  venta: 'Venta',
  cliente: 'Cliente',
  invitado: 'Invitado',
  operacion: 'Operacion',
  pantalla: 'Pantalla',
  'post-fiesta': 'Post-fiesta',
};

const priorityStyles: Record<FiestaListaCheck['priority'], string> = {
  critica: 'border-red-200 bg-red-50 text-red-700',
  alta: 'border-amber-200 bg-amber-50 text-amber-700',
  media: 'border-slate-200 bg-slate-50 text-slate-600',
};

function MissingState({ fiestaId }: { fiestaId?: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center p-6">
      <Card className="rounded-3xl border-slate-200">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 text-2xl font-black text-slate-950">No pude abrir Fiesta Lista</h1>
          <p className="mt-2 text-sm text-slate-500">
            {fiestaId ? 'No encontre esa fiesta.' : 'Falta elegir una fiesta para revisar.'}
          </p>
          <Button asChild className="mt-6 rounded-2xl bg-red-600 font-black hover:bg-red-700">
            <Link href="/eventos">Volver a eventos</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function FiestaListaPage({ searchParams }: PageProps) {
  const fiestaId = searchParams.fiestaId;
  const fiesta = fiestaId ? await getFiestaById(fiestaId) : null;

  if (!fiesta) return <MissingState fiestaId={fiestaId} />;

  const report = buildFiestaListaReport(fiesta);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_54%,#ffffff_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-2xl bg-white font-bold">
            <Link href={`/fiestas/nueva?fiestaId=${encodeURIComponent(fiesta.id)}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la fiesta
            </Link>
          </Button>
          <Badge className="bg-slate-950 text-white">Fiesta lista 100%</Badge>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-700">
                <Sparkles className="h-4 w-4" />
                Revision simple para salir a la luz
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                {fiesta.configuracion?.nombreEvento || 'Fiesta sin nombre'}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{report.headline}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild className="rounded-2xl bg-red-600 font-black hover:bg-red-700">
                  <Link href="/eventos">
                    <Wand2 className="mr-2 h-4 w-4" /> Crear otra demo
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl border-slate-200 bg-white font-black">
                  <Link href="/experiencia-ak">
                    <MonitorPlay className="mr-2 h-4 w-4" /> Ver demo comercial
                  </Link>
                </Button>
              </div>
            </div>
            <div className="bg-slate-950 p-6 text-white sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-100">Estado</p>
              <p className="mt-3 text-6xl font-black">{report.score}%</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {report.readyCount}/{report.totalCount} controles principales listos.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg shadow-slate-950/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-black">
                <ClipboardCheck className="h-6 w-6 text-red-600" />
                Checklist real de la fiesta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.checks.map((check) => (
                <Link key={check.id} href={check.href} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-white">
                  {check.ready ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-950">{check.title}</p>
                      <Badge variant="outline" className={cn('border text-xs font-black', priorityStyles[check.priority])}>{check.priority}</Badge>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{check.detail}</p>
                    <p className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400">{ownerLabel[check.owner]}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[2rem] border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/20">
              <CardHeader>
                <CardTitle className="text-2xl font-black">Lo que falta primero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.blockers.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                    <p className="font-black text-emerald-100">No hay bloqueos principales.</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-100/80">Esta fiesta se puede mostrar como experiencia completa.</p>
                  </div>
                ) : (
                  report.blockers.slice(0, 6).map((blocker) => (
                    <Link key={blocker.id} href={blocker.href} className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-red-200/40 hover:bg-white/10">
                      <p className="text-xs font-black uppercase tracking-widest text-red-200">{ownerLabel[blocker.owner]}</p>
                      <p className="mt-1 font-black text-white">{blocker.title}</p>
                      <p className="mt-1 text-sm leading-5 text-white/65">{blocker.detail}</p>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg shadow-slate-950/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-black">
                  <Layers3 className="h-6 w-6 text-red-600" />
                  Plantillas premium sugeridas
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {PREMIUM_EXPERIENCE_TEMPLATES.map((template) => (
                  <Link key={template.id} href={template.href.includes('?') ? template.href : `${template.href}?fiestaId=${encodeURIComponent(fiesta.id)}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-white">
                    <p className="text-xs font-black uppercase tracking-widest text-red-600">{template.surface}</p>
                    <p className="mt-1 font-black text-slate-950">{template.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{template.goal}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
