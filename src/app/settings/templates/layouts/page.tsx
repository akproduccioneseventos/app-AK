
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, Trash2, Loader2, LayoutDashboard } from 'lucide-react';
import { getSalonLayoutTemplates, deleteSalonLayoutTemplate, type SalonLayoutTemplate } from '@/app/actions/salon-layout-templates';
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

export default function LayoutTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<SalonLayoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSalonLayoutTemplates();
      setTemplates(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las plantillas de diseño.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeleteTemplate = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      const result = await deleteSalonLayoutTemplate(id);
      if (result.success) {
        toast({ title: "Plantilla Eliminada", description: `Se eliminó "${name}".` });
        await fetchTemplates();
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive"});
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Plantillas de Diseño de Salón
          </h1>
        </div>
        <div className="flex gap-2">
            <Link href="/fiestas/nueva/invitados/layout">
                <Button variant="default"><PlusCircle className="w-4 h-4 mr-2"/>Crear/Editar en el Diseñador</Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Configuración</Button>
            </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Plantillas de Diseño</CardTitle>
          <CardDescription>Visualiza y elimina las distribuciones de salón que has guardado. Para crear o modificar, ve al Diseñador de Salón en el planificador de un evento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
            templates.length > 0 ? (
              templates.map(template => (
                <div key={template.id} className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
                  <div className="flex items-center gap-4">
                     <div className="w-20 h-14 bg-white border rounded-sm relative overflow-hidden">
                        {template.layoutData.salonPlanBackgroundImageUrl && <NextImage src={template.layoutData.salonPlanBackgroundImageUrl} alt={`Plano de ${template.name}`} layout="fill" objectFit="contain" />}
                     </div>
                     <div>
                        <p className="font-semibold">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.layoutData.salonElements?.length || 0} elementos</p>
                     </div>
                  </div>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8" disabled={deletingId === template.id}>
                            {deletingId === template.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>La plantilla "{template.name}" será eliminada permanentemente.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTemplate(template.id, template.name)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                   </AlertDialog>
                </div>
              ))
            ) : <p className="text-center text-muted-foreground p-4">No hay plantillas guardadas.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
