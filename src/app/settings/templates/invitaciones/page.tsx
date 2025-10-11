
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
        <Link href="/settings/templates" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Plantillas</Button>
        </Link>
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
              templates.map(template => (
                <div key={template.id} className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
                  <div className="flex items-center gap-4">
                     <div className="w-20 h-14 bg-white border rounded-sm relative overflow-hidden">
                        {template.cabecera?.videoFondoUrl && <NextImage src={template.cabecera.videoFondoUrl} alt={`Preview de ${template.name}`} layout="fill" objectFit="contain" />}
                     </div>
                     <div>
                        <p className="font-semibold">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.category} - Estilo: {template.plantilla}</p>
                     </div>
                  </div>
                   <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicateTemplate(template.id, template.name)} disabled={!!processingId} title="Duplicar">
                            {processingId === template.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Link href={`/fiestas/nueva/pagina-web?templateId=${template.id}`} passHref>
                            <Button variant="outline" size="icon" className="h-8 w-8"><Edit className="w-4 h-4"/></Button>
                        </Link>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8" disabled={!!processingId}>
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
              ))
            ) : <p className="text-center text-muted-foreground p-4">No hay plantillas de invitación guardadas.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
