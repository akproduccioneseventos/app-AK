
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle, FileText, CalendarDays, Users, Coins, StickyNote } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import type { Presupuesto } from '@/types/presupuesto';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number) => {
  if (isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no especificada";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

export default function VerPresupuestoPage() {
  const params = useParams();
  const presupuestoId = params.id as string;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuesto = useCallback(async () => {
    if (!presupuestoId) {
        setError("ID de presupuesto no válido.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedPresupuesto = await getPresupuestoById(presupuestoId);
      if (fetchedPresupuesto) {
        setPresupuesto(fetchedPresupuesto);
      } else {
        setError(`Presupuesto con ID ${presupuestoId} no encontrado.`);
        toast({ title: "Error", description: `Presupuesto con ID ${presupuestoId} no encontrado.`, variant: "destructive"});
      }
    } catch (err: any) {
      console.error("Error fetching presupuesto:", err);
      setError(err.message || "No se pudo cargar el presupuesto.");
      toast({ title: "Error al Cargar", description: err.message || "Ocurrió un problema inesperado.", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [presupuestoId, toast]);

  useEffect(() => {
    fetchPresupuesto();
  }, [fetchPresupuesto]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="ml-4 text-xl">Cargando presupuesto...</p>
      </div>
    );
  }

  if (error || !presupuesto) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center py-10">
        <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Error al Cargar Presupuesto</h1>
        <p className="text-muted-foreground">{error || "El presupuesto no pudo ser encontrado."}</p>
        <Link href="/presupuestos" passHref>
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Presupuestos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 print:space-y-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <Link href="/presupuestos" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Presupuestos
          </Button>
        </Link>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir / Guardar PDF
          </Button>
          <Link href={`/presupuestos/${presupuesto.id}/editar`} passHref>
            <Button variant="secondary">
              <Edit className="w-4 h-4 mr-2" />
              Editar Presupuesto
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden shadow-lg print:shadow-none print:border-none">
        <CardHeader className="p-6 bg-muted/30 print:bg-transparent print:p-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
             <div>
                <p className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Presupuesto Para:</p>
                <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">{presupuesto.clienteNombre}</h1>
             </div>
            <div className="text-left sm:text-right">
              <h2 className="text-lg font-semibold text-foreground">Presupuesto #{presupuesto.id.split('_').pop()}</h2>
              <PresupuestoStatusBadge status={presupuesto.estado} />
            </div>
          </div>
           <Separator className="my-3 print:hidden" />
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm print:text-xs print:gap-1">
                <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-muted-foreground"/>
                    <span className="font-medium text-muted-foreground">Tipo:</span>
                    <span className="text-foreground">{presupuesto.eventoTipo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-muted-foreground"/>
                    <span className="font-medium text-muted-foreground">Fecha:</span>
                    <span className="text-foreground">{formatDate(presupuesto.eventoFecha)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-muted-foreground"/>
                    <span className="font-medium text-muted-foreground">Invitados:</span>
                    <span className="text-foreground">{presupuesto.invitadosCantidad}</span>
                </div>
           </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6 print:p-2">
          {presupuesto.platosSeleccionados.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold font-headline text-foreground">Detalle de Platos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-2 py-2 font-medium text-left text-muted-foreground">Plato</th>
                      <th className="px-2 py-2 font-medium text-right text-muted-foreground">Cant.</th>
                      <th className="px-2 py-2 font-medium text-right text-muted-foreground">Precio Unit.</th>
                      <th className="px-2 py-2 font-medium text-right text-muted-foreground">Total Plato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuesto.platosSeleccionados.map((item) => (
                      <tr key={item.idPlato} className="border-b last:border-b-0">
                        <td className="px-2 py-2 text-foreground">{item.nombrePlato}</td>
                        <td className="px-2 py-2 text-right text-muted-foreground">{item.cantidad}</td>
                        <td className="px-2 py-2 text-right text-muted-foreground">{formatCurrency(item.costoUnitario)}</td>
                        <td className="px-2 py-2 text-right text-foreground">{formatCurrency(item.costoTotalPlato)}</td>
                      </tr>
                    ))}
                  </tbody>
                   <tfoot>
                    <tr className="border-t">
                        <td colSpan={3} className="px-2 py-2 text-right font-semibold text-muted-foreground">Subtotal Platos:</td>
                        <td className="px-2 py-2 text-right font-semibold text-foreground">{formatCurrency(presupuesto.costoSubtotalPlatos)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          
          {presupuesto.serviciosAdicionales.length > 0 && (
            <div>
              <Separator className="my-4" />
              <h3 className="mb-3 text-lg font-semibold font-headline text-foreground">Servicios Adicionales</h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-2 py-2 font-medium text-left text-muted-foreground">Servicio</th>
                      <th className="px-2 py-2 font-medium text-right text-muted-foreground">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuesto.serviciosAdicionales.map((item) => (
                      <tr key={item.idServicio} className="border-b last:border-b-0">
                        <td className="px-2 py-2 text-foreground">{item.nombreServicio}</td>
                        <td className="px-2 py-2 text-right text-foreground">{formatCurrency(item.costoServicio)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t">
                        <td className="px-2 py-2 text-right font-semibold text-muted-foreground">Subtotal Servicios:</td>
                        <td className="px-2 py-2 text-right font-semibold text-foreground">{formatCurrency(presupuesto.costoSubtotalServicios)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <Separator className="my-6 print:my-3" />
          
          <div className="space-y-2 text-right">
            <div className="flex justify-end items-center gap-4">
              <span className="text-xl font-semibold text-muted-foreground">Total Estimado:</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(presupuesto.costoTotalEstimado)}</span>
            </div>
          </div>
          
          {presupuesto.notas && (
            <div className="pt-6 print:pt-3">
                <Separator className="mb-3 print:hidden" />
                <div className="flex items-start gap-2">
                    <StickyNote className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0"/>
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground">Notas Adicionales:</h4>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{presupuesto.notas}</p>
                    </div>
                </div>
            </div>
           )}
        </CardContent>
        <CardFooter className="p-6 text-center bg-muted/30 print:hidden">
            <p className="text-xs text-muted-foreground">
                Presupuesto generado el {formatDate(presupuesto.timestamp)}. Válido por 30 días.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
