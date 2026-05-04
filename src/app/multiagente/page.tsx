import { Bot, Brain, CalendarCheck, DollarSign, Megaphone, PartyPopper, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const agents = [
  {
    name: 'Secretaria AK',
    icon: CalendarCheck,
    description: 'Asistente personal siempre activo para recordatorios, llamadas, pagos, reuniones y tareas del día.',
    status: 'Base lista',
  },
  {
    name: 'Asistente por Fiesta',
    icon: PartyPopper,
    description: 'Agente dinámico que trabaja con una fiesta específica y guarda aprendizajes de ese evento.',
    status: 'Base lista',
  },
  {
    name: 'Coordinador General de Fiestas',
    icon: Users,
    description: 'Agente que cruza todas las fiestas, detecta riesgos y recibe aprendizajes de eventos terminados.',
    status: 'Base lista',
  },
  {
    name: 'Agente Contable',
    icon: DollarSign,
    description: 'Agente para pagos, saldos, costos, rentabilidad y alertas financieras.',
    status: 'Base lista',
  },
  {
    name: 'Agente Marketing',
    icon: Megaphone,
    description: 'Agente para redes, campañas, WhatsApp y publicaciones con estilo AK.',
    status: 'Base lista',
  },
  {
    name: 'Multiagente Central',
    icon: Brain,
    description: 'Router que decide qué agente debe responder según el módulo donde estés.',
    status: 'Base lista',
  },
];

export default function MultiagentePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-white via-red-50/60 to-white p-6 shadow-xl shadow-red-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-red-600 text-white">Nuevo sistema</Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Multiagente AK</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Base técnica del nuevo sistema de agentes de AK Producciones. Esta primera etapa crea memoria, perfiles y motor para que los agentes puedan especializarse con el tiempo.
            </p>
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
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Próxima etapa: conexión visual y acciones reales.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
