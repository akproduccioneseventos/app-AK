
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Edit, Filter as FilterIcon, Users } from 'lucide-react';
import { getCustomers } from '@/app/actions/customers';
import type { Customer, SalesFunnelStage } from '@/types/customer';
import { ALL_SALES_FUNNEL_STAGES } from '@/types/customer';
import { Badge } from '@/components/ui/badge';

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

export default function SalesFunnelPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err: any) {
        console.error("Error loading customers for sales funnel:", err);
        setError("No se pudieron cargar los clientes.");
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const customersByStage = useMemo(() => {
    const grouped = new Map<SalesFunnelStage, Customer[]>();
    ALL_SALES_FUNNEL_STAGES.forEach(stage => grouped.set(stage, []));

    customers.forEach(customer => {
      const stage = customer.salesFunnelStage || 'Lead'; // Default to Lead if undefined
      if (grouped.has(stage)) {
        grouped.get(stage)!.push(customer);
      } else {
        // This case should ideally not happen if ALL_SALES_FUNNEL_STAGES is comprehensive
        // and customers always have a stage or default to 'Lead'.
        // For safety, we could add to a generic 'Uncategorized' or log an error.
        // For now, we assume it will always be one of the defined stages.
         if (!grouped.has('Lead')) grouped.set('Lead', []); // Ensure Lead exists
         grouped.get('Lead')!.push(customer); // Put into Lead if stage is unknown
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
        <Button onClick={() => window.location.reload()}>Intentar de Nuevo</Button>
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
        Para cambiar la etapa de un cliente, edítalo desde su tarjeta.
      </p>
      
      <ScrollArea className="flex-grow whitespace-nowrap pb-4">
        <div className="flex gap-4 h-full pb-2">
          {ALL_SALES_FUNNEL_STAGES.map(stage => {
            const stageCustomers = customersByStage.get(stage) || [];
            return (
              <Card key={stage} className="w-72 sm:w-80 md:w-96 flex-shrink-0 flex flex-col h-full border-t-4" style={{ borderTopColor: `hsl(var(--${getStageBadgeVariant(stage) === 'default' ? 'primary' : getStageBadgeVariant(stage)}))` }}>
                <CardHeader className="pb-3 sticky top-0 bg-card z-10">
                  <CardTitle className="font-headline text-lg flex items-center justify-between">
                    {stage}
                    <Badge variant={getStageBadgeVariant(stage)} className="text-sm">{stageCustomers.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-grow">
                  <CardContent className="pt-0 pb-3 space-y-3">
                    {stageCustomers.length > 0 ? (
                      stageCustomers.map(customer => (
                        <Card key={customer.id} className="shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-sm text-foreground truncate pr-2" title={customer.companyName || customer.name}>
                                {customer.companyName || customer.name}
                              </h4>
                               <Link href={`/customers/${customer.id}/edit`} passHref>
                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                                  <Edit className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                </Button>
                              </Link>
                            </div>
                            {customer.email && (
                              <p className="text-xs text-muted-foreground truncate" title={customer.email}>{customer.email}</p>
                            )}
                            {customer.phone && (
                               <p className="text-xs text-muted-foreground truncate" title={customer.phone}>{customer.phone}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
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
