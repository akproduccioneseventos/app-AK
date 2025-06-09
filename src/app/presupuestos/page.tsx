
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, CheckSquare, CalendarDays, Coins, History, Loader2 } from 'lucide-react';
import PresupuestoCard from '@/components/presupuestos/presupuesto-card';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getFiestaActual, updatePresupuestoAsignadoFiestaActual } from '@/app/actions/fiesta-actual';
import { useToast } from '@/hooks/use-toast';

export default function PresupuestosPage() {
  const [presupuestosAnteriores, setPresupuestosAnteriores] = useState<Presupuesto[]>([]);
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningPresupuestoId, setAssigningPresupuestoId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [presupuestosData, fiestaData] = await Promise.all([
        getPresupuestos(),
        getFiestaActual()
      ]);
      setPresupuestosAnteriores(presupuestosData);
      setFiestaActual(fiestaData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleAssignPresupuesto = async (presupuestoId: string) => {
    if (!fiestaActual) return;
    setAssigningPresupuestoId(presupuestoId);
    const isCurrentlyAssigned = fiestaActual.presupuestoId === presupuestoId;
    const newPresupuestoId = isCurrentlyAssigned ? null : presupuestoId;

    try {
      const result = await updatePresupuestoAsignadoFiestaActual(newPresupuestoId);
      if (result.success) {
        toast({
          title: isCurrentlyAssigned ? "Presupuesto Desasignado" : "Presupuesto Asignado",
          description: `El presupuesto ha sido ${isCurrentlyAssigned ? 'desasignado de' : 'asignado a'} la fiesta actual.`,
        });
        await fetchData(); // Recargar datos para reflejar el cambio
      } else {
        throw new Error(result.error || "Error al actualizar la asignación del presupuesto.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAssigningPresupuestoId(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando presupuestos...</p>
      </div>
    );
  }

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
              <CardDescription>Revisá, gestioná y asigná presupuestos a tu fiesta actual.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {presupuestosAnteriores.map((presupuesto) => (
              <PresupuestoCard 
                key={presupuesto.id} 
                presupuesto={presupuesto}
                isAssignedToCurrentFiesta={fiestaActual?.presupuestoId === presupuesto.id}
                onToggleAssign={() => handleToggleAssignPresupuesto(presupuesto.id)}
                isAssigning={assigningPresupuestoId === presupuesto.id}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {presupuestosAnteriores.length === 0 && !isLoading && (
         <div className="text-center py-12 bg-card border rounded-lg shadow-sm">
            <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-xl font-medium">Aún no has creado ningún presupuesto.</p>
            <p className="text-muted-foreground mt-1">¡Comenzá ahora mismo haciendo clic en el botón de arriba!</p>
        </div>
      )}
    </div>
  );
}
