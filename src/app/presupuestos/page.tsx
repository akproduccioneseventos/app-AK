import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, CheckSquare, CalendarDays, Coins, History } from 'lucide-react';
import PresupuestoCard from '@/components/presupuestos/presupuesto-card';
import type { Presupuesto } from '@/types/presupuesto';
import { getPresupuestos } from '@/app/actions/presupuestos'; // Simulated action

export default async function PresupuestosPage() {
  const presupuestosAnteriores: Presupuesto[] = await getPresupuestos(); // Fetch simulated data

  return (
    <div className="space-y-8">
      <Card className="shadow-xl overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/10">
        <CardHeader className="p-6 md:p-8 text-center">
          <div className="mb-6 flex justify-center space-x-4">
            <CheckSquare className="w-12 h-12 text-primary opacity-80" />
            <CalendarDays className="w-12 h-12 text-primary opacity-80" />
            <Coins className="w-12 h-12 text-primary opacity-80" />
          </div>
          <CardTitle className="text-4xl font-bold tracking-tight font-headline text-primary">
            Presupuesto Personalizado
          </CardTitle>
          <CardDescription className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Creá, gestioná y enviá presupuestos detallados para tus eventos. Configurá cada detalle y sorprendé a tus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 text-center">
          <Link href="/presupuestos/nuevo" passHref>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-10 py-6 text-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              <PlusCircle className="w-7 h-7 mr-3" />
              Crear Nuevo Presupuesto
            </Button>
          </Link>
        </CardContent>
      </Card>

      {presupuestosAnteriores.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center gap-3">
            <History className="w-7 h-7 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl">Historial de Presupuestos</CardTitle>
              <CardDescription>Revisá y gestioná los presupuestos que has creado anteriormente.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {presupuestosAnteriores.map((presupuesto) => (
              <PresupuestoCard key={presupuesto.id} presupuesto={presupuesto} />
            ))}
          </CardContent>
        </Card>
      )}

      {presupuestosAnteriores.length === 0 && (
         <div className="text-center py-12 bg-card border rounded-lg shadow-sm">
            <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-xl font-medium">Aún no has creado ningún presupuesto.</p>
            <p className="text-muted-foreground mt-1">¡Comenzá ahora mismo haciendo clic en el botón de arriba!</p>
        </div>
      )}
    </div>
  );
}
