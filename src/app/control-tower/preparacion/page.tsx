import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ClipboardCheck, PartyPopper, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getAllFiestasPreparationScores } from '@/app/actions/preparation-score';

const levelStyles = {
  alta: 'border-green-200 bg-green-50 text-green-700',
  media: 'border-amber-200 bg-amber-50 text-amber-700',
  inicial: 'border-red-200 bg-red-50 text-red-700',
} as const;

export default async function PreparationScoresPage() {
  const result = await getAllFiestasPreparationScores();
  const fiestas = result.success ? result.data || [] : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/70 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Nivel de preparación</Badge>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950"><ClipboardCheck className="h-8 w-8 text-red-600" /> Preparación de fiestas</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Vista general para saber qué fiestas están más encaminadas y cuáles tienen pendientes importantes para revisar.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-2xl font-bold"><Link href="/control-tower"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link></Button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {fiestas.length === 0 && (
          <Card className="rounded-2xl border-green-100 bg-green-50">
            <CardContent className="flex items-center gap-2 p-5 text-sm font-bold text-green-800">
              <CheckCircle2 className="h-5 w-5" /> No hay fiestas para revisar en este momento.
            </CardContent>
          </Card>
        )}
        {fiestas.map(item => (
          <Card key={item.fiestaId} className="rounded-3xl border-red-100 bg-white shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950"><PartyPopper className="h-5 w-5 text-red-600" /> {item.nombreEvento}</CardTitle>
                  <p className="mt-1 text-sm font-medium text-slate-500">{item.fechaEvento ? new Date(item.fechaEvento).toLocaleDateString('es-UY') : 'Sin fecha'}</p>
                </div>
                <Badge variant="outline" className={levelStyles[item.score.level]}>{item.score.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700"><span>{item.score.score}% preparado</span><span>{item.score.summary}</span></div>
                <Progress value={item.score.score} className="h-3" />
              </div>
              <div className="space-y-2">
                {item.score.importantPending.map(pending => (
                  <div key={pending.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                    <p className="font-black text-slate-900">{pending.label}</p>
                    <p className="mt-1 text-slate-600">{pending.detail}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="rounded-2xl bg-red-600 font-bold hover:bg-red-700"><Link href={`/fiestas/nueva?fiestaId=${item.fiestaId}`}>Abrir fiesta</Link></Button>
                <Button asChild variant="outline" className="rounded-2xl font-bold"><Link href={`/fiestas/nueva/asistente?fiestaId=${item.fiestaId}`}><Sparkles className="mr-2 h-4 w-4" /> Agente de fiesta</Link></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
