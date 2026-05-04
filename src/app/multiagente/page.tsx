import Link from 'next/link';
import { Bot, Brain, CalendarCheck, DollarSign, Megaphone, PartyPopper, Users, Rocket, Wrench, Radar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const agents = [
  {
    name: 'Control Tower AK',
    href: '/control-tower',
    icon: Radar,
    description: 'Centro diario de prioridades, pendientes importantes y próximos pasos recomendados.',
    status: 'Nuevo',
  },
  {
    name: 'Secretaria AK',
    href: '/secretaria-ak',
    icon: CalendarCheck,
    description: 'Asistente personal siempre activo para recordatorios, llamadas, pagos, reuniones y tareas del día.',
    status: 'Operativo',
  },
  {
    name: 'Asistente por Fiesta',
    href: '/fiestas/nueva/asistente',
    icon: PartyPopper,
    description: 'Agente dinámico que trabaja con una fiesta específica y guarda aprendizajes de ese evento.',
    status: 'Operativo',
  },
  {
    name: 'Coordinador General de Fiestas',
    href: '/multiagente/fiestas',
    icon: Users,
    description: 'Agente que cruza todas las fiestas, detecta prioridades y recibe aprendizajes de eventos terminados.',
    status: 'Operativo',
  },
  {
    name: 'Agente Contable',
    href: '/multiagente/contable',
    icon: DollarSign,
    description: 'Agente para pagos, saldos, costos, rentabilidad y alertas financieras.',
    status: 'Operativo',
  },
  {
    name: 'Agente Marketing',
    href: '/empresa/redes-sociales/ia-marketing',
    icon: Megaphone,
    description: 'Agente para redes, campañas, WhatsApp y publicaciones con estilo AK.',
    status: 'Existente',
  },
  {
    name: 'Memoria del Multiagente',
    href: '/multiagente/memoria',
    icon: Brain,
    description: 'Pantalla para ver y guardar aprendizajes que los agentes pueden usar con el tiempo.',
    status: 'Operativo',
  },
  {
    name: 'Acciones reales',
    href: '/multiagente/acciones',
    icon: Wrench,
    description: 'Crea tareas, recordatorios, aprendizajes y cierre de fiesta con retroalimentación al agente general.',
    status: 'Operativo',
  },
];

export default function MultiagentePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/60 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Sistema operativo</Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Multiagente AK</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Centro de agentes de AK Producciones. Cada agente trabaja por área, usa memoria y puede ejecutar acciones reales controladas.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-red-700 shadow-sm">
              <Rocket className="h-4 w-4" /> Multiagente funcional
            </div>
          </div>
          <div className="rounded-2xl bg-red-600 p-4 text-white shadow-lg shadow-red-700/20">
            <Bot className="h-10 w-10" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map(agent => {
          const Icon = agent.icon;
          return (
            <Card key={agent.name} className="rounded-2xl border-red-100 bg-white shadow-sm">
              <CardHeader>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="rounded-2xl bg-red-50 p-3 text-red-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="border-red-200 text-red-700">{agent.status}</Badge>
                </div>
                <CardTitle className="text-lg font-black text-slate-900">{agent.name}</CardTitle>
                <CardDescription className="text-sm leading-6">{agent.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={agent.href}>
                  <Button className="w-full rounded-2xl bg-red-600 font-bold hover:bg-red-700">Abrir</Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
