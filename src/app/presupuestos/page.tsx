
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle, Loader2, AlertTriangle, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPresupuestos, deletePresupuesto, markPresupuestoAsFacturado } from '@/app/actions/presupuestos';
import type { Presupuesto } from '@/types/presupuesto';
import PresupuestoCard from '@/components/presupuestos/presupuesto-card';
import { getFiestaActual, addInvoiceIdToFiestaActual, removeInvoiceIdFromFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { saveInvoice } from '@/app/actions/invoices';


export default function PresupuestosPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null); // For delete/assign actions
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [presData, fiestaData] = await Promise.all([getPresupuestos(), getFiestaActual()]);
            setPresupuestos(presData);
            setFiestaActual(fiestaData);
        } catch (e: any) {
            setError(e.message || "No se pudieron cargar los datos.");
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleAssign = async (presupuesto: Presupuesto) => {
        if (!fiestaActual) return;
        setIsProcessing(presupuesto.id);
        
        let newFiestaData = { ...fiestaActual, presupuestoId: presupuesto.id };
        // This is a simplified update; in a real scenario you'd post this to a server action.
        // For now, we simulate success.
        
        try {
            // A real server action would be better here. This is a temporary simulation.
            const { saveFiesta } = await import('@/app/actions/fiesta-actual');
            const result = await saveFiesta(newFiestaData);
            if (result.success) {
                setFiestaActual(newFiestaData);
                toast({ title: "Presupuesto Asignado", description: `"${presupuesto.clienteNombre}" asignado a la fiesta actual.` });
            } else {
                 throw new Error(result.error);
            }
        } catch(e:any) {
             toast({ title: "Error", description: e.message, variant: "destructive" });
        }
        
        setIsProcessing(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary"/>
                    Listado de Presupuestos
                </h1>
                <Button onClick={() => router.push('/presupuestos/nuevo')}>
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Crear Nuevo Presupuesto
                </Button>
            </div>
            
            {isLoading ? (
                 <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
            ) : error ? (
                <div className="text-center py-10 text-destructive"><AlertTriangle className="w-10 h-10 mx-auto mb-2"/>{error}</div>
            ) : presupuestos.length === 0 ? (
                <Card className="text-center py-10">
                    <CardHeader>
                        <CardTitle>No hay presupuestos</CardTitle>
                        <CardDescription>Aún no has creado ningún presupuesto. ¡Empieza ahora!</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={() => router.push('/presupuestos/nuevo')}>
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Crear Primer Presupuesto
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {presupuestos.map(p => (
                        <PresupuestoCard 
                            key={p.id}
                            presupuesto={p}
                            isAssigning={isProcessing === p.id}
                            isAssignedToCurrentFiesta={fiestaActual?.presupuestoId === p.id}
                            onToggleAssign={() => handleToggleAssign(p)}
                            onDeleteSuccess={fetchData}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
