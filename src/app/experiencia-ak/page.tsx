import Link from 'next/link';
import { ArrowRight, CalendarClock, CheckCircle2, MonitorPlay, PartyPopper, Sparkles, UsersRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const experienceSteps = [
  {
    title: 'El prospecto ve la tecnologia',
    description: 'Portafolio LED, servicios, ejemplos visuales y mapa de todo lo que se puede contratar.',
    href: '/presentacion-led/portafolio',
    icon: MonitorPlay,
  },
  {
    title: 'El cliente organiza sin complicarse',
    description: 'Portal cliente con pagos, documentos, tareas, reuniones, invitados y mensajes en un lugar claro.',
    href: '/fiestas/nueva/portal-cliente/experiencia-mundial',
    icon: CheckCircle2,
  },
  {
    title: 'Los invitados usan el celular',
    description: 'Invitacion, confirmacion, datos de la fiesta, calendario y experiencia simple para cualquier persona.',
    href: '/fiestas/nueva/modulo-invitado',
    icon: UsersRound,
  },
  {
    title: 'La fiesta se ve en vivo',
    description: 'Muro social, fotos, mensajes, pantalla LED y contenido para que la tecnologia se note durante el evento.',
    href: '/fiestas/nueva/muro-social',
    icon: PartyPopper,
  },
  {
    title: 'El equipo trabaja coordinado',
    description: 'Comando por fiesta, responsables, tareas, calendario, Gmail y seguimiento operativo.',
    href: '/eventos',
    icon: CalendarClock,
  },
];

const proofPoints = [
  'Venta visual antes de contratar',
  'Experiencia movil para cliente e invitados',
  'Pantalla LED y muro social para el evento',
  'Calendario y correo como apoyo operativo',
  'Comando interno para detectar faltantes',
  'Personalizacion por fiesta y por cliente',
];

export default function ExperienciaAkPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_54%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-2xl shadow-slate-950/10">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <Badge className="border-red-200 bg-red-50 text-red-700">Centro de experiencia AK</Badge>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
                La tecnologia de la fiesta explicada como una experiencia completa.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Esta pantalla existe para vender y ordenar: muestra que AK no ofrece solo servicios sueltos, sino una experiencia conectada antes, durante y despues del evento.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-red-600 text-white hover:bg-red-700">
                  <Link href="/presentacion-led/portafolio">
                    <MonitorPlay className="mr-2 h-4 w-4" />
                    Ver portafolio LED
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-red-200 text-red-700 hover:bg-red-50">
                  <Link href="/settings/cierre-operativo-final">
                    Cierre operativo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative min-h-[420px] overflow-hidden bg-slate-950 p-6 text-white sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(248,113,113,0.45),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.22),transparent_24%),linear-gradient(135deg,#111827,#450a0a)]" />
              <div className="relative flex h-full flex-col justify-end">
                <Sparkles className="h-10 w-10 text-red-100" />
                <p className="mt-6 text-sm uppercase tracking-[0.28em] text-red-100">Antes + durante + despues</p>
                <h2 className="mt-3 text-4xl font-black sm:text-5xl">Una historia sola</h2>
                <p className="mt-4 text-sm leading-7 text-slate-200">
                  Prospecto, cliente, invitados, pantalla, equipo y seguimiento quedan conectados por rutas visibles. Si una fiesta tiene datos reales, se puede abrir desde Eventos y mostrarla como portfolio real.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-5">
          {experienceSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="border-slate-200 bg-white shadow-lg shadow-slate-950/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-red-950/10">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-2xl bg-red-600 p-3 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-black text-slate-300">0{index + 1}</span>
                  </div>
                  <CardTitle className="text-lg font-black text-slate-950">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="min-h-[96px] text-sm leading-6 text-slate-600">{step.description}</p>
                  <Button asChild variant="outline" className="mt-4 w-full rounded-full border-red-200 text-red-700 hover:bg-red-50">
                    <Link href={step.href}>Abrir</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/10 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <Badge className="bg-white text-slate-950">Checklist comercial</Badge>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">Que tiene que entender el cliente</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                La venta no es mostrar muchas pantallas. Es mostrar que cada pantalla resuelve una parte concreta de la fiesta y que el cliente no queda solo.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {proofPoints.map((point) => (
                <div key={point} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <CheckCircle2 className="h-5 w-5 text-red-200" />
                  <p className="mt-3 text-sm font-bold leading-6 text-white">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
