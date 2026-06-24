import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  ExternalLink,
  MessageCircle,
  Monitor,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { buildExperienceCenter, type ExperienceArea, type ExperienceStatus } from '@/lib/experience-center/experience-center';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusCopy: Record<ExperienceStatus, string> = {
  listo: 'Listo',
  revisar: 'Revisar',
  pendiente: 'Pendiente',
};

const statusStyles: Record<ExperienceStatus, string> = {
  listo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  revisar: 'border-amber-200 bg-amber-50 text-amber-700',
  pendiente: 'border-rose-200 bg-rose-50 text-rose-700',
};

const areaIcons: Record<ExperienceArea['id'], typeof Sparkles> = {
  identidad: Sparkles,
  cliente: MessageCircle,
  invitados: Users,
  social_led: Monitor,
  agenda: CalendarDays,
  operacion: UserCheck,
  visuales: Camera,
  post_evento: ClipboardCheck,
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function ScoreDial({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-28 w-28 place-items-center rounded-full p-2 shadow-lg shadow-rose-900/10"
        style={{ background: `conic-gradient(#dc2626 ${score * 3.6}deg, #e2e8f0 0deg)` }}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-white text-center">
          <div>
            <div className="text-3xl font-black text-slate-950">{score}%</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">AK</div>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-rose-600">Estado general</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">{label}</h2>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="border-slate-200 bg-white/90 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70">
      <CardContent className="p-4">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function AreaCard({ area }: { area: ExperienceArea }) {
  const Icon = areaIcons[area.id];

  return (
    <Card className="group overflow-hidden border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-950/10">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-rose-600 transition duration-300 group-hover:scale-105 group-hover:bg-rose-600 group-hover:text-white">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-slate-950">{area.title}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">{area.simpleGoal}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn('shrink-0 border font-black', statusStyles[area.status])}>
            {statusCopy[area.status]}
          </Badge>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
            <span>{area.summary}</span>
            <span className="text-slate-700">{area.score}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-rose-600 transition-all duration-700" style={{ width: `${area.score}%` }} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-6 pt-0">
        {area.checks.map((check) => (
          <div key={`${area.id}-${check.label}`} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            {check.ready ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800">{check.label}</p>
              <p className="text-xs leading-5 text-slate-500">{check.detail}</p>
            </div>
            {check.href && (
              <Link href={check.href} className="shrink-0 text-slate-400 transition hover:text-rose-600" aria-label={`Abrir ${check.label}`}>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MissingFiesta() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
      <Card className="border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 text-2xl font-black text-slate-950">No encontre esta fiesta</h1>
          <p className="mt-2 text-slate-500">El centro de experiencia necesita una fiesta concreta para revisar cliente, invitados, social, LED y operacion.</p>
          <Button asChild className="mt-6 bg-rose-600 hover:bg-rose-700">
            <Link href="/eventos">Volver a eventos</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function CentroExperienciaPage(props: PageProps) {
  const params = await props.params;
  const fiesta = await getFiestaById(params.id);

  if (!fiesta) {
    return <MissingFiesta />;
  }

  const center = buildExperienceCenter(fiesta);
  const nextSteps = center.nextSteps.slice(0, 8);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.10),_transparent_34%),linear-gradient(135deg,_#ffffff,_#f8fafc_55%,_#fff1f2)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="border-slate-200 bg-white/80">
            <Link href="/eventos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a eventos
            </Link>
          </Button>
          <Badge className="bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">PR 1 Centro de Experiencia AK</Badge>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-2xl shadow-rose-950/10 backdrop-blur">
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-rose-700">
                <Sparkles className="h-4 w-4" />
                Vista ejecutiva de fiesta
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{center.eventName}</h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{center.message}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-rose-600" />
                  {center.eventDateLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <Monitor className="h-4 w-4 text-rose-600" />
                  {center.eventPlaceLabel}
                </span>
              </div>
            </div>
            <ScoreDial score={center.overallScore} label={statusCopy[center.status]} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Cliente" value={`${center.stats.clientScore}%`} detail="Portal, documentos, organizacion y claridad." />
          <StatCard label="Social y LED" value={`${center.stats.socialScore}%`} detail="Muro, pantalla, red privada y post-evento." />
          <StatCard label="Invitados" value={`${center.stats.guestsConfirmed}/${center.stats.guestsTotal}`} detail={`${center.stats.guestsPending} pendientes por confirmar.`} />
          <StatCard label="Pendientes" value={`${center.stats.pendingChecks}`} detail="Puntos concretos antes de mostrar o ejecutar." />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
                <ExternalLink className="h-5 w-5 text-rose-600" />
                Acciones rapidas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {center.quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-950/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{action.label}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{action.description}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-rose-600" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
                Lo que falta cerrar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextSteps.length === 0 ? (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                  <p className="font-black text-emerald-100">No hay pendientes principales.</p>
                  <p className="mt-1 text-sm text-emerald-100/80">Esta fiesta se puede mostrar como experiencia completa.</p>
                </div>
              ) : (
                nextSteps.map((step) => (
                  <Link
                    key={`${step.area}-${step.label}`}
                    href={step.href ?? '#'}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:border-rose-300/40 hover:bg-white/10"
                  >
                    <p className="text-xs font-black uppercase tracking-widest text-rose-200">{step.area}</p>
                    <p className="mt-1 font-black text-white">{step.label}</p>
                    <p className="mt-1 text-sm leading-5 text-white/65">{step.detail}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          {center.areas.map((area) => (
            <AreaCard key={area.id} area={area} />
          ))}
        </section>
      </div>
    </div>
  );
}
