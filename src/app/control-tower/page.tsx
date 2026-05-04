import Link from 'next/link';
import { AlertCircle, BellRing, CalendarCheck, CheckCircle2, ClipboardList, DollarSign, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getControlTowerData } from '@/app/actions/control-tower';

const areaLabels = {
  fiesta: 'Fiesta',
  comercial: 'Comercial',
  contable: 'Contable',
  agenda: 'Agenda',
  sistema: 'Sistema',
} as const;

const priorityStyles = {
  alta: 'border-red-200 bg-red-50 text-red-700',
  media: 'border-amber-200 bg-amber-50 text-amber-700',
  normal: 'border-slate-200 bg-slate-50 text-slate-600',
} as const;

export default async function ControlTowerPage() {
  const result = await getControlTowerData();
  const data = result.success ? result.data : null;
  const items = data?.items || [];
  const kpis = data?.kpis;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Centro diario</Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Control Tower AK</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Tu vista diaria de prioridades, pendientes importantes y próximos pasos. Sin ruido: solo lo que conviene revisar primero.
            </p>
          </div>
          <Link href="/secretaria-ak">
            <Button className="rounded-2xl bg-red-600 font-bold hover:bg-red-700">
              <Sparkles className="mr-2 h-4 w-4" /> Abrir Secretaria AK
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="rounded-2xl border-red-100 bg-white shadow-sm"><CardContent className="p-4"><CalendarCheck className="mb-3 h-5 w-5 text-red-600" /><p className="text-xs font-bold uppercase text-slate-400">Fiestas próximas</p><p className="text-2xl font-black text-slate-950">{kpis?.fiestasFuturas ?? 0}</p></CardContent></Card>
        <Card className="rounded-2xl border-red-100 bg-white shadow-sm"><CardContent className="p-4"><Users className="mb-3 h-5 w-5 text-red-600" /><p className="text-xs font-bold uppercase text-slate-400">Prospectos activos</p><p className="text-2xl font-black text-slate-950">{kpis?.prospectosActivos ?? 0}</p></CardContent></Card>
        <Card className="rounded-2xl border-red-100 bg-white shadow-sm"><CardContent className="p-4"><ClipboardList className="mb-3 h-5 w-5 text-red-600" /><p className="text-xs font-bold uppercase text-slate-400">Presupuestos enviados</p><p className="text-2xl font-black text-slate-950">{kpis?.presupuestosPendientes ?? 0}</p></CardContent></Card>
        <Card className="rounded-2xl border-red-100 bg-white shadow-sm"><CardContent className="p-4"><DollarSign className="mb-3 h-5 w-5 text-red-600" /><p className="text-xs font-bold uppercase text-slate-400">Saldo a revisar</p><p className="text-xl font-black text-slate-950">{kpis?.totalPendiente ?? 'UYU 0'}</p></CardContent></Card>
        <Card className="rounded-2xl border-red-100 bg-white shadow-sm"><CardContent className="p-4"><BellRing className="mb-3 h-5 w-5 text-red-600" /><p className="text-xs font-bold uppercase text-slate-400">Notificaciones</p><p className="text-2xl font-black text-slate-950">{kpis?.notificacionesNoLeidas ?? 0}</p></CardContent></Card>
      </div>

      {kpis?.proximoEvento && (
        <Card className="rounded-3xl border-red-100 bg-white shadow-sm">
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-red-600">Próximo evento</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{kpis.proximoEvento.nombre}</h2>
              <p className="text-sm font-medium text-slate-500">{new Date(kpis.proximoEvento.fecha).toLocaleDateString('es-UY')}</p>
            </div>
            <Link href="/multiagente/fiestas"><Button variant="outline" className="rounded-2xl font-bold">Revisar con agente</Button></Link>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border-red-100 bg-white shadow-xl shadow-red-900/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black">
            <CheckCircle2 className="h-5 w-5 text-red-600" /> Prioridades y próximos pasos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5 text-sm font-bold text-green-800">
              Todo tranquilo por ahora. No hay pendientes importantes detectados.
            </div>
          )}
          {items.map(item => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <div className="mt-1 rounded-2xl bg-white p-2 text-red-600 shadow-sm"><AlertCircle className="h-5 w-5" /></div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={priorityStyles[item.priority]}>{item.priority === 'alta' ? 'Prioridad alta' : item.priority === 'media' ? 'A revisar' : 'Normal'}</Badge>
                    <Badge variant="outline" className="border-slate-200 text-slate-500">{areaLabels[item.area]}</Badge>
                  </div>
                  <h3 className="font-black text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </div>
              <Link href={item.href}><Button variant="outline" className="rounded-2xl font-bold">Abrir</Button></Link>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/multiagente/acciones"><Button className="h-14 w-full rounded-2xl bg-red-600 font-bold hover:bg-red-700">Acciones del Multiagente</Button></Link>
        <Link href="/multiagente/memoria"><Button variant="outline" className="h-14 w-full rounded-2xl font-bold">Memoria y aprendizajes</Button></Link>
        <Link href="/multiagente/contable"><Button variant="outline" className="h-14 w-full rounded-2xl font-bold">Agente contable</Button></Link>
      </div>
    </div>
  );
}
