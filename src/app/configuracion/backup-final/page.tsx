import Link from 'next/link';
import { ArrowLeft, CheckCircle2, DatabaseBackup, Download, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildBackupReadinessReport } from '@/lib/backup/backup-health';

export default function BackupFinalPage() {
  const report = buildBackupReadinessReport();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href="/configuracion">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Badge className={report.ready ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
            {report.ready ? 'Backup cubre los modulos criticos' : 'Backup necesita revision'}
          </Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
                <DatabaseBackup className="h-4 w-4 text-emerald-700" />
                Guardado final AK
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Control de backup y restauracion</h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Esta pantalla confirma que los datos importantes de la app entran en el backup: eventos, cliente, contable, social fiesta, comercial y operacion AK.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/api/backup/download">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar backup ahora
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/configuracion/backup">
                    Abrir backup manual
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen simple</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3">
                <span>Archivos registrados</span>
                <strong>{report.totalFiles}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3">
                <span>Areas criticas</span>
                <strong>{report.areas.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3">
                <span>Estado</span>
                <strong>{report.ready ? 'Listo' : 'Revisar'}</strong>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {report.areas.map((area) => (
            <Card key={area.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-lg bg-white p-3 text-slate-900 shadow-sm">
                    {area.ready ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <ShieldCheck className="h-5 w-5 text-amber-700" />}
                  </div>
                  <Badge variant="outline">{area.requiredFiles.length} archivos</Badge>
                </div>
                <CardTitle className="text-lg">{area.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{area.simpleGoal}</p>
                {area.ready ? (
                  <div className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Cubierto por backup</div>
                ) : (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Falta: {area.missingFiles.join(', ')}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            El ZIP ahora incluye un archivo interno llamado <strong>_backup-readiness.json</strong>. Sirve para revisar que el backup descargado llevaba el mapa de cobertura de la app.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
