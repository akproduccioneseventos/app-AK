
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Edit, Filter as FilterIcon, Users, UserCircle, Mail, Phone } from 'lucide-react';
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
    case 'Ganado': return "default"; // Podría ser un color más "success"
    case 'Perdido': return "destructive";
    case 'En Espera': return "secondary";
    default: return "secondary";
  }
};

const getCustomerStatusBadgeVariant = (status?: CustomerStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "secondary";
  switch (status) {
    case 'Actual': return "default"; // Considera un color de éxito si es apropiado
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
      setError("No se pudieron cargar los clientes para el embudo de ventas.");
      toast({ title: "Error de Carga", description: "No se pudo obtener la información de los clientes.", variant: "destructive" });
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
      const stage = customer.salesFunnelStage || 'Lead';
      const stageGroup = grouped.get(stage);
      if (stageGroup) {
        stageGroup.push(customer);
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
    <div className="h-full flex flex-col space-y-6">
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
      
      <ScrollArea className="flex-grow whitespace-nowrap rounded-md border bg-muted/20">
        <div className="flex gap-4 p-4 h-full min-h-[600px]"> {/* Aumentar min-h para dar más espacio a las columnas */}
          {ALL_SALES_FUNNEL_STAGES.map(stage => {
            const stageCustomers = customersByStage.get(stage) || [];
            const stageColorVariant = getStageBadgeVariant(stage);
            
            let borderColorClass = 'border-gray-300 dark:border-gray-700'; // Default
            if (stageColorVariant === 'default') borderColorClass = 'border-primary';
            else if (stageColorVariant === 'secondary') borderColorClass = 'border-gray-400 dark:border-gray-600';
            else if (stageColorVariant === 'destructive') borderColorClass = 'border-destructive';
            else if (stageColorVariant === 'outline') borderColorClass = 'border-blue-500';


            return (
              <Card key={stage} className={`w-72 sm:w-80 md:w-[350px] flex-shrink-0 flex flex-col h-full shadow-lg border-t-4 ${borderColorClass}`}>
                <CardHeader className="pb-3 sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-lg" style={{ color: `hsl(var(--${stageColorVariant === 'default' ? 'primary' : stageColorVariant}))` }}>
                      {stage}
                    </CardTitle>
                    <Badge variant={stageColorVariant} className="text-sm px-2.5 py-1">{stageCustomers.length}</Badge>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-grow"> {/* ScrollArea para el contenido de la columna */}
                  <CardContent className="pt-3 pb-4 px-3 space-y-3">
                    {stageCustomers.length > 0 ? (
                      stageCustomers.map(customer => (
                        <Card key={customer.id} className="shadow-sm hover:shadow-lg transition-shadow bg-background/70 backdrop-blur-sm">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                   <UserCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                   <h4 className="font-semibold text-sm text-foreground truncate" title={customer.companyName || customer.name}>
                                    {customer.companyName || customer.name}
                                  </h4>
                                </div>
                                <Badge variant={getCustomerStatusBadgeVariant(customer.estadoCliente)} className="text-xs py-0.5 px-1.5">
                                  {customer.estadoCliente || 'Actual'}
                                </Badge>
                              </div>
                              <Link href={`/customers/${customer.id}/edit`} passHref>
                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-primary" title="Editar Cliente">
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            </div>
                            {(customer.email || customer.phone) && (
                                <div className="mt-2 pt-2 border-t border-dashed space-y-0.5">
                                    {customer.email && (
                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1" title={customer.email}>
                                      <Mail className="w-3 h-3 flex-shrink-0" /> {customer.email}
                                    </p>
                                    )}
                                    {customer.phone && (
                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1" title={customer.phone}>
                                      <Phone className="w-3 h-3 flex-shrink-0" /> {customer.phone}
                                    </p>
                                    )}
                                </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 flex flex-col items-center justify-center h-full min-h-[150px]">
                        <Users className="w-12 h-12 text-muted-foreground/20 mb-3" />
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
