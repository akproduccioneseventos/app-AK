import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  MonitorPlay,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  TabletSmartphone,
  Tv,
  UsersRound,
} from 'lucide-react';

import { buildAkExperiencePlan } from '@/lib/experience-ak/world-class-app-plan';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const audienceCopy = {
  prospecto: 'Prospecto',
  cliente: 'Cliente',
  invitado: 'Invitado',
  operador: 'Operador AK',
} as const;

const audienceIcons = {
  prospecto: MonitorPlay,
  cliente: BadgeCheck,
  invitado: UsersRound,
  operador: ClipboardCheck,
} as const;

const heroStats = [
  { label: 'Venta', value: '5 min', detail: 'Para explicar la tecnologia sin perder al cliente.' },
  { label: 'Celular', value: '1 link', detail: 'Cliente e invitados entienden rapido.' },
  { label: 'Fiesta', value: 'en vivo', detail: 'Muro, barra, QR, pantalla y operador.' },
  { label: 'Cierre', value: 'post', detail: 'Fotos, feedback, recuerdos y referidos.' },
];

export default function ExperienciaAkPage() {
  const plan = buildAkExperiencePlan();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_52%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <Badge className="border-red-200 bg-red-50 text-red-700">Centro de experiencia AK</Badge>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
                La app tiene que vender una experiencia, no una lista de modulos.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Esta pantalla ordena la historia completa de AK: prospecto, cliente, invitado, pantalla gigante, equipo y post-fiesta.
                Sirve para presentar la tecnologia con impacto y para detectar que falta antes de una fiesta real.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-red-600 text-white hover:bg-red-700">
                  <Link href="/presentacion-led/portafolio">
                    <MonitorPlay className="mr-2 h-4 w-4" />
                    Abrir portafolio LED
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-slate-200 text-slate-800 hover:bg-slate-50">
                  <Link href="/eventos">
                    Elegir una fiesta real
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative min-h-[440px] overflow-hidden bg-slate-950 p-6 text-white sm:p-8 lg:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(248,113,113,0.34),transparent_26%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(135deg,#111827,#1f2937_58%,#450a0a)]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="grid grid-cols-2 gap-3">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-100">{stat.label}</p>
                      <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-300">{stat.detail}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <Sparkles className="h-10 w-10 text-red-100" />
                  <p className="mt-6 text-sm uppercase tracking-[0.28em] text-red-100">Antes + durante + despues</p>
                  <h2 className="mt-3 text-4xl font-black sm:text-5xl">Una historia sola</h2>
                  <p className="mt-4 text-sm leading-7 text-slate-200">{plan.globalMessage}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-4">
          {plan.demoSurfaces.map((surface, index) => {
            const Icon = audienceIcons[surface.audience];
            return (
              <Card key={surface.id} className="border-slate-200 bg-white shadow-lg shadow-slate-950/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-red-950/10">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-2xl bg-red-600 p-3 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-black text-slate-300">0{index + 1}</span>
                  </div>
                  <div>
                    <Badge variant="outline" className="border-slate-200 text-slate-500">{audienceCopy[surface.audience]}</Badge>
                    <CardTitle className="mt-3 text-lg font-black text-slate-950">{surface.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="min-h-[72px] text-sm leading-6 text-slate-600">{surface.promise}</p>
                  <div className="mt-4 space-y-2">
                    {surface.proof.map((item) => (
                      <p key={item} className="flex gap-2 text-xs font-bold text-slate-500">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {item}
                      </p>
                    ))}
                  </div>
                  <Button asChild variant="outline" className="mt-5 w-full rounded-full border-red-200 text-red-700 hover:bg-red-50">
                    <Link href={surface.href}>Abrir</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="rounded-[2rem] border-slate-200 bg-white shadow-xl shadow-slate-950/5">
            <CardHeader>
              <Badge className="w-fit bg-slate-950 text-white">Modo demo perfecto</Badge>
              <CardTitle className="text-3xl font-black tracking-tight text-slate-950">Lo que yo agregaria para vender mejor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ['Demo por tipo de fiesta', 'Boda, XV, corporativo o Club Uruguay con datos de ejemplo lindos.'],
                ['Control en vivo unico', 'Una cabina de mando para muro, barra, QR, pantalla y tareas.'],
                ['Checklist antes de evento', 'Un semaforo simple que diga que falta sin tecnicismos.'],
                ['Plantillas premium', 'Invitacion, portal, muro, LED y barra con estilos ya armados.'],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-black text-slate-950">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-black">
                <Tv className="h-6 w-6 text-red-200" />
                Mapa de experiencia conectado
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: MonitorPlay, label: 'Prospecto', detail: 'Ve tecnologia, portfolio y valor diferencial.' },
                { icon: TabletSmartphone, label: 'Cliente', detail: 'Organiza desde el celular sin saber informatica.' },
                { icon: UsersRound, label: 'Invitado', detail: 'Confirma, participa, sube fotos y usa QR.' },
                { icon: PartyPopper, label: 'Fiesta', detail: 'Pantalla, muro, barra, entretenimiento y discoteca.' },
                { icon: CalendarClock, label: 'Equipo AK', detail: 'Responsables, agenda, tareas y roles claros.' },
                { icon: ShieldCheck, label: 'Calidad', detail: 'La app avisa que falta antes de salir a la luz.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Icon className="h-5 w-5 text-red-100" />
                    <p className="mt-3 font-black text-white">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-white/65">{item.detail}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
