
// DEBUG-EMBUDO-V7 - Sales Funnel Page (Enhanced)
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Edit, Filter as FilterIcon, Users, UserCircle, Phone, UserPlus2, CalendarDays, Printer, ListChecks, Building, Users2 as Users2Icon, FileText as FileTextIcon, MoreVertical, Mail, Briefcase, DollarSign, ChevronDown, AlertCircle } from 'lucide-react';
import { getProspects, saveProspect } from '@/app/actions/prospects';
import type { Prospecto, ProspectSalesFunnelStage } from '@/types/prospect';
import { ACTIVE_FUNNEL_STAGES, ALL_PROSPECT_STAGES } from '@/types/prospect';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const formatDate = (dateString?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!dateString) return null;
  const defaultOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', ...options };
  try {
    return new Date(dateString).toLocaleDateString('es-ES', defaultOptions);
  } catch (e) { return "Fecha Inválida"; }
};

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return null;
  return amount.toLocaleString('es-AR', {style: 'currency', currency: 'ARS'});
}

const getColumnStyle = (stage: ProspectSalesFunnelStage): { headerClasses: string; borderTopClass: string; titleColor: string } => {
  switch (stage) {
    case 'Prospecto':
      return { headerClasses: 'bg-slate-50 dark:bg-slate-800/30', borderTopClass: 'border-t-slate-400', titleColor: 'text-slate-600 dark:text-slate-300' };
    case 'Contacto Iniciado':
      return { headerClasses: 'bg-sky-50 dark:bg-sky-900/30', borderTopClass: 'border-t-sky-500', titleColor: 'text-sky-700 dark:text-sky-300' };
    case 'Contactado':
      return { headerClasses: 'bg-blue-50 dark:bg-blue-900/30', borderTopClass: 'border-t-blue-500', titleColor: 'text-blue-700 dark:text-blue-300' };
    case 'Reunión Programada':
      return { headerClasses: 'bg-emerald-50 dark:bg-emerald-900/30', borderTopClass: 'border-t-emerald-500', titleColor: 'text-emerald-700 dark:text-emerald-300' };
    case 'Presupuesto Presentado':
      return { headerClasses: 'bg-purple-50 dark:bg-purple-900/30', borderTopClass: 'border-t-purple-500', titleColor: 'text-purple-700 dark:text-purple-300' };
    default:
      return { headerClasses: 'bg-gray-50 dark:bg-gray-800/30', borderTopClass: 'border-t-gray-400', titleColor: 'text-gray-600 dark:text-gray-300' };
  }
};


