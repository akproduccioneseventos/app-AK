import Link from 'next/link';
import { ArrowRight, CalendarClock, CheckCircle2, Gauge, Mail, MonitorPlay, Rocket, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FINAL_CLOSURE_GROUPS, FINAL_CLOSURE_SCORE, getFinalClosureTotals } from '@/lib/final-closure/final-closure-actions';

const icons: Record<string, typeof Rocket> = {
  venta: MonitorPlay,
  fiesta: Gauge,
  'cliente-invitado': UsersRound,
  'google-gmail': CalendarClock,
  estabilidad: ShieldCheck,
};

const topActions = [
  {
    label: 'Ver portafolio LED',
    href: '/presentacion-led/portafolio',
    icon: MonitorPlay,
  },
  {
    label: 'Abrir eventos',
    href: '/eventos',
    icon: Gauge,
  },
  {
    label: 'Google y Gmail',
    href: '/settings/google-workspace',
    icon: Mail,
  },
  {
    label: 'Cierre global',
    href: '/settings/cierre-global-producto',
    icon: CheckCircle2,
  },
];

export default function CierreOperativoFinalPage() {
  const totals = getFinalClosureTotals();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.10),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_55%,#fff_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="overflow-hidden rounded-[2rem] border border-red-100 bg-white/90 shadow-2xl shadow-red-950/10">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <Badge className="border-red-200 bg-red-50 text-red-700">Cierre operativo final</Badge>
              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Un solo lugar para ver si la app esta lista para vender, operar y mostrar.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Esta pantalla no reemplaza los modulos que ya hicimos: los ordena. La idea es que puedas entrar por aca y revisar venta, fiesta, cliente, invitados, Google, Gmail, guardado y visuales sin buscar pieza por pieza.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {topActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button key={action.href} asChild className="rounded-full bg-red-600 text-white hover:bg-red-700">
                      <Link href={action.href}>
                        <Icon className="mr-2 h-4 w-4" />
                        {action.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-red-100 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm uppercase tracking-[0.28em] text-red-200">Estado de cierre</p>
                <div className="mt-5 flex items-end gap-3">
                  <span className="text-6xl font-black text-white">{FINAL_CLOSURE_SCORE}</span>
                  <span className="pb-2 text-2xl font-black text-red-200">%</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  El cierre tecnico queda concentrado en acciones visibles. Lo pendiente despues de esto ya no es motor oculto: es cargar contenido real, fotos reales, textos finales y cuentas reales de Google/Gmail.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-2xl font-black">{totals.groups}</p>
                  <p className="text-xs text-slate-300">areas</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-2xl font-black">{totals.actions}</p>
                  <p className="text-xs text-slate-300">entradas</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-2xl font-black">{totals.highPriority}</p>
                  <p className="text-xs text-slate-300">criticas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          {FINAL_CLOSURE_GROUPS.map((group) => {
            const Icon = icons[group.id] ?? Sparkles;
            return (
              <Card key={group.id} className="overflow-hidden border-slate-200 bg-white shadow-xl shadow-slate-950/5">
                <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-red-600 p-3 text-white shadow-lg shadow-red-600/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-950">{group.title}</CardTitle>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{group.goal}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 sm:p-5">
                  {group.actions.map((action) => (
                    <Link
                      key={`${group.id}-${action.href}-${action.title}`}
                      href={action.href}
                      className="group block rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg hover:shadow-red-950/10"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-black text-slate-950">{action.title}</h2>
                            <Badge variant="outline" className={action.priority === 'alta' ? 'border-red-200 text-red-700' : 'border-slate-200 text-slate-600'}>
                              {action.priority}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
                          <p className="mt-3 text-sm font-semibold text-slate-900">Resultado: {action.result}</p>
                        </div>
                        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-red-600" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </section>
      </section>
    </main>
  );
}
