
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, CheckSquare, CalendarDays, Coins, History, Loader2, Search, AlertTriangle, Filter, Settings as SettingsIcon, Wand2, Bot } from 'lucide-react';
import PresupuestoCard from '@/components/presupuestos/presupuesto-card';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getFiestaActual, updatePresupuestoAsignadoFiestaActual } from '@/app/actions/fiesta-actual';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALL_PRESUPUESTO_ESTADOS: Presupuesto['estado'][] = ['Borrador', 'Enviado', 'Aceptado', 'Rechazado', 'Facturado'];

export default function PresupuestosPage() {
  const [allPresupuestos, setAllPresupuestos] = useState<Presupuesto[]>([]);
  const [filteredPresupuestos, setFilteredPresupuestos] = useState<Presupuesto[]>([]);
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningPresupuestoId, setAssigningPresupuestoId] = useState<string | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Record<Presupuesto['estado'], boolean>>(
    ALL_PRESUPUESTO_ESTADOS.reduce((acc, status) => ({...acc, [status]: true }), {} as Record<Presupuesto['estado'], boolean>)
  );


  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [presupuestosData, fiestaData] = await Promise.all([
        getPresupuestos(),
        getFiestaActual()
      ]);
      setAllPresupuestos(presupuestosData);
      setFiestaActual(fiestaData);
    } catch (err: any) {
      console.error("Error cargando datos:", err);
      setError("No se pudieron cargar los datos. Intente de nuevo.");
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = allPresupuestos.filter(presupuesto => {
      const searchTermMatch = presupuesto.clienteNombre.toLowerCase().includes(lowercasedSearchTerm) || presupuesto.eventoTipo.toLowerCase().includes(lowercasedSearchTerm);
      const statusMatch = statusFilter[presupuesto.estado];
      return searchTermMatch && statusMatch;
    });
    setFilteredPresupuestos(filtered);
  }, [searchTerm, allPresupuestos, statusFilter]);

  const handleStatusFilterChange = (status: Presupuesto['estado']) => {
    setStatusFilter(prev => ({ ...prev, [status]: !prev[status]}));
  };

  const anyStatusFilterActive = ALL_PRESUPUESTO_ESTADOS.some(status => !statusFilter[status]);


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
        await fetchData(); 
      } else {
        throw new Error(result.error || "Error al actualizar la asignación del presupuesto.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAssigningPresupuestoId(null);
    }
  };
  
  return (
    <div className="space-y-8">
      <Card className="shadow-xl overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/10">
        <CardHeader className="p-6 md:p-8 text-center">
           <div className="mb-6 flex justify-center space-x-4">
            <Coins className="w-12 h-12 text-primary opacity-80" />
            <FileTextIcon className="w-12 h-12 text-primary opacity-80" />
            <CalendarDays className="w-12 h-12 text-primary opacity-80" />
          </div>
          <CardTitle className="text-4xl font-bold tracking-tight font-headline text-primary">
            Central de Presupuestos
          </CardTitle>
          <CardDescription className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Crea, gestiona y configura todas tus herramientas de cotización desde un solo lugar.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 text-center bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/presupuestos/nuevo" passHref>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 w-full sm:w-auto">
                <PlusCircle className="w-7 h-7 mr-3" />
                Crear Presupuesto Manual
              </Button>
            </Link>
             <Link href="/settings/budget-display" passHref>
              <Button variant="outline" size="lg" className="rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border-primary text-primary hover:bg-primary/5 w-full sm:w-auto">
                <SettingsIcon className="w-6 h-6 mr-3"/>
                Configurar Presupuestos
              </Button>
            </Link>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-md mx-auto">
                <Link href="/armado-rapido" passHref>
                    <Button variant="secondary" className="w-full py-6 text-base"><Wand2 className="w-5 h-5 mr-2"/>Armado Rápido</Button>
                </Link>
                 <Link href="/asistente-ak" passHref>
                    <Button variant="secondary" className="w-full py-6 text-base"><Bot className="w-5 h-5 mr-2"/>Asistente IA</Button>
                </Link>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <History className="w-7 h-7 text-primary" />
                <div>
                <CardTitle className="font-headline text-2xl">Historial de Presupuestos</CardTitle>
                <CardDescription>Revisá, gestioná y asigná presupuestos a tu fiesta actual.</CardDescription>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                    type="text"
                    placeholder="Buscar por cliente o tipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                    />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-shrink-0">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrar Estado
                      {anyStatusFilterActive && <span className="ml-1.5 h-2 w-2 rounded-full bg-primary" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Mostrar por Estado</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ALL_PRESUPUESTO_ESTADOS.map(status => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={statusFilter[status]}
                        onCheckedChange={() => handleStatusFilterChange(status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                 <div className="flex items-center justify-center min-h-[200px]">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="ml-3 text-lg">Cargando...</p>
                </div>
            ) : error ? (
                <div className="py-10 text-center text-destructive">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-semibold text-lg">Error al Cargar Presupuestos</p>
                    <p className="text-sm">{error}</p>
                    <Button onClick={fetchData} className="mt-4" variant="outline">Reintentar</Button>
                </div>
            ) : filteredPresupuestos.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPresupuestos.map((presupuesto) => (
                  <PresupuestoCard 
                    key={presupuesto.id} 
                    presupuesto={presupuesto}
                    isAssignedToCurrentFiesta={fiestaActual?.presupuestoId === presupuesto.id}
                    onToggleAssign={() => handleToggleAssignPresupuesto(presupuesto.id)}
                    isAssigning={assigningPresupuestoId === presupuesto.id}
                  />
                ))}
              </div>
            ) : (
                <div className="text-center py-12 bg-card border rounded-lg shadow-sm">
                    <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-xl font-medium">
                        {allPresupuestos.length === 0 ? "Aún no has creado ningún presupuesto." : "No se encontraron presupuestos que coincidan con los filtros."}
                    </p>
                    {allPresupuestos.length === 0 && (
                         <p className="text-muted-foreground mt-1">¡Comenzá ahora mismo haciendo clic en el botón de arriba!</p>
                    )}
                </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
