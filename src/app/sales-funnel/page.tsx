
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Edit, Filter as FilterIcon, Users, UserCircle } from 'lucide-react';
import { getCustomers } from '@/app/actions/customers';
import type { Customer, SalesFunnelStage, CustomerStatus } from '@/types/customer';
import { ALL_SALES_FUNNEL_STAGES } from '@/types/customer';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const getStageBadgeVariant = (stage?: SalesFunnelStage): "default" | "secondary" | "destructive" | "outline" => {
  if (!stage) return "secondary";
  switch (stage) {
    case 'Lead': return "secondary";
    case 'Contactado': return "outline";
    case 'Calificado': return "default";
    case 'Propuesta Presentada': return "default";
    case 'Negociación': return "default";
    case 'Ganado': return "default";
    case 'Perdido': return "destructive";
    case 'En Espera': return "secondary";
    default: return "secondary";
  }
};

const getCustomerStatusBadgeVariant = (status?: CustomerStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "secondary";
  switch (status) {
    case 'Actual': return "default";
    case 'Antiguo': return "secondary";
    default: return "secondary";
  }
};

export default function SalesFunnelPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err: any) {
      console.error("Error loading customers for sales funnel:", err);
      setError("No se pudieron cargar los clientes.");
      toast({ title: "Error de Carga", description: "No se pudieron cargar los clientes para el embudo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const customersByStage = useMemo(() => {
    const grouped = new Map<SalesFunnelStage, Customer[]>();
    ALL_SALES_FUNNEL_STAGES.forEach(stage => grouped.set(stage, []));

    customers.forEach(customer => {
      const stage = customer.salesFunnelStage || 'Lead'; // Default a Lead si no está definido
      const stageGroup = grouped.get(stage);
      if (stageGroup) {
        stageGroup.push(customer);
      } else {
        // Si por alguna razón la etapa no está en ALL_SALES_FUNNEL_STAGES (debería ser raro),
        // lo podríamos agrupar en 'Lead' o una categoría 'Otro'.
        // Por ahora, se asume que todas las etapas posibles están en ALL_SALES_FUNNEL_STAGES.
        const leadGroup = grouped.get('Lead');
        if (leadGroup) leadGroup.push(customer);
      }
    });
    return grouped;
  }, [customers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Cargando embudo de ventas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center p-4">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Error al Cargar Embudo</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadCustomers}>Intentar de Nuevo</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-3">
        <FilterIcon className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Embudo de Ventas
        </h1>
      </div>
      <p className="text-muted-foreground">
        Visualiza tus clientes a través de las diferentes etapas del proceso de ventas.
        Haz clic en "Editar" en la tarjeta de un cliente para cambiar su etapa.
      </p>
      
      <ScrollArea className="flex-grow whitespace-nowrap pb-4 rounded-md border bg-muted/30">
        <div className="flex gap-4 p-4 h-full min-h-[500px]"> {/* Contenedor para las columnas */}
          {ALL_SALES_FUNNEL_STAGES.map(stage => {
            const stageCustomers = customersByStage.get(stage) || [];
            const stageColor = getStageBadgeVariant(stage);
            const borderColorClass = 
                stageColor === 'default' ? 'border-primary' :
                stageColor === 'secondary' ? 'border-gray-400' :
                stageColor === 'destructive' ? 'border-destructive' :
                'border-blue-400';


            return (
              <Card key={stage} className={`w-72 sm:w-80 md:w-[340px] flex-shrink-0 flex flex-col h-full shadow-md border-t-4 bg-card ${borderColorClass}`}>
                <CardHeader className="pb-3 sticky top-0 bg-card/90 backdrop-blur-sm z-10">
                  <CardTitle className="font-headline text-lg flex items-center justify-between">
                    <span style={{ color: `hsl(var(--${stageColor === 'default' ? 'primary' : stageColor}))`}}>{stage}</span>
                    <Badge variant={stageColor} className="text-sm px-2 py-0.5">{stageCustomers.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-grow">
                  <CardContent className="pt-2 pb-3 px-3 space-y-3">
                    {stageCustomers.length > 0 ? (
                      stageCustomers.map(customer => (
                        <Card key={customer.id} className="shadow-sm hover:shadow-md transition-shadow bg-background/80">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-grow min-w-0">
                                <h4 className="font-semibold text-sm text-foreground truncate" title={customer.companyName || customer.name}>
                                  <UserCircle className="inline-block w-4 h-4 mr-1.5 text-muted-foreground" />
                                  {customer.companyName || customer.name}
                                </h4>
                                {customer.estadoCliente && (
                                  <Badge variant={getCustomerStatusBadgeVariant(customer.estadoCliente)} className="mt-1 text-xs">
                                    {customer.estadoCliente}
                                  </Badge>
                                )}
                              </div>
                               <Link href={`/customers/${customer.id}/edit`} passHref>
                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" title="Editar Cliente">
                                  <Edit className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                </Button>
                              </Link>
                            </div>
                            {(customer.email || customer.phone) && (
                                <div className="mt-1.5 pt-1.5 border-t border-dashed">
                                    {customer.email && (
                                    <p className="text-xs text-muted-foreground truncate" title={customer.email}>Email: {customer.email}</p>
                                    )}
                                    {customer.phone && (
                                    <p className="text-xs text-muted-foreground truncate" title={customer.phone}>Tel: {customer.phone}</p>
                                    )}
                                </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-10 flex flex-col items-center justify-center h-full min-h-[100px]">
                        <Users className="w-10 h-10 text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground">No hay clientes en esta etapa.</p>
                      </div>
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
