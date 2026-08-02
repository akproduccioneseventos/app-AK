import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleDot,
  LifeBuoy,
  Mail,
  MessageCircle,
  Monitor,
  PlayCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import {
  buildWorldClassExperience,
  type WorldExperienceSection,
  type WorldExperienceStatus,
} from '@/lib/world-class-experience/world-class-experience';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusCopy: Record<WorldExperienceStatus, string> = {
  listo: 'Listo',
  revisar: 'Revisar',
  pendiente: 'Pendiente',
};

const statusStyles: Record<WorldExperienceStatus, string> = {
  listo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  revisar: 'border-amber-200 bg-amber-50 text-amber-700',
  pendiente: 'border-rose-200 bg-rose-50 text-rose-700',
};

const sectionIcons: Record<WorldExperienceSection['id'], typeof Sparkles> = {
  demo: PlayCircle,
  comunicaciones: Mail,
  en_vivo: Monitor,
  post_fiesta: Camera,
  plan_b: LifeBuoy,
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function ScorePill({ score }: { score: number }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-xl shadow-rose-950/10">
      <p className="text-xs font-black uppercase tracking-widest text-rose-600">Cierre mundial</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-5xl font-black tracking-tight text-slate-950">{score}</span>
        <span className="pb-2 text-xl font-black text-slate-400">%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-rose-600 transition-all duration-700" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof Sparkles; label: string; value: string; detail: string }) {
  return (
    <Card className="border-slate-200 bg-white/90 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70">
      <CardContent className="flex gap-3 p-4">
        <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
          <p className="text-sm text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({ section }: { section: WorldExperienceSection }) {
  const Icon = sectionIcons[section.id];

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-950/10">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-rose-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-950">{section.title}</CardTitle>
              <p className="mt-1 text-sm leading-6 text-slate-500">{section.subtitle}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn('shrink-0 border font-black', statusStyles[section.status])}>
            {statusCopy[section.status]}
          </Badge>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-widest text-slate-400">
            <span>{section.result}</span>
            <span className="text-slate-700">{section.score}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-rose-600 transition-all duration-700" style={{ width: `${section.score}%` }} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6 pt-0">
        <div className="grid gap-2 sm:grid-cols-2">
          {section.actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-rose-200 hover:bg-rose-50/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">{action.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{action.detail}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-rose-600" />
              </div>
            </Link>
          ))}
        </div>

        <div className="space-y-2">
          {section.checks.map((check) => (
            <Link
              key={`${section.id}-${check.label}`}
              href={check.href ?? section.href}
              className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition hover:border-rose-200 hover:bg-rose-50/40"
            >
              {check.ready ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">{check.label}</p>
                  <Badge variant="outline" className="rounded-full border-slate-200 px-2 py-0 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {check.priority}
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{check.detail}</p>
              </div>
              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          ))}
        </div>
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
          <p className="mt-2 text-slate-500">El cierre mundial necesita una fiesta concreta para revisar demo, comunicaciones, vivo, post-fiesta y plan B.</p>
          <Button asChild className="mt-6 bg-rose-600 hover:bg-rose-700">
            <Link href="/eventos">Volver a eventos</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function CierreMundialPage(props: PageProps) {
  const params = await props.params;
  const fiesta = await getFiestaById(params.id);

  if (!fiesta) return <MissingFiesta />;

  const suite = buildWorldClassExperience(fiesta);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.10),_transparent_32%),linear-gradient(135deg,_#ffffff,_#f8fafc_58%,_#fff1f2)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="border-slate-200 bg-white/85">
            <Link href={`/fiestas/${encodeURIComponent(params.id)}/centro`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Centro experiencia
            </Link>
          </Button>
          <Badge className="bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">PR unica 2-5</Badge>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-2xl shadow-rose-950/10 backdrop-blur">
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-rose-700">
                <Sparkles className="h-4 w-4" />
                Cierre final de experiencia mundial
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{suite.eventName}</h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{suite.headline}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-rose-600" />
                  {suite.eventDateLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <Monitor className="h-4 w-4 text-rose-600" />
                  {suite.eventPlaceLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <Users className="h-4 w-4 text-rose-600" />
                  {suite.stats.confirmedGuests}/{suite.stats.guestsTotal} invitados confirmados
                </span>
              </div>
            </div>
            <ScorePill score={suite.overallScore} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Mail} label="Comunicacion" value={`${suite.stats.communicationsReady}/6`} detail="Mail, Calendar, WhatsApp y portal." />
          <StatCard icon={Monitor} label="En vivo" value={`${suite.stats.liveReady}%`} detail="LED, muro, invitados y operacion." />
          <StatCard icon={Camera} label="Visuales" value={`${suite.stats.visualAssets}`} detail="Fotos, video, portada y biblioteca." />
          <StatCard icon={LifeBuoy} label="Plan B" value={`${suite.stats.planBReady}/5`} detail="Clima, llegada, equipo y responsables." />
        </section>

        {suite.urgentFixes.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black text-amber-900">
                <AlertTriangle className="h-5 w-5" />
                Prioridad alta antes de lanzar o vender
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {suite.urgentFixes.slice(0, 8).map((fix) => {
                const content = (
                  <>
                  <p className="font-black text-amber-950">{fix.label}</p>
                  <p className="mt-1 text-sm leading-5 text-amber-800/80">{fix.detail}</p>
                  </>
                );
                return fix.href ? (
                  <Link key={fix.label} href={fix.href} className="rounded-2xl border border-amber-200 bg-white/80 p-4 transition hover:bg-white">{content}</Link>
                ) : (
                  <div key={fix.label} aria-disabled="true" className="rounded-2xl border border-amber-200 bg-white/60 p-4">{content}</div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black">
                <PlayCircle className="h-5 w-5 text-rose-200" />
                Guion de demo comercial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suite.demoSteps.map((step) => (
                <Link key={step.order} href={step.href} className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-rose-300/40 hover:bg-white/10">
                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-500 text-sm font-black text-white">{step.order}</div>
                    <div>
                      <p className="font-black text-white">{step.title}</p>
                      <p className="mt-1 text-sm leading-5 text-white/70">{step.goal}</p>
                      <p className="mt-2 text-xs leading-5 text-rose-100/80">{step.speakerNote}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
                <MessageCircle className="h-5 w-5 text-rose-600" />
                Recordatorios y canales
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {suite.touchpoints.map((touchpoint) => (
                <Link key={touchpoint.title} href={touchpoint.href} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-rose-200 hover:bg-rose-50/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="border-slate-200 text-xs font-black text-slate-500">{touchpoint.audience} · {touchpoint.channel}</Badge>
                      <p className="mt-3 font-black text-slate-950">{touchpoint.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{touchpoint.message}</p>
                      <p className="mt-2 text-xs font-bold text-slate-400">{touchpoint.timing}</p>
                    </div>
                    {touchpoint.ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CircleDot className="h-4 w-4 text-amber-600" />}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          {suite.sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
                <LifeBuoy className="h-5 w-5 text-rose-600" />
                Plan B por situacion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suite.planB.map((item) => (
                <Link key={item.title} href={item.href} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-rose-200 hover:bg-rose-50/40">
                  {item.ready ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> : <CircleDot className="mt-1 h-4 w-4 shrink-0 text-amber-600" />}
                  <div>
                    <p className="font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">{item.owner} · {item.trigger}</p>
                    <p className="mt-2 text-sm leading-5 text-slate-500">{item.action}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
                <Sparkles className="h-5 w-5 text-rose-600" />
                Frase de venta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suite.launchScript.map((line, index) => (
                <div key={line} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-rose-600">Paso {index + 1}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{line}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
