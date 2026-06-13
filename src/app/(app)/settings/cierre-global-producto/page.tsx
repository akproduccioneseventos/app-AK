import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  ImagePlus,
  Mail,
  MonitorPlay,
  Rocket,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { getProductLaunchPlan, type LaunchPillar, type LaunchStatus } from '@/lib/product-launch/global-product-launch';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusCopy: Record<LaunchStatus, string> = {
  listo: 'Listo',
  revisar: 'Revisar',
  pendiente: 'Pendiente',
};

const statusStyles: Record<LaunchStatus, string> = {
  listo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  revisar: 'border-amber-200 bg-amber-50 text-amber-700',
  pendiente: 'border-rose-200 bg-rose-50 text-rose-700',
};

const pillarIcons: Record<string, typeof Sparkles> = {
  venta: Rocket,
  fiesta: ClipboardCheck,
  cliente: Users,
  visual: ImagePlus,
  google: Mail,
  estabilidad: ShieldCheck,
};

function ScoreCard({ score }: { score: number }) {
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-xl shadow-slate-950/10">
      <p className="text-xs font-black uppercase tracking-widest text-red-700">Cierre global</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-6xl font-black tracking-tight text-slate-950">{score}</span>
        <span className="pb-2 text-2xl font-black text-slate-400">%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-red-600" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function PillarCard({ pillar }: { pillar: LaunchPillar }) {
  const Icon = pillarIcons[pillar.id] ?? Sparkles;

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-red-950/10">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-red-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-950">{pillar.title}</CardTitle>
              <p className="mt-1 text-sm leading-6 text-slate-500">{pillar.simpleGoal}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn('shrink-0 border font-black', statusStyles[pillar.status])}>
            {statusCopy[pillar.status]}
          </Badge>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
            <span>Preparacion</span>
            <span className="text-slate-700">{pillar.score}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-red-600" style={{ width: `${pillar.score}%` }} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-6 pt-0">
        {pillar.checks.map((check) => (
          <Link key={check.label} href={check.href} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-red-200 hover:bg-red-50/50">
            {check.priority === 'alta' ? <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-red-600" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900">{check.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{check.detail}</p>
            </div>
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export default function CierreGlobalProductoPage() {
  const plan = getProductLaunchPlan();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.10),_transparent_34%),linear-gradient(135deg,_#ffffff,_#f8fafc_58%,_#fff1f2)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-2xl shadow-red-950/10 backdrop-blur">
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-700">
                <Rocket className="h-4 w-4" />
                Cierre global de producto
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Toda la app como un solo sistema</h1>
                <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600 sm:text-lg">{plan.headline}</p>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-500">{plan.principle}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/eventos" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-red-700">
                  Abrir eventos
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link href="/settings/biblioteca-visual-ak" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:border-red-200 hover:text-red-700">
                  Biblioteca visual
                  <ImagePlus className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <ScoreCard score={plan.score} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plan.nextPracticalActions.map((action) => (
            <Link key={action.label} href={action.href} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg hover:shadow-red-950/10">
              <p className="text-xs font-black uppercase tracking-widest text-red-700">{action.priority}</p>
              <h2 className="mt-2 text-lg font-black text-slate-950">{action.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{action.detail}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-700">Ruta maestra</p>
              <h2 className="text-2xl font-black text-slate-950">De prospecto a post-fiesta</h2>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-7">
            {plan.masterFlow.map((step) => (
              <Link key={step.order} href={step.href} className="group rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50/50">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-red-600 text-sm font-black text-white">{step.order}</div>
                <h3 className="mt-4 text-base font-black leading-tight text-slate-950">{step.title}</h3>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{step.owner}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{step.simpleGoal}</p>
                <p className="mt-3 text-xs leading-5 text-slate-400">Resultado: {step.expectedResult}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          {plan.pillars.map((pillar) => (
            <PillarCard key={pillar.id} pillar={pillar} />
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/20 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3 text-red-200">
              <MonitorPlay className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-200">Biblioteca visual</p>
              <h2 className="text-2xl font-black">Cada imagen debe tener un uso claro</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {plan.visualLibrary.map((item) => (
              <Link key={item.title} href={item.href} className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:border-red-200/40 hover:bg-white/10">
                <h3 className="font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">{item.whereItShows}</p>
                <div className="mt-4 space-y-1">
                  {item.requiredAssets.map((asset) => (
                    <p key={asset} className="text-xs font-bold text-white/45">- {asset}</p>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
