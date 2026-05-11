import Link from 'next/link';
import type { ComponentType } from 'react';
import { ArrowRight, Bot, Building2, CheckCircle2, ClipboardCheck, FileJson, Globe2, MapPinned, MessageCircle, MonitorPlay, PartyPopper, QrCode, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Status = 'instalado' | 'parcial' | 'proxima-pr';

type TechBlock = {
  title: string;
  status: Status;
  icon: ComponentType<{ className?: string }>;
  whatExists: string;
  whatToConnect: string;
  nextAction: string;
  href: string;
};

const statusLabels: Record<Status, string> = {
  instalado: 'Ya existe',
  parcial: 'Existe, falta conectar',
  'proxima-pr': 'Próxima mejora',
};

const statusClasses: Record<Status, string> = {
  instalado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  parcial: 'border-amber-200 bg-amber-50 text-amber-700',
  'proxima-pr': 'border-red-200 bg-red-50 text-red-700',
};

const blocks: TechBlock[] = [
  {
    title: 'Centro de experiencia y comando total',
    status: 'instalado',
    icon: Sparkles,
    whatExists: 'La app ya tiene centro de experiencia, cierre mundial y comando total para mirar una fiesta como sistema completo.',
    whatToConnect: 'Conviene que todos los módulos importantes alimenten ese centro con datos reales y no solo con pantallas sueltas.',
    nextAction: 'Usarlo como tablero principal de cada fiesta y no duplicar más módulos que ya existen.',
    href: '/fiestas/nueva',
  },
  {
    title: 'Invitados, RSVP, mesas y QR',
    status: 'parcial',
    icon: QrCode,
    whatExists: 'Ya hay invitados, invitación, página del evento y rutas relacionadas a mesas e invitados.',
    whatToConnect: 'Unificar confirmación, mesa asignada, QR de ingreso, búsqueda de mesa y vista del portero/invitado.',
    nextAction: 'Crear una experiencia única para el invitado: confirmar, ver mesa, ubicación, programa, música y fotos desde un solo link.',
    href: '/fiestas/nueva/invitados',
  },
  {
    title: 'Portal del cliente',
    status: 'instalado',
    icon: Users,
    whatExists: 'El cliente ya tiene portal, módulos visibles, datos de fiesta, documentos, pagos, reuniones y experiencia desde celular.',
    whatToConnect: 'Hacer que el portal sea el centro real de consulta y que cada cambio interno se vea claro para el cliente cuando corresponda.',
    nextAction: 'Pulir diseño, módulos desplegables, color por fiesta, foto de protagonista y accesos rápidos.',
    href: '/fiestas/nueva/portal-cliente/experiencia-mundial',
  },
  {
    title: 'Muro social, LED y experiencia en vivo',
    status: 'parcial',
    icon: MonitorPlay,
    whatExists: 'Ya existen muro social, evento en vivo, pantalla, media library y carga de contenido de entretenimiento.',
    whatToConnect: 'Hacer que fotos, mensajes, pedidos de canciones, votaciones, fotocabina y plataforma 360 entren al mismo flujo visual.',
    nextAction: 'Crear un modo operador: qué se ve en pantalla, qué queda pendiente de moderar y qué se guarda para post-fiesta.',
    href: '/fiestas/nueva/en-vivo',
  },
  {
    title: 'Agentes AK por rol y por fiesta',
    status: 'parcial',
    icon: Bot,
    whatExists: 'Ya hay base multiagente, secretaria, marketing, contable, coordinador y agente por fiesta.',
    whatToConnect: 'El agente debe leer datos reales: invitados, pagos, tareas, salón, menú, personal, música, documentos y post-fiesta.',
    nextAction: 'Convertirlos en agentes accionables: detectar faltantes, crear tareas, sugerir mensajes y guardar aprendizaje.',
    href: '/multiagente',
  },
  {
    title: 'Salones, Club White y planos',
    status: 'proxima-pr',
    icon: Building2,
    whatExists: 'La app ya tiene módulos de planificación y salones/espacios vinculados a la organización de fiesta.',
    whatToConnect: 'Crear ficha comercial de Club White/Club Uruguay con fotos, ubicación, capacidad, medidas, documentos y vínculo al planificador.',
    nextAction: 'Hacer página pública + ficha interna + plantilla de salón para mesas y distribución.',
    href: '/salones',
  },
  {
    title: 'Planificador visual del salón',
    status: 'proxima-pr',
    icon: MapPinned,
    whatExists: 'Ya existe la idea de salón planificable y distribución, pero falta convertirlo en una herramienta útil y visual.',
    whatToConnect: 'Primero plano simple con medidas; después importación de modelo 3D desde Polycam, Luma o Matterport si se consigue.',
    nextAction: 'Crear plantilla 2D/3D simple por salón antes de intentar un escaneo 3D completo.',
    href: '/fiestas/nueva/invitados/layout',
  },
  {
    title: 'Importación histórica de presupuestos',
    status: 'proxima-pr',
    icon: FileJson,
    whatExists: 'Hay presupuestos y contratos viejos en PDF/imagen que todavía no están cargados como presupuesto manual en Firebase.',
    whatToConnect: 'Armar JSON histórico con cliente, fiesta, servicios, regalos, total original, ajuste anual y documentos asociados.',
    nextAction: 'Crear importador seguro con vista previa para subir el JSON sin tocar Firebase a mano.',
    href: '/settings',
  },
  {
    title: 'Post-fiesta, marketing y biblioteca visual',
    status: 'parcial',
    icon: PartyPopper,
    whatExists: 'Ya hay post-fiesta, fotografía, biblioteca visual, feedback y conexión con marketing.',
    whatToConnect: 'Después del evento, pedir testimonio, autorización de fotos, guardar aprendizajes y sugerir publicaciones.',
    nextAction: 'Cerrar un flujo automático de post-fiesta conectado al agente de marketing y al agente general de fiestas.',
    href: '/fiestas/nueva/post-evento',
  },
  {
    title: 'WhatsApp, Gmail y Calendar',
    status: 'parcial',
    icon: MessageCircle,
    whatExists: 'La app ya contempla Google Workspace, Gmail, Calendar y WhatsApp como canal corto o respaldo.',
    whatToConnect: 'Unificar mensajes de cliente, invitados, personal y recordatorios sin duplicar información.',
    nextAction: 'Crear plantillas inteligentes por momento: entrevista, seña, pagos, invitados, reunión, semana previa y post-fiesta.',
    href: '/settings/google-workspace',
  },
];

const nextPrs = [
  'Estabilizar Firebase/build antes de sumar más módulos grandes.',
  'Crear mapa real invitado: invitación + RSVP + mesa + QR + check-in + música + fotos.',
  'Hacer ficha Club White/Club Uruguay conectada a salones y planificador.',
  'Crear importador histórico seguro para presupuestos y contratos viejos.',
  'Volver accionables los agentes: leer datos reales, crear tareas y sugerir mensajes.',
];

export default function MapaTecnologicoAkPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 pb-24">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Mapa tecnológico AK</Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Qué tecnología ya tiene la app y qué conviene conectar</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Esta pantalla evita duplicar trabajo: separa lo que ya existe, lo que está a medio conectar y lo que realmente conviene hacer en próximas PR.
            </p>
          </div>
          <Link href="/fiestas/nueva">
            <Button className="rounded-2xl bg-red-600 font-bold hover:bg-red-700">
              Ir a fiestas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-emerald-100 bg-white shadow-sm">
          <CardContent className="p-5">
            <CheckCircle2 className="mb-3 h-6 w-6 text-emerald-600" />
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Base ya creada</p>
            <p className="mt-1 text-2xl font-black text-slate-950">No duplicar</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Hay muchos módulos instalados. La mejora real es conectarlos.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-amber-100 bg-white shadow-sm">
          <CardContent className="p-5">
            <ClipboardCheck className="mb-3 h-6 w-6 text-amber-600" />
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Trabajo principal</p>
            <p className="mt-1 text-2xl font-black text-slate-950">Cerrar flujos</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Cliente, invitado, operación, vivo y post-fiesta deben hablar entre sí.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-red-100 bg-white shadow-sm">
          <CardContent className="p-5">
            <Globe2 className="mb-3 h-6 w-6 text-red-600" />
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Diferencial AK</p>
            <p className="mt-1 text-2xl font-black text-slate-950">Experiencia completa</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">No solo organizar: vender, operar y sorprender antes, durante y después.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {blocks.map((block) => {
          const Icon = block.icon;
          return (
            <Card key={block.title} className="rounded-3xl border-slate-100 bg-white shadow-sm transition hover:shadow-md">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black text-slate-950">{block.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className={statusClasses[block.status]}>{statusLabels[block.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Qué ya tiene</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{block.whatExists}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Qué falta conectar</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{block.whatToConnect}</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-red-600">Próxima acción</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">{block.nextAction}</p>
                </div>
                <Link href={block.href}>
                  <Button variant="outline" className="w-full rounded-2xl font-bold">
                    Abrir módulo relacionado <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="rounded-3xl border-red-100 bg-white shadow-xl shadow-red-900/5">
        <CardHeader>
          <CardTitle className="text-xl font-black text-slate-950">Orden recomendado de próximas PR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nextPrs.map((item, index) => (
            <div key={item} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white">{index + 1}</div>
              <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
