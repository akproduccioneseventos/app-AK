import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ExternalLink, Link2, Rocket, ShieldAlert, Sparkles, UsersRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CTO_LAUNCH_READINESS_AREAS, getCriticalLaunchAreas, getLaunchReadinessScore, type LaunchReadinessStatus } from '@/lib/launch/cto-readiness';

function statusBadge(status: LaunchReadinessStatus) {
  if (status === 'listo') return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Listo</Badge>;
  if (status === 'critico') return <Badge className="bg-slate-200 text-slate-800 hover:bg-slate-200">Critico</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Revisar</Badge>;
}

export default function CtoLaunchReadinessPage() {
  const areas = CTO_LAUNCH_READINESS_AREAS;
  const score = getLaunchReadinessScore(areas);
  const critical = getCriticalLaunchAreas(areas);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href="/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a ajustes
            </Link>
          </Button>
          <Badge className="bg-slate-900 text-white hover:bg-slate-900">CTO senior</Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200 bg-white">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                <Rocket className="h-4 w-4" />
                Cierre de lanzamiento AK
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Panel CTO para salir a la luz</h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Esta pantalla junta los modulos que mas importan antes de mostrar la app al publico: backup, sincronizaciones, asistentes, Club Uruguay, Social Fiesta, portal cliente, Google Workspace y comercial 360.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild><Link href="/settings/sincronizaciones"><Link2 className="mr-2 h-4 w-4" /> Ver sincronizaciones</Link></Button>
                <Button asChild variant="outline"><Link href="/settings/asistentes-contextuales"><UsersRound className="mr-2 h-4 w-4" /> Asistentes</Link></Button>
                <Button asChild variant="outline"><Link href="/settings/backup-final">Backup final</Link></Button>
                <Button asChild variant="outline"><Link href="/club-uruguay">Club Uruguay publico</Link></Button>
                <Button asChild variant="outline"><Link href="/empresa/salones/experiencia-visual">Salones visuales</Link></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle>Estado ejecutivo</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3"><span>Puntaje de salida</span><strong>{score}%</strong></div>
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3"><span>Areas criticas</span><strong>{critical.length}</strong></div>
              <div className="rounded-md bg-white p-3 text-muted-foreground">
                La prioridad es que lo visible para clientes e invitados no dependa de motores ocultos sin pantalla.
              </div>
            </CardContent>
          </Card>
        </section>

        {critical.length > 0 && (
          <Card className="border-slate-200 bg-white">
            <CardContent className="flex gap-3 p-5 text-slate-800">
              <ShieldAlert className="mt-1 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Hay puntos que conviene revisar antes de lanzar.</p>
                <p className="mt-1 text-sm text-muted-foreground">No bloquea trabajar, pero si bloquea decir que esta 100% lista sin una ultima pasada.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => (
            <Card key={area.id} className="border-slate-200 bg-white">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-lg bg-slate-100 p-3 shadow-sm"><Sparkles className="h-5 w-5 text-slate-700" /></div>
                  {statusBadge(area.status)}
                </div>
                <CardTitle className="text-lg">{area.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{area.simpleGoal}</p>
                <div className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
                  <strong>Faltaba:</strong> {area.whatWasMissing}
                </div>
                <div className="space-y-2">
                  {area.checks.map((check) => (
                    <div key={check} className="flex gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {check}
                    </div>
                  ))}
                </div>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={area.visibleRoute}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir modulo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
