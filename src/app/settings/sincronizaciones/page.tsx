import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ExternalLink, Link2, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SYNCS = [
  {
    title: 'Club Uruguay',
    source: 'Gestor de salones',
    publicSide: '/club-uruguay',
    adminSide: '/empresa/salones/experiencia-visual',
    status: 'Conectado',
    detail: 'La web publica toma fotos, capacidad, mapa, video, recorrido 360, modelo 3D y notas desde el salon cargado como Club Uruguay.',
  },
  {
    title: 'Diseno de salon 2D/3D',
    source: 'Salon + layout guardado',
    publicSide: '/empresa/salones/[id]/diseno',
    adminSide: '/empresa/salones',
    status: 'Conectado',
    detail: 'La ruta correcta de diseno reutiliza la pantalla existente de croquis para no duplicar motores ni perder lo ya hecho.',
  },
  {
    title: 'Backup manual y final',
    source: 'Modulo real de settings',
    publicSide: '/settings/backup-final',
    adminSide: '/settings/backup',
    status: 'Conectado',
    detail: 'El control final y el backup manual apuntan a settings, evitando rutas viejas de configuracion que quedaban sueltas.',
  },
  {
    title: 'Asistentes contextuales',
    source: 'Ruta actual de la app',
    publicSide: '/settings/asistentes-contextuales',
    adminSide: '/settings/asistentes-contextuales',
    status: 'Conectado visualmente',
    detail: 'El indicador cambia automaticamente segun donde estes y permite diferenciar cada asistente con foto y color.',
  },
  {
    title: 'Google Workspace',
    source: 'Configuracion OAuth y emails reales',
    publicSide: '/settings/google-workspace',
    adminSide: '/settings/google-workspace',
    status: 'Revisar credenciales',
    detail: 'La base existe para Calendar y Gmail, pero el lanzamiento depende de que las credenciales reales esten cargadas en produccion.',
  },
  {
    title: 'Social Fiesta',
    source: 'Planificador de fiesta',
    publicSide: '/fiestas/nueva/social-fiesta-pro',
    adminSide: '/fiestas/nueva/muro-social',
    status: 'Revisar en evento real',
    detail: 'El motor social tiene entrada propia, pero conviene probarlo con una fiesta real antes de usarlo en pantalla durante un evento.',
  },
  {
    title: 'Portal cliente',
    source: 'Fiesta contratada',
    publicSide: '/fiestas/nueva/portal-cliente/experiencia-mundial',
    adminSide: '/fiestas/nueva/portal-cliente/cierre-final',
    status: 'Revisar datos de fiesta',
    detail: 'El portal depende de que la fiesta tenga portada, pagos, invitados, contrato y contacto unico bien cargados.',
  },
  {
    title: 'Comercial 360',
    source: 'Simulador, CRM y presupuesto vivo',
    publicSide: '/contabilidad/comercial-360',
    adminSide: '/contabilidad/comercial-360',
    status: 'Conectado para revision',
    detail: 'Centraliza lo comercial para revisar que simulador, presupuesto y seguimiento no queden separados.',
  },
];

function statusClass(status: string) {
  if (status.startsWith('Conectado')) return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
  return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
}

export default function LaunchSynchronizationsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href="/settings/lanzamiento-cto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel CTO
            </Link>
          </Button>
          <Badge className="bg-slate-900 text-white hover:bg-slate-900">Sincronizaciones de lanzamiento</Badge>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-slate-200 bg-white">
            <CardContent className="space-y-4 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                <Link2 className="h-4 w-4" />
                Nada suelto antes de lanzar
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Matriz de conexiones AK</h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Esta pantalla resume de donde sale cada dato, donde se ve y donde se edita. La idea es que cada motor tenga una pantalla real y una ruta clara.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle>Lectura rapida</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Conectado significa que existe entrada visible y ruta de edicion. Revisar significa que el motor existe, pero necesita prueba con datos reales o credenciales.</p>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-800"><ShieldCheck className="h-4 w-4" /> {SYNCS.filter((item) => item.status.startsWith('Conectado')).length} conexiones cubiertas</div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SYNCS.map((item) => (
            <Card key={item.title} className="border-slate-200 bg-white">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-lg bg-slate-100 p-3 text-slate-700"><CheckCircle2 className="h-5 w-5" /></div>
                  <Badge className={statusClass(item.status)}>{item.status}</Badge>
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-xl bg-slate-50 p-3 text-slate-600"><strong>Sale de:</strong> {item.source}</div>
                <p className="text-muted-foreground">{item.detail}</p>
                <div className="grid gap-2">
                  <Button asChild variant="outline" className="justify-start">
                    <Link href={item.publicSide}><ExternalLink className="mr-2 h-4 w-4" /> Abrir vista</Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start text-slate-600">
                    <Link href={item.adminSide}>Editar o revisar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
