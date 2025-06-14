
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, PlusCircle, Loader2, AlertTriangle, KanbanSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead, CrmStage } from '@/types/crm';
import { getCrmLeads, getCrmStages, moveCrmLead, deleteCrmLead, convertToClientAndMoveProspect } from '@/app/actions/crm';
import { CrmStageColumn } from '@/components/crm/CrmStageColumn';
import { AddLeadDialog } from '@/components/crm/AddLeadDialog';
import { ConvertToClientDialog } from '@/components/crm/ConvertToClientDialog';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function CrmPage() {
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  
  const [leadToConvert, setLeadToConvert] = useState<CrmLead | null>(null);
  const [isConvertToClientModalOpen, setIsConvertToClientModalOpen] = useState(false);


  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [stagesData, leadsData] = await Promise.all([
        getCrmStages(),
        getCrmLeads(),
      ]);
      setStages(stagesData);
      setLeads(leadsData);
    } catch (err: any) {
      console.error("Error fetching CRM data:", err);
      setError("No se pudieron cargar los datos del CRM.");
      toast({ title: "Error", description: err.message || "Ocurrió un problema.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMoveLead = async (leadId: string, newStageId: string) => {
    const lead = leads.find(l => l.id === leadId);
    const targetStage = stages.find(s => s.id === newStageId);

    if (targetStage?.isConversionStage && lead) {
      setLeadToConvert(lead);
      setIsConvertToClientModalOpen(true);
      return;
    }
    
    setMovingLeadId(leadId);
    try {
      const result = await moveCrmLead(leadId, newStageId);
      if (result.success) {
        toast({ description: `Prospecto "${result.lead?.name}" movido.` });
        await fetchData(); 
      } else {
        throw new Error(result.error || "No se pudo mover el prospecto.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setMovingLeadId(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    setDeletingLeadId(leadId);
     const leadToDelete = leads.find(l => l.id === leadId);
    try {
      const result = await deleteCrmLead(leadId);
      if (result.success) {
        toast({ description: `Prospecto "${leadToDelete?.name || 'seleccionado'}" eliminado.`, variant: "destructive" });
        await fetchData();
      } else {
        throw new Error(result.error || "No se pudo eliminar el prospecto.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setDeletingLeadId(null);
    }
  };

  const handleConversionSubmit = async (formData: FormData) => {
    if (!leadToConvert) return false;
    formData.append('prospectId', leadToConvert.id);
    formData.append('prospectName', leadToConvert.name);
    // Add other lead fields to formData if needed, e.g., leadToConvert.email

    setIsLoading(true); // Use general loading or a specific one for conversion
    try {
      const result = await convertToClientAndMoveProspect(formData);
      if (result.success) {
        toast({ title: "Conversión Exitosa", description: `Prospecto "${leadToConvert.name}" convertido a cliente y movido.` });
        setIsConvertToClientModalOpen(false);
        setLeadToConvert(null);
        await fetchData();
        return true;
      } else {
        toast({ title: "Error en Conversión", description: result.error || "No se pudo completar la conversión.", variant: "destructive" });
        return false;
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading && !isConvertToClientModalOpen) { // Don't show page loader if modal is open
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando CRM...</p>
      </div>
    );
  }

  if (error && !isConvertToClientModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive font-semibold mb-2">{error}</p>
        <Button onClick={fetchData} variant="outline">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <KanbanSquare className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestión de Prospectos (CRM)
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
           {stages.length > 0 && <AddLeadDialog stages={stages} onLeadAdded={fetchData} defaultStageId={stages[0].id} />}
          <Link href="/empresa/contabilidad" passHref>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Contabilidad
            </Button>
          </Link>
        </div>
      </div>

      {stages.length === 0 ? (
         <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground">No hay etapas definidas en el CRM.</p>
            <p className="text-sm text-muted-foreground">Verifica la configuración en `src/app/actions/crm.ts`.</p>
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex gap-4">
            {stages.map(stage => {
                const leadsInStage = leads.filter(lead => lead.currentStageId === stage.id);
                return (
                <CrmStageColumn
                    key={stage.id}
                    stage={stage}
                    leads={leadsInStage}
                    allStages={stages}
                    onMoveLead={handleMoveLead}
                    onDeleteLead={handleDeleteLead}
                    movingLeadId={movingLeadId}
                    deletingLeadId={deletingLeadId}
                />
                );
            })}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
      {leadToConvert && (
        <ConvertToClientDialog
          isOpen={isConvertToClientModalOpen}
          onOpenChange={setIsConvertToClientModalOpen}
          lead={leadToConvert}
          onSubmit={handleConversionSubmit}
          onClose={() => setLeadToConvert(null)}
        />
      )}
    </div>
  );
}
