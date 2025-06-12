
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // CardDescription removido
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Edit, Filter as FilterIcon, Users, UserCircle, Mail, Phone, UserPlus2, CalendarDays } from 'lucide-react';
import { getProspects } from '@/app/actions/prospects';
import type { Prospecto, ProspectSalesFunnelStage } from '@/types/prospect';
import { ALL_PROSPECT_STAGES } from '@/types/prospect';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const getStageBadgeVariant = (stage?: ProspectSalesFunnelStage): "default" | "secondary" | "destructive" | "outline" => {
  if (!stage) return "secondary";
  switch (stage) {
    case 'Lead': return "secondary";
    case 'Contacto Iniciado': return "outline";
    case 'Contactado y Calificando': return "default";
    case 'Reunión Programada': return "default";
    case 'Presupuesto Presentado': return "default";
    case 'En Negociación': return "default";
    // 'Contrato Firmado' y 'Descartado' no se mostrarán en el embudo principal activo
    default: return "secondary";
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) { return "Fecha Inválida"; }
};

export default function SalesFunnelPage() {
  const [prospects, setProspects] = useState<Prospecto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadProspects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProspects(); // getProspects ya filtra los convertidos/descartados
      setProspects(data);
    } catch (err: any) {
      console.error("Error loading prospects for sales funnel:", err);
      setError("No se pudieron cargar los prospectos.");
      toast({ title: "Error de Carga", description: "No se pudo obtener la información de los prospectos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const activeFunnelStages = ALL_PROSPECT_STAGES.filter(s => s !== 'Contrato Firmado' && s !== 'Descartado');

  const prospectsByStage = useMemo(() => {
    const grouped = new Map<ProspectSalesFunnelStage, Prospecto[]>();
    activeFunnelStages.forEach(stage => grouped.set(stage, []));

    prospects.forEach(prospect => {
      const stageGroup = grouped.get(prospect.salesFunnelStage);
      if (stageGroup) {
        stageGroup.push(prospect);
      }
    });
    return grouped;
  }, [prospects, activeFunnelStages]);

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
        <Button onClick={loadProspects}>Intentar de Nuevo</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <FilterIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
            Embudo de Ventas (Prospectos)
            </h1>
        </div>
        <Link href="/prospects/new" passHref>
          <Button>
            <UserPlus2 className="w-5 h-5 mr-2" />
            Agregar Prospecto
          </Button>
        </Link>
      </div>
      <p className="text-muted-foreground">
        Visualiza y gestiona tus prospectos a través de las diferentes etapas del proceso de ventas.
      </p>
      
      <ScrollArea className="flex-grow whitespace-nowrap rounded-md border bg-muted/20">
        <div className="flex gap-4 p-4 h-full min-h-[600px]">
          {activeFunnelStages.map(stage => {
            const stageProspects = prospectsByStage.get(stage) || [];
            const stageColorVariant = getStageBadgeVariant(stage);
            
            let borderColorClass = 'border-gray-300 dark:border-gray-700';
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
                    <Badge variant={stageColorVariant} className="text-sm px-2.5 py-1">{stageProspects.length}</Badge>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-grow">
                  <CardContent className="pt-3 pb-4 px-3 space-y-3">
                    {stageProspects.length > 0 ? (
                      stageProspects.map(prospect => (
                        <Card key={prospect.id} className="shadow-sm hover:shadow-lg transition-shadow bg-background/70 backdrop-blur-sm">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                   <UserCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                   <h4 className="font-semibold text-sm text-foreground truncate" title={prospect.companyName || prospect.name}>
                                    {prospect.companyName || prospect.name}
                                  </h4>
                                </div>
                                {prospect.source && <Badge variant="outline" className="text-xs py-0.5 px-1.5 mb-1">Origen: {prospect.source}</Badge>}
                              </div>
                              <Link href={`/prospects/${prospect.id}/edit`} passHref>
                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-primary" title="Editar Prospecto">
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            </div>
                            {(prospect.email || prospect.phone || (stage === 'Reunión Programada' && prospect.nextMeetingDate)) && (
                                <div className="mt-2 pt-2 border-t border-dashed space-y-0.5">
                                    {prospect.email && (
                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1" title={prospect.email}>
                                      <Mail className="w-3 h-3 flex-shrink-0" /> {prospect.email}
                                    </p>
                                    )}
                                    {prospect.phone && (
                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1" title={prospect.phone}>
                                      <Phone className="w-3 h-3 flex-shrink-0" /> {prospect.phone}
                                    </p>
                                    )}
                                    {stage === 'Reunión Programada' && prospect.nextMeetingDate && (
                                      <p className="text-xs text-primary font-medium flex items-center gap-1" title={`Reunión: ${formatDate(prospect.nextMeetingDate)}`}>
                                        <CalendarDays className="w-3 h-3 flex-shrink-0" /> Reunión: {formatDate(prospect.nextMeetingDate)}
                                      </p>
                                    )}
                                </div>
                            )}
                            {prospect.estimatedValue && <p className="text-xs text-muted-foreground mt-1">Valor Est.: {prospect.estimatedValue.toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}</p> }
                            {prospect.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate" title={prospect.notes}>Notas: {prospect.notes}</p>}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 flex flex-col items-center justify-center h-full min-h-[150px]">
                        <Users className="w-12 h-12 text-muted-foreground/20 mb-3" />
                        <p className="text-xs text-muted-foreground">No hay prospectos en esta etapa.</p>
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
