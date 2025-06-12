
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Edit, Filter as FilterIcon, Users, UserCircle, Phone, UserPlus2, CalendarDays, Printer, ListChecks, Building, Users2 as Users2Icon, FileText as FileTextIcon } from 'lucide-react';
import { getProspects } from '@/app/actions/prospects';
import type { Prospecto, ProspectSalesFunnelStage } from '@/types/prospect';
import { ALL_PROSPECT_STAGES } from '@/types/prospect';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const getStageBadgeVariant = (stage?: ProspectSalesFunnelStage): "default" | "secondary" | "destructive" | "outline" => {
  if (!stage) return "secondary";
  switch (stage) {
    case 'Prospecto': return "secondary"; // Anteriormente Lead
    case 'Contacto Iniciado': return "outline";
    case 'Contactado': return "default"; // Anteriormente Contactado y Calificando
    case 'Reunión Programada': return "default";
    case 'Presupuesto Presentado': return "default";
    // 'En Negociación' fue eliminada
    // 'Contratado' y 'No Contratado' no se muestran en el embudo activo, pero se definen por si acaso
    case 'Contratado': return "secondary"; 
    case 'No Contratado': return "destructive";
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
      const data = await getProspects(); // Esto ya filtra 'Contratado' y 'No Contratado'
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

  // Actualizar las etapas activas del embudo
  const activeFunnelStages: ProspectSalesFunnelStage[] = ALL_PROSPECT_STAGES.filter(
    s => s !== 'Contratado' && s !== 'No Contratado'
  ) as ProspectSalesFunnelStage[];


  const prospectsByStage = useMemo(() => {
    const grouped = new Map<ProspectSalesFunnelStage, Prospecto[]>();
    activeFunnelStages.forEach(stage => grouped.set(stage, []));

    prospects.forEach(prospect => {
      const stageGroup = grouped.get(prospect.salesFunnelStage);
      if (stageGroup) {
        stageGroup.push(prospect);
      }
    });
    grouped.forEach((stageProspectsArray) => {
        stageProspectsArray.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    return grouped;
  }, [prospects, activeFunnelStages]);

  const handlePrint = () => {
    window.print();
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
            <FilterIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
            Embudo de Ventas (Prospectos)
            </h1>
        </div>
        <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline">
                <Printer className="w-4 h-4 mr-2" /> Imprimir Lista
            </Button>
            <Link href="/prospects/new" passHref>
            <Button>
                <UserPlus2 className="w-5 h-5 mr-2" />
                Agregar Prospecto
            </Button>
            </Link>
        </div>
      </div>
      <p className="text-muted-foreground print:hidden">
        Visualiza y gestiona tus prospectos a través de las diferentes etapas del proceso de ventas.
      </p>
      
      <ScrollArea className="flex-grow whitespace-nowrap rounded-md border bg-muted/20 print:border-none print:bg-transparent print:overflow-visible">
        <div className="flex gap-4 p-4 h-full min-h-[600px] print:flex-col print:gap-6 print:p-0">
          {activeFunnelStages.map(stage => {
            const stageProspects = prospectsByStage.get(stage) || [];
            const stageColorVariant = getStageBadgeVariant(stage);
            
            let borderColorClass = 'border-gray-300 dark:border-gray-700';
            if (stageColorVariant === 'default') borderColorClass = 'border-primary';
            else if (stageColorVariant === 'secondary') borderColorClass = 'border-gray-400 dark:border-gray-600';
            else if (stageColorVariant === 'destructive') borderColorClass = 'border-destructive';
            else if (stageColorVariant === 'outline') borderColorClass = 'border-blue-500';

            return (
              <Card key={stage} className={`w-72 sm:w-80 md:w-[350px] flex-shrink-0 flex flex-col h-full shadow-lg border-t-4 ${borderColorClass} print:w-full print:shadow-none print:border-t-2 print:mb-4 print:break-inside-avoid-page`}>
                <CardHeader className="pb-3 sticky top-0 bg-card/95 backdrop-blur-sm z-10 border-b print:static print:bg-transparent print:border-b-2 print:pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-lg" style={{ color: `hsl(var(--${stageColorVariant === 'default' ? 'primary' : stageColorVariant}))` }}>
                      {stage}
                    </CardTitle>
                    <Badge variant={stageColorVariant} className="text-sm px-2.5 py-1">{stageProspects.length}</Badge>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-grow print:overflow-visible">
                  <CardContent className="pt-3 pb-4 px-3 space-y-3 print:p-0 print:space-y-2">
                    {stageProspects.length > 0 ? (
                      stageProspects.map(prospect => (
                        <Card key={prospect.id} className="shadow-sm hover:shadow-lg transition-shadow bg-background/70 backdrop-blur-sm print:shadow-none print:border print:rounded-md print:mb-2 print:break-inside-avoid">
                          <CardContent className="p-3 print:p-2">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                   <UserCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 print:hidden" />
                                   <h4 className="font-semibold text-sm text-foreground truncate" title={prospect.companyName || prospect.name}>
                                    {prospect.companyName || prospect.name}
                                  </h4>
                                </div>
                                <p className="text-xs text-muted-foreground print:text-[10px]">Act: {formatDate(prospect.updatedAt)}</p>
                              </div>
                              <Link href={`/prospects/${prospect.id}/edit`} passHref className="print:hidden">
                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-primary" title="Editar Prospecto">
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed space-y-0.5 print:mt-1 print:pt-1">
                                {prospect.phone && (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 print:text-[10px]" title={prospect.phone}>
                                  <Phone className="w-3 h-3 flex-shrink-0 print:hidden" /> {prospect.phone}
                                </p>
                                )}
                                {prospect.tipoFiesta && (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 print:text-[10px]" title={prospect.tipoFiesta}>
                                  <ListChecks className="w-3 h-3 flex-shrink-0 print:hidden" /> {prospect.tipoFiesta}
                                </p>
                                )}
                                {prospect.salonDeseado && (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 print:text-[10px]" title={prospect.salonDeseado}>
                                  <Building className="w-3 h-3 flex-shrink-0 print:hidden" /> {prospect.salonDeseado}
                                </p>
                                )}
                                {prospect.cantidadInvitados !== undefined && (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 print:text-[10px]" title={`Invitados: ${prospect.cantidadInvitados}`}>
                                  <Users2Icon className="w-3 h-3 flex-shrink-0 print:hidden" /> {prospect.cantidadInvitados} inv.
                                </p>
                                )}
                                {stage === 'Reunión Programada' && prospect.nextMeetingDate && (
                                  <p className="text-xs text-primary font-medium flex items-center gap-1 print:text-[10px]" title={`Reunión: ${formatDate(prospect.nextMeetingDate)}`}>
                                    <CalendarDays className="w-3 h-3 flex-shrink-0 print:hidden" /> Reunión: {formatDate(prospect.nextMeetingDate)}
                                  </p>
                                )}
                                {stage === 'Presupuesto Presentado' && prospect.estimatedValue && (
                                   <p className="text-xs text-green-600 font-medium flex items-center gap-1 print:text-[10px]" title={`Presupuesto: ${prospect.estimatedValue.toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}`}>
                                     <FileTextIcon className="w-3 h-3 flex-shrink-0 print:hidden" /> Presup.: {prospect.estimatedValue.toLocaleString('es-AR', {style: 'currency', currency: 'ARS'})}
                                   </p>
                                )}
                            </div>
                            {prospect.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate print:text-[10px] print:whitespace-normal" title={prospect.notes}>Notas: {prospect.notes}</p>}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 flex flex-col items-center justify-center h-full min-h-[150px] print:hidden">
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
        <ScrollBar orientation="horizontal" className="print:hidden"/>
      </ScrollArea>
    </div>
  );
}
