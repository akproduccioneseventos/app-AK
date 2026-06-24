import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  MonitorPlay,
  PartyPopper,
  ShieldAlert,
  Smartphone,
  Tablet,
  Tv,
} from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta-actual';
import { buildAkExperiencePlan, type AkLiveControlItem } from '@/lib/experience-ak/world-class-app-plan';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PageProps = { params: Promise<{ id: string }> };

const screenIcon: Record<AkLiveControlItem['screen'], typeof Smartphone> = {
  celular: Smartphone,
  tablet: Tablet,
  pc: MonitorPlay,
  'pantalla-gigante': Tv,
};

const screenLabel: Record<AkLiveControlItem['screen'], string> = {
  celular: 'Celular',
  tablet: 'Tablet',
  pc: 'PC',
  'pantalla-gigante': 'Pantalla gigante',
};

export default async function ShowControlPage(props: PageProps) {
  const params = await props.params;
  const fiesta = await getFiestaById(params.id);
  const plan = buildAkExperiencePlan(fiesta);

  if (!fiesta) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center p-6">
        <Card className="rounded-3xl border-slate-200">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
            <h1 className="mt-4 text-2xl font-black text-slate-950">No encontre esta fiesta</h1>
            <p className="mt-2 text-sm text-slate-500">El centro en vivo necesita una fiesta real para abrir pantallas y controles.</p>
            <Button asChild className="mt-6 rounded-2xl bg-red-600 font-black hover:bg-red-700">
              <Link href="/eventos">Volver a eventos</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_55%,#ffffff_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-2xl bg-white font-bold">
            <Link href={`/fiestas/nueva?fiestaId=${encodeURIComponent(params.id)}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la fiesta
            </Link>
          </Button>
          <Badge className="bg-slate-950 text-white">Centro de control en vivo</Badge>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-700">
                <PartyPopper className="h-4 w-4" />
                Cabina AK para la noche
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                {fiesta.configuracion?.nombreEvento || 'Fiesta AK'}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Esta pantalla reune accesos de operacion y experiencia: muro social, barra, QR, pantalla grande,
                red privada, mission control y cierre post-fiesta.
              </p>
            </div>
            <div className="bg-slate-950 p-6 text-white sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-red-100">Estado general</p>
              <p className="mt-3 text-6xl font-black">{plan.score}%</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{plan.globalMessage}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plan.liveControl.map((item) => {
            const Icon = screenIcon[item.screen];
            return (
              <Link key={item.id} href={item.href} className="group block">
                <Card className="h-full rounded-[1.7rem] border-slate-200 bg-white shadow-lg shadow-slate-950/5 transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-red-950/10">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-2xl bg-red-600 p-3 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-slate-300 transition group-hover:text-red-600" />
                    </div>
                    <CardTitle className="text-xl font-black text-slate-950">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="min-h-[54px] text-sm leading-6 text-slate-600">{item.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-slate-200">{screenLabel[item.screen]}</Badge>
                      <Badge className={item.priority === 'alta' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}>
                        {item.priority === 'alta' ? 'Prioridad alta' : 'Apoyo'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-lg shadow-slate-950/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-black">
                <ClipboardCheck className="h-6 w-6 text-red-600" />
                Checklist antes de abrir pantallas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.qualityChecks.map((check) => (
                <Link key={check.id} href={check.href} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-white">
                  {check.ready ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-950">{check.title}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{check.detail}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/20">
            <CardHeader>
              <CardTitle className="text-2xl font-black">Faltantes principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.blockers.length === 0 ? (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                  <p className="font-black text-emerald-100">Todo lo principal esta listo.</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/80">Podes usar esta fiesta como demostracion o cabina real.</p>
                </div>
              ) : (
                plan.blockers.map((blocker) => (
                  <Link key={blocker.id} href={blocker.href} className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-red-200/40 hover:bg-white/10">
                    <p className="text-xs font-black uppercase tracking-widest text-red-200">{blocker.owner}</p>
                    <p className="mt-1 font-black text-white">{blocker.title}</p>
                    <p className="mt-1 text-sm leading-5 text-white/65">{blocker.detail}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
