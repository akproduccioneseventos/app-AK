
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, Trash2, Loader2, Image as ImageIcon, Edit, Copy } from 'lucide-react';
import { getInvitationTemplates, deleteInvitationTemplate, saveInvitationTemplate, duplicateInvitationTemplate, type InvitacionDigitalTemplate } from '@/app/actions/invitacion-digital-templates';
import { useToast } from '@/hooks/use-toast';
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
import NextImage from 'next/image';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';


export default function InvitationTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<InvitacionDigitalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getInvitationTemplates();
      setTemplates(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las plantillas de invitaciones.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  
  const handleCreateNewTemplate = async () => {
    setIsProcessing(true);
    try {
      const newTemplateData: Omit<InvitacionDigitalTemplate, 'id'> = {
        ...defaultInvitacionDigitalData,
        name: `Nueva Plantilla ${templates.length + 1}`,
        category: 'General',
        plantilla: 'Grazia' // Default to Grazia for new templates
      };
      const result = await saveInvitationTemplate(newTemplateData);
      if (result.success) {
        toast({ title: 'Plantilla Creada', description: 'Ahora puedes personalizarla en el planificador y guardarla como una nueva versión.'});
        await fetchTemplates();
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: `No se pudo crear la plantilla: ${e.message}`, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }

  const handleDeleteTemplate = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      const result = await deleteInvitationTemplate(id);
      if (result.success) {
        toast({ title: "Plantilla Eliminada", description: `Se eliminó "${name}".` });
        await fetchTemplates();
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive"});
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleDuplicateTemplate = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      const result = await duplicateInvitationTemplate(id);
      if (result.success) {
        toast({ title: "Plantilla Duplicada", description: `Se creó una copia de "${name}".` });
        await fetchTemplates();
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Plantillas de Invitación Digital
          </h1>
        </div>
        <Button asChild variant="outline"><Link href="/settings/templates"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Plantillas</Link></Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Plantillas de Invitación</CardTitle>
          <CardDescription>Crea y edita tus diseños base. Estos diseños se podrán cargar en cualquier evento para personalizarlos para ese cliente.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleCreateNewTemplate} disabled={isProcessing}>
                {isProcessing && !processingId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                Crear Nueva Plantilla
            </Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader><CardTitle>Plantillas Guardadas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
            templates.length > 0 ? (
              templates.map(template => {
                const palette = template.cabecera?.paletaColores;
                return (
                  <div key={template.id} className="p-4 border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                       <div className="w-16 h-12 bg-slate-100 border rounded-lg relative overflow-hidden shrink-0 flex items-center justify-center">
                          {template.cabecera?.videoFondoUrl ? (
                            <NextImage src={template.cabecera.videoFondoUrl} alt={`Preview de ${template.name}`} layout="fill" objectFit="cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.category} • Estilo: {template.plantilla}</p>
                          {palette && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] text-muted-foreground font-medium">Paleta:</span>
                              <div className="w-3.5 h-3.5 rounded-full border shadow-xs" style={{ backgroundColor: palette.primary }} title={`Principal: ${palette.primary}`} />
                              <div className="w-3.5 h-3.5 rounded-full border shadow-xs" style={{ backgroundColor: palette.secondary }} title={`Secundario: ${palette.secondary}`} />
                              <div className="w-3.5 h-3.5 rounded-full border shadow-xs" style={{ backgroundColor: palette.accent }} title={`Acento: ${palette.accent}`} />
                            </div>
                          )}
                       </div>
                    </div>
                     <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicateTemplate(template.id, template.name)} disabled={!!processingId} title="Duplicar">
                              {processingId === template.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <Button asChild variant="outline" size="icon" className="h-8 w-8" title="Editar"><Link href={`/fiestas/nueva/pagina-web?templateId=${template.id}`}><Edit className="w-4 h-4"/></Link></Button>
                          <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="h-8 w-8" disabled={!!processingId} title="Eliminar">
                                  {processingId === template.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>La plantilla "{template.name}" será eliminada permanentemente.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTemplate(template.id, template.name)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                         </AlertDialog>
                     </div>
                  </div>
                );
              })
            ) : <p className="text-center text-muted-foreground p-4">No hay plantillas de invitación guardadas.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
