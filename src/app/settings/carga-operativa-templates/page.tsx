
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Trash2, Loader2, ListChecks, PackageSearch } from 'lucide-react';
import { getCargaOperativaTemplates, saveCargaOperativaTemplate, deleteCargaOperativaTemplate } from '@/app/actions/carga-operativa-templates';
import type { CargaOperativaTemplate } from '@/app/actions/carga-operativa-templates';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export default function CargaOperativaTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<CargaOperativaTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCargaOperativaTemplates();
      setTemplates(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar las plantillas.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSaveTemplate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    // Initially creates an empty template. A more advanced UI would let you add tasks here.
    const result = await saveCargaOperativaTemplate({ name: newTemplateName, categories: [] });
    if (result.success) {
      toast({ title: "Plantilla Creada", description: `La plantilla "${newTemplateName}" está lista.` });
      setIsModalOpen(false);
      setNewTemplateName('');
      await fetchTemplates();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    setIsProcessing(true);
    const result = await deleteCargaOperativaTemplate(id);
    if (result.success) {
      toast({ title: "Plantilla Eliminada", variant: "destructive" });
      await fetchTemplates();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Plantilla de Carga</DialogTitle>
            <DialogDescription>Dale un nombre a tu nueva lista de carga base. Los ítems se gestionan desde el planificador.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTemplate} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="template-name">Nombre de la Plantilla</Label>
              <Input id="template-name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Ej: Carga Estándar Boda" required />
            </div>
            <DialogFooter className="pt-3">
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isProcessing}>{isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Crear Plantilla</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageSearch className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Plantillas de Carga Operativa
          </h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Configuración</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Plantillas</CardTitle>
          <CardDescription>Crea listas de carga base para agilizar la logística de tus eventos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsModalOpen(true)}><PlusCircle className="w-4 h-4 mr-2"/>Crear Nueva Plantilla de Carga</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader><CardTitle>Plantillas Guardadas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
            templates.length > 0 ? (
              templates.map(template => (
                <div key={template.id} className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
                  <p className="font-semibold">{template.name} ({template.categories.reduce((acc, cat) => acc + cat.items.length, 0)} ítems)</p>
                   <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteTemplate(template.id)} disabled={isProcessing}>
                    <Trash2 className="w-4 h-4"/>
                  </Button>
                </div>
              ))
            ) : <p className="text-center text-muted-foreground p-4">No hay plantillas de carga creadas.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
