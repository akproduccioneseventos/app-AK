import { redirect } from 'next/navigation';
import { getProspect } from '@/app/actions/crm.actions';
import { BeneficiosSection } from '@/components/prospectos/BeneficiosSection';
import { ClubUruguaySection } from '@/components/prospectos/ClubUruguaySection';
import { ProspectFaq } from '@/components/prospectos/ProspectFaq';
import { WhatsAppFAB } from '@/components/prospectos/WhatsAppFAB';
import { ProspectChat } from '@/components/prospectos/ProspectChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calculator, Sparkles, FileText, CalendarDays } from 'lucide-react';
import Link from 'next/link';

export default async function ProspectDashboardPage({ params }: { params: { prospectId: string } }) {
  const prospect = await getProspect(params.prospectId);

  if (!prospect) {
    redirect('/prospectos');
  }

  return (
    <main className="min-h-screen bg-black text-slate-100 font-sans pb-20">
      {/* HEADER */}
      <header className="relative w-full h-[30vh] bg-zinc-900 overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2000&auto=format&fit=crop" alt="Party" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
        <div className="relative z-10 p-8 w-full max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white">¡Hola, {prospect.name.split(' ')[0]}!</h1>
          <p className="text-lg text-amber-400 font-bold mt-2">Bienvenido a tu Experiencia AK VIP</p>
        </div>
      </header>

      {/* TABS NAVEGACIÓN */}
      <div className="w-full max-w-6xl mx-auto p-4 md:p-8 -mt-8 relative z-20">
        <Tabs defaultValue="simuladores" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-slate-900 border border-white/10 p-2 gap-2 rounded-2xl mb-8">
            <TabsTrigger value="simuladores" className="py-3 rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">Simuladores</TabsTrigger>
            <TabsTrigger value="experiencia" className="py-3 rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">La Experiencia</TabsTrigger>
            <TabsTrigger value="locaciones" className="py-3 rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">Salones</TabsTrigger>
            <TabsTrigger value="faq" className="py-3 rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-black font-bold">Dudas</TabsTrigger>
          </TabsList>

          {/* SIMULADORES Y PRESUPUESTOS */}
          <TabsContent value="simuladores" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Simulador Manual */}
              <Card className="bg-gradient-to-br from-slate-900 to-black border-white/10 hover:border-amber-500/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl text-white"><Calculator className="text-amber-500" /> Creador a Medida</CardTitle>
                  <CardDescription className="text-slate-400">Arma tu fiesta seleccionando cada servicio paso a paso. Control total sobre el costo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/simulador?prospectId=${prospect.id}`}>
                    <button className="w-full h-12 rounded-xl bg-white text-black font-bold hover:bg-amber-400 transition-colors">
                      Abrir Simulador
                    </button>
                  </Link>
                </CardContent>
              </Card>

              {/* Simulador Copilot */}
              <Card className="bg-gradient-to-br from-indigo-950 to-black border-indigo-500/20 hover:border-indigo-400/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl text-white"><Sparkles className="text-indigo-400" /> AK Copilot IA</CardTitle>
                  <CardDescription className="text-slate-400">Cuéntale a nuestra Inteligencia Artificial qué soñas y te armará el presupuesto ideal en segundos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/simulador-ak?prospectId=${prospect.id}`}>
                    <button className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors">
                      Chatear con Copilot
                    </button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Historial de Presupuestos */}
            <div className="mt-12">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <FileText className="text-amber-500" /> Mis Presupuestos Guardados
              </h3>
              {prospect.budgets && prospect.budgets.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {prospect.budgets.map((b) => (
                    <div key={b.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-lg">{b.serviceType}</p>
                        <p className="text-sm text-slate-400 flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {new Date(b.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500 mt-1">{b.guests} Invitados</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-amber-400">${b.totalEstimate.toLocaleString()}</p>
                        <button className="text-xs font-bold text-white underline mt-1">Ver Detalle</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 rounded-2xl bg-white/5 border border-white/10 text-center border-dashed">
                  <p className="text-slate-400">Aún no has generado presupuestos.</p>
                  <p className="text-sm text-slate-500 mt-2">Prueba alguno de los simuladores arriba para empezar.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* EXPERIENCIA AK (Beneficios + Galeria VIP) */}
          <TabsContent value="experiencia" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BeneficiosSection />
          </TabsContent>

          {/* LOCACIONES (Club Uruguay) */}
          <TabsContent value="locaciones" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ClubUruguaySection />
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProspectFaq />
          </TabsContent>

        </Tabs>
      </div>

      {/* WIDGETS GLOBALES DEL DASHBOARD */}
      <WhatsAppFAB prospectName={prospect.name} />
      <ProspectChat prospectName={prospect.name} />

    </main>
  );
}
