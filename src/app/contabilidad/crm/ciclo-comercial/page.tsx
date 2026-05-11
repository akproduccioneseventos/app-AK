import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, FileSignature, PartyPopper, ReceiptText, UserRound, Users } from 'lucide-react';
import { getCommercialLifecycleDashboard } from '@/app/actions/commercial-lifecycle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const statusLabel = {
  listo: 'Listo',
  falta_cerrar: 'Falta cerrar',
  pendiente: 'Pendiente',
} as const;

const statusClass = {
  listo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  falta_cerrar: 'border-amber-200 bg-amber-50 text-amber-700',
  pendiente: 'border-rose-200 bg-rose-50 text-rose-700',
} as const;

const stepIcon = {
  crm: Users,
  presupuesto: ReceiptText,
  contrato: FileSignature,
  fiesta: PartyPopper,
  cliente: UserRound,
} as const;

function money(value?: number) {
  if (value == null) return 'Sin total';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(value);
}

function dateLabel(value?: string) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-UY', { dateStyle: 'medium' }).format(date);
}

export default async function CicloComercialPage() {
  const dashboard = await getCommercialLifecycleDashboard();

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-red-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-2xl bg-white font-bold">
            <Link href="/contabilidad/crm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al CRM
            </Link>
          </Button>
          <Badge className="bg-red-600 text-white">PR 1 · Flujo comercial</Badge>
        </div>

        <section className="rounded-[2rem] border border-red-100 bg-white p-6 shadow-xl shadow-red-900/5 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-600">CRM → presupuesto → contrato → fiesta</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Ciclo comercial unificado</h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-slate-600">{dashboard.message}</p>
            </div>
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
              <p className="text-xs font-black uppercase tracking-widest text-red-200">Preparación</p>
              <p className="mt-2 text-6xl font-black">{dashboard.globalScore}%</p>
              <Badge variant="outline" className={cn('mt-3 border font-black', statusClass[dashboard.status])}>{statusLabel[dashboard.status]}</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Card className="rounded-3xl bg-white"><CardContent className="p-4"><p className="text-xs font-black uppercase text-slate-400">Casos</p><p className="mt-2 text-3xl font-black">{dashboard.stats.total}</p></CardContent></Card>
          <Card className="rounded-3xl bg-white"><CardContent className="p-4"><p className="text-xs font-black uppercase text-slate-400">Listos</p><p className="mt-2 text-3xl font-black">{dashboard.stats.ready}</p></CardContent></Card>
          <Card className="rounded-3xl bg-white"><CardContent className="p-4"><p className="text-xs font-black uppercase text-slate-400">Sin presupuesto</p><p className="mt-2 text-3xl font-black">{dashboard.stats.missingBudget}</p></CardContent></Card>
          <Card className="rounded-3xl bg-white"><CardContent className="p-4"><p className="text-xs font-black uppercase text-slate-400">Sin contrato</p><p className="mt-2 text-3xl font-black">{dashboard.stats.missingContract}</p></CardContent></Card>
          <Card className="rounded-3xl bg-white"><CardContent className="p-4"><p className="text-xs font-black uppercase text-slate-400">Sin fiesta</p><p className="mt-2 text-3xl font-black">{dashboard.stats.missingFiesta}</p></CardContent></Card>
          <Card className="rounded-3xl bg-white"><CardContent className="p-4"><p className="text-xs font-black uppercase text-slate-400">Aceptados sin fiesta</p><p className="mt-2 text-3xl font-black">{dashboard.stats.acceptedWithoutFiesta}</p></CardContent></Card>
        </section>

        {dashboard.nextWork.length > 0 && (
          <Card className="rounded-[2rem] border-amber-200 bg-amber-50 shadow-sm">
            <CardHeader><CardTitle className="text-lg font-black text-amber-950">Lo primero a cerrar</CardTitle></CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {dashboard.nextWork.map((item) => <p key={item} className="text-sm font-bold leading-6 text-amber-900">• {item}</p>)}
            </CardContent>
          </Card>
        )}

        <section className="space-y-4">
          {dashboard.rows.map((row) => (
            <Card key={row.id} className="rounded-[2rem] border-slate-100 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-slate-950">{row.customerName}</h2>
                      <Badge variant="outline" className={cn('border font-black', statusClass[row.status])}>{row.score}% · {statusLabel[row.status]}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {row.partyType || 'Evento'} · {dateLabel(row.eventDate)} · {row.venueName || 'Sin salón'} · {money(row.presupuestoTotal)}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                      Etapa: {row.stageName} · Presupuesto: {row.presupuestoEstado || 'sin estado'} · Contrato: {row.contratoEstado} · Fiesta: {row.fiestaEstado || 'sin fiesta'}
                    </p>
                  </div>
                  <Button asChild className="rounded-2xl bg-red-600 font-black hover:bg-red-700">
                    <Link href={row.mainActionHref}>{row.mainActionLabel}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-5">
                  {row.steps.map((step) => {
                    const Icon = stepIcon[step.id];
                    return (
                      <Link key={step.id} href={step.href || '#'} className={cn('rounded-2xl border p-3 text-sm font-black transition', step.ready ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-red-200')}>
                        <Icon className="mb-2 h-4 w-4" />
                        {step.label}
                      </Link>
                    );
                  })}
                </div>

                {row.missing.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3">
                    {row.missing.map((item) => <p key={item} className="text-sm font-medium leading-6 text-amber-900">• {item}</p>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {dashboard.rows.length === 0 && (
            <Card className="rounded-[2rem] bg-white">
              <CardContent className="p-8 text-center text-slate-500">Todavía no hay prospectos, presupuestos ni fiestas para revisar.</CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