export default function SalesFunnelPage() {
  const [prospects, setProspects] = useState<Prospecto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [processingProspectId, setProcessingProspectId] = useState<string | null>(null);


  const loadProspects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProspects(); 
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

  const handleChangeProspectStage = async (prospectId: string, newStage: ProspectSalesFunnelStage) => {
    const prospectToUpdate = prospects.find(p => p.id === prospectId);
    if (!prospectToUpdate) return;
    if (prospectToUpdate.salesFunnelStage === newStage) return; // No change

    setProcessingProspectId(prospectId);

    const updatedProspect: Prospecto = {
      ...prospectToUpdate,
      salesFunnelStage: newStage,
      updatedAt: new Date().toISOString(),
      // Clear nextMeetingDate if stage is no longer 'Reunión Programada'
      nextMeetingDate: newStage === 'Reunión Programada' ? prospectToUpdate.nextMeetingDate : undefined,
    };

    try {
      const result = await saveProspect(updatedProspect);
      if (result.success && result.prospect) {
        toast({ title: "Etapa Actualizada", description: `Prospecto "${result.prospect.name}" movido a "${newStage}".` });
        if (newStage === 'Firmo Contrato' && result.customerId) {
            toast({ title: "¡Convertido a Cliente!", description: `Cliente ID ${result.customerId} creado/actualizado.`});
        } else if (newStage === 'Firmo Contrato' && result.error) {
            toast({ title: "Conversión Parcial", description: `Prospecto marcado como 'Firmo Contrato', pero: ${result.error}`, variant: "destructive", duration: 7000 });
        }
        await loadProspects(); // Refresh the entire list
      } else {
        throw new Error(result.error || "Error desconocido al actualizar la etapa del prospecto.");
      }
    } catch (error: any) {
      toast({ title: "Error al Mover Prospecto", description: error.message, variant: "destructive" });
    } finally {
      setProcessingProspectId(null);
    }
  };

  const prospectsByStage = useMemo(() => {
    const grouped = new Map<ProspectSalesFunnelStage, Prospecto[]>();
    ACTIVE_FUNNEL_STAGES.forEach(stage => grouped.set(stage, []));

    prospects.forEach(prospect => {
      if (ACTIVE_FUNNEL_STAGES.includes(prospect.salesFunnelStage as any)) {
        const stageGroup = grouped.get(prospect.salesFunnelStage);
        stageGroup?.push(prospect);
      }
    });
    
    grouped.forEach((stageProspectsArray) => {
        stageProspectsArray.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    return grouped;
  }, [prospects]);

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
              Embudo de Ventas
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
      <CardDescription className="text-md print:hidden">
        Visualiza y gestiona tus prospectos. Mueve las tarjetas para actualizar su etapa en el proceso de ventas.
      </CardDescription>

      <ScrollArea className="flex-grow whitespace-nowrap rounded-md border bg-muted/20 print:border-none print:bg-transparent print:overflow-visible">
        <div className="flex gap-4 p-4 h-full min-h-[600px] print:flex-col print:gap-6 print:p-0">
          {ACTIVE_FUNNEL_STAGES.map(stage => {
            const stageProspects = prospectsByStage.get(stage) || [];
            const columnStyle = getColumnStyle(stage);

            return (
              <Card key={stage} className={cn(`w-72 sm:w-80 md:w-[360px] lg:w-[380px] flex-shrink-0 flex flex-col h-full shadow-lg border-t-4 print:w-full print:shadow-none print:border-t-2 print:mb-4 print:break-inside-avoid-page`, columnStyle.borderTopClass)}>
                <CardHeader className={cn("pb-3 sticky top-0 bg-card/90 backdrop-blur-sm z-10 border-b print:static print:bg-transparent print:border-b-2 print:pb-2", columnStyle.headerClasses)}>
                  <div className="flex justify-between items-center">
                    <CardTitle className={cn("font-headline text-lg", columnStyle.titleColor)}>
                      {stage}
                    </CardTitle>
                    <Badge variant={stage === 'Prospecto' ? 'secondary' : 'default'} className={cn("text-sm px-2.5 py-1", columnStyle.titleColor, `${columnStyle.headerClasses.replace('bg-', 'border-')}`)} style={{backgroundColor: 'transparent', borderColor: 'currentColor'}}>{stageProspects.length}</Badge>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-grow print:overflow-visible">
                  <CardContent className="pt-3 pb-4 px-3 space-y-3 print:p-0 print:space-y-2">
                    {stageProspects.length > 0 ? (
                      stageProspects.map(prospect => (
                        <Card key={prospect.id} className="shadow-sm hover:shadow-md transition-shadow bg-card dark:bg-background/70 backdrop-blur-sm print:shadow-none print:border print:rounded-md print:mb-2 print:break-inside-avoid">
                          <CardContent className="p-3 print:p-2">
                            <div className="flex justify-between items-start gap-1">
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                   <UserCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 print:hidden" />
                                   <h4 className="font-semibold text-sm text-foreground truncate" title={prospect.name}>
                                    {prospect.name}
                                  </h4>
                                </div>
                                {prospect.companyName && (
                                   <p className="text-xs text-muted-foreground truncate flex items-center gap-1 print:text-[10px]" title={prospect.companyName}>
                                     <Briefcase className="w-3 h-3 flex-shrink-0 print:hidden" /> {prospect.companyName}
                                   </p>
                                )}
                                <p className="text-xs text-muted-foreground/80 print:text-[10px]">Act: {formatDate(prospect.updatedAt, { day: '2-digit', month: '2-digit', year: '2-digit', hour:'2-digit', minute:'2-digit' })}</p>
                              </div>
                              <div className="flex-shrink-0 flex items-center print:hidden">
                                <Link href={`/prospects/${prospect.id}/edit`} passHref>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Editar Prospecto">
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                </Link>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Cambiar Etapa" disabled={processingProspectId === prospect.id}>
                                      {processingProspectId === prospect.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Mover a Etapa:</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {ALL_PROSPECT_STAGES.map(targetStage => (
                                      <DropdownMenuItem 
                                        key={targetStage} 
                                        onClick={() => handleChangeProspectStage(prospect.id, targetStage)}
                                        disabled={prospect.salesFunnelStage === targetStage || processingProspectId === prospect.id}
                                      >
                                        {targetStage}
                                        {prospect.salesFunnelStage === targetStage && <span className="ml-auto text-xs text-muted-foreground">(Actual)</span>}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            {(prospect.phone || prospect.email) && (
                            <div className="mt-2 pt-2 border-t border-dashed space-y-1 print:mt-1 print:pt-1">
                                {prospect.phone && (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 print:text-[10px]" title={prospect.phone}>
                                  <Phone className="w-3 h-3 flex-shrink-0 print:hidden" /> {prospect.phone}
                                </p>
                                )}
                                {prospect.email && (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 print:text-[10px]" title={prospect.email}>
                                  <Mail className="w-3 h-3 flex-shrink-0 print:hidden" /> {prospect.email}
                                </p>
                                )}
                            </div>
                            )}

                            {(prospect.tipoFiesta || prospect.salonDeseado || prospect.cantidadInvitados !== undefined) && (
                                <div className="mt-2 pt-2 border-t border-dashed space-y-1 print:mt-1 print:pt-1">
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
                                </div>
                            )}

                            {prospect.salesFunnelStage === 'Reunión Programada' && prospect.nextMeetingDate && (
                              <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 print:text-[10px]" title={`Reunión: ${formatDate(prospect.nextMeetingDate)}`}>
                                <CalendarDays className="w-3 h-3 flex-shrink-0 print:hidden" /> {formatDate(prospect.nextMeetingDate)}
                              </p>
                            )}
                            {prospect.salesFunnelStage === 'Presupuesto Presentado' && prospect.estimatedValue && (
                               <p className="mt-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 print:text-[10px]" title={`Presupuesto: ${formatCurrency(prospect.estimatedValue)}`}>
                                 <DollarSign className="w-3 h-3 flex-shrink-0 print:hidden" /> {formatCurrency(prospect.estimatedValue)}
                               </p>
                            )}
                            {prospect.notes && <p className="text-xs text-muted-foreground mt-1.5 italic truncate print:text-[10px] print:whitespace-normal" title={prospect.notes}>Notas: {prospect.notes}</p>}
                            
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

