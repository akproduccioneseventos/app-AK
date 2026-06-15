import { getProspects } from '@/app/actions/crm.actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { User, Phone, Calendar, ArrowRight, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProspectsListPage() {
  const prospects = await getProspects();

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    negotiating: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    won: 'bg-green-500/10 text-green-400 border-green-500/20',
    lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const statusLabels: Record<string, string> = {
    new: 'Nuevo',
    contacted: 'Contactado',
    negotiating: 'Negociando',
    won: 'Confirmado 🎉',
    lost: 'Perdido',
  };

  return (
    <main className="min-h-screen bg-black text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="text-amber-500" /> Panel de Prospectos VIP
            </h1>
            <p className="text-slate-400 mt-2">Lista de clientes potenciales y accesos directos a sus experiencias personalizadas.</p>
          </div>
        </div>

        {prospects.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900/40 border border-white/10 border-dashed">
            <User className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-300">No hay prospectos registrados</p>
            <p className="text-sm text-slate-500 mt-2">Cuando los clientes potenciales guarden presupuestos en el simulador, aparecerán aquí.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {prospects.map((prospect) => (
              <Card key={prospect.id} className="bg-zinc-900/40 border-white/10 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-amber-500 shrink-0" />
                        {prospect.name}
                      </CardTitle>
                      <CardDescription className="text-slate-400 mt-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {prospect.phone}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={`capitalize px-2.5 py-0.5 text-xs font-semibold ${statusColors[prospect.status] || ''}`}>
                      {statusLabels[prospect.status] || prospect.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Creado: {new Date(prospect.createdAt).toLocaleDateString('es-UY')}
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Presupuestos ({prospect.budgets?.length || 0})</p>
                    {prospect.budgets && prospect.budgets.length > 0 ? (
                      <div className="space-y-2">
                        {prospect.budgets.slice(0, 2).map((budget) => (
                          <div key={budget.id} className="text-xs flex justify-between text-slate-300">
                            <span>{budget.serviceType} ({budget.guests} inv)</span>
                            <span className="font-bold text-amber-400">${budget.totalEstimate.toLocaleString()}</span>
                          </div>
                        ))}
                        {prospect.budgets.length > 2 && (
                          <p className="text-[10px] text-zinc-500 text-right">+{prospect.budgets.length - 2} más</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-600 italic">Sin presupuestos guardados</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link href={`/prospectos/${prospect.id}`}>
                      <button className="w-full h-10 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                        Ir al Portal VIP <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
