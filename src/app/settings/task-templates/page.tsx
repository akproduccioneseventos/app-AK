
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, Trash2, Loader2, ListChecks } from 'lucide-react';
import { getTaskTemplates, deleteTaskTemplate } from '@/app/actions/task-templates';
import type { TaskTemplate } from '@/app/actions/task-templates';
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

export default function TaskTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTaskTemplates();
      setTemplates(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las plantillas de tareas.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeleteTemplate = async (id: string) => {
    setIsProcessing(true);
    const result = await deleteTaskTemplate(id);
    if (result.success) {
      toast({ title: "Plantilla Eliminada", variant: "destructive" });
      await fetchTemplates();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Plantillas de Tareas
          </h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Configuración</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Plantillas de Tareas</CardTitle>
          <CardDescription>Crea y elimina listas de tareas predefinidas para no empezar de cero en cada evento. Para crear o modificar una plantilla, ve al módulo de tareas de cualquier evento, arma la lista como desees y usa la opción "Guardar como Plantilla".</CardDescription>
        </CardHeader>
      </Card>

       <Card>
        <CardHeader><CardTitle>Plantillas Guardadas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
            templates.length > 0 ? (
              templates.map(template => (
                <div key={template.id} className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
                  <p className="font-semibold">{template.name} ({template.tasks.length} tareas)</p>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                            <AlertDialogDescription>La plantilla "{template.name}" será eliminada permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                   </AlertDialog>
                </div>
              ))
            ) : <p className="text-center text-muted-foreground p-4">No hay plantillas de tareas guardadas.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

    