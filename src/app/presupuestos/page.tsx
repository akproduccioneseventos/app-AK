import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, CheckSquare, CalendarDays, Coins } from 'lucide-react';
import PresupuestoCard from '@/components/presupuestos/presupuesto-card';
import type { Presupuesto } from '@/types/presupuesto';
import { getPresupuestos } from '@/app/actions/presupuestos'; // Simulated action

export default async function PresupuestosPage() {
  const presupuestosAnteriores: Presupuesto[] = await getPresupuestos(); // Fetch simulated data

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center p-6 rounded-lg bg-gradient-to-br from-accent/50 via-background to-primary/30 shadow-inner">
        <div className="mb-6 flex space-x-4">
          <CheckSquare className="w-12 h-12 text-primary opacity-70" />
          <CalendarDays className="w-12 h-12 text-primary opacity-70" />
          <Coins className="w-12 h-12 text-primary opacity-70" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight font-headline text-primary">
          Presupuesto Personalizado
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-xl">
          Armá tu presupuesto paso a paso para tu fiesta soñada. Creá, gestioná y enviá tus presupuestos de forma fácil y elegante.
        </p>
        <Link href="/presupuestos/nuevo" passHref className="mt-8">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-shadow">
            <PlusCircle className="w-6 h-6 mr-3" />
            Crear Nuevo Presupuesto
          </Button>
        </Link>
      </div>

      {presupuestosAnteriores.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Historial de Presupuestos</CardTitle>
            <CardDescription>Revisá los presupuestos que has creado anteriormente.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {presupuestosAnteriores.map((presupuesto) => (
              <PresupuestoCard key={presupuesto.id} presupuesto={presupuesto} />
            ))}
          </CardContent>
        </Card>
      )}

      {presupuestosAnteriores.length === 0 && (
         <div className="text-center py-10">
            <p className="text-muted-foreground text-lg">Aún no has creado ningún presupuesto.</p>
            <p className="text-muted-foreground">¡Comenzá ahora mismo haciendo clic en el botón de arriba!</p>
        </div>
      )}
    </div>
  );
}
