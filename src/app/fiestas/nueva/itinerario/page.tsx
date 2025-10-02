'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, AlertTriangle, Clock, GripVertical, Utensils, GlassWater, Music, CakeSlice, Camera, Diamond, PartyPopper, Save, FolderOpen, RotateCcw, Printer, Share2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ProgramaEventoItem, ItineraryTemplate as TaskTemplate } from '@/types/fiesta';
import { getFiestaActual, updateProgramaFiestaActual } from '@/app/actions/fiesta-actual';
import { getItineraryTemplates, saveItineraryTemplate, deleteItineraryTemplate } from '@/app/actions/itinerary-templates';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { defaultPrograma } from '@/lib/fiesta-defaults';

const iconMap: Record<string, React.ElementType> = {
  Utensils, GlassWater, Music, CakeSlice, Camera, Diamond, PartyPopper, Clock,
};

const ALL_ICONS = [
  { value: 'Clock', label: 'Reloj' },
  { value: 'Utensils', label: 'Cena' },
  { value: 'GlassWater', label: 'Bebidas' },
  { value: 'Music', label: 'Música/Baile' },
  { value: 'CakeSlice', label: 'Torta' },
  { value: 'Camera', label: 'Fotos' },
  { value: 'Diamond', label: 'Ceremonia' },
  { value: 'PartyPopper', label: 'Fiesta' },
];

function SortableItem({ item, onEdit, onDelete }: { item: ProgramaEventoItem, onEdit: (item: ProgramaEventoItem) => void, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = item.icono && iconMap[item.icono] ? iconMap[item.icono] : Clock;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm">
      <div {...listeners} {...attributes} className="cursor-grab p-1 text-muted-foreground"><GripVertical className="w-5 h-5" /></div>
      <div className="p-2 bg-primary/10 rounded-md"><Icon className="w-5 h-5 text-primary" /></div>
      <div className="flex-grow">
        <p className="font-semibold">{item.hora} - {item.titulo}</p>
        <p className="text-sm text-muted-foreground">{item.descripcion}</p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

export default function ItinerarioEventoPage() {
  const { toast } = useToast();
  const [programa, setPrograma] = useState<ProgramaEventoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ProgramaEventoItem> | null>(null);

  // Template States
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setPrograma(fiestaData.programa || []);
    } catch (err: any) {
      setError("No se pudo cargar el cronograma.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleOpenLoadTemplateModal = async () => {
    setIsLoadingTemplates(true);
    setIsLoadTemplateModalOpen(true);
    try {
        const fetchedTemplates = await getItineraryTemplates();
        setTemplates(fetchedTemplates);
    } catch(e) {
        toast({title: "Error", description: "No se pudieron cargar las plantillas", variant: "destructive"});
    } finally {
        setIsLoadingTemplates(false);
    }
  }

  const handleOpenSaveTemplateModal = () => {
    setTemplateName(''); // Reset name
    setIsSaveTemplateModalOpen(true);
  };
  
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({title: "Nombre requerido", variant: "destructive"});
      return;
    }
    setIsSaving(true);
    const result = await saveItineraryTemplate(templateName, programa);
    if (result.success) {
      toast({title: "Plantilla Guardada"});
      setIsSaveTemplateModalOpen(false);
    } else {
      toast({title: "Error al guardar plantilla", description: result.error, variant: "destructive"});
    }
    setIsSaving(false);
  };

  const handleLoadTemplate = (template: TaskTemplate) => {
    setPrograma(template.items.map(item => ({...item, id: `prog_${Date.now()}_${Math.random()}`})));
    toast({title: "Plantilla cargada", description: `Se cargó el cronograma "${template.name}".`});
    setIsLoadTemplateModalOpen(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    setDeletingTemplateId(id);
    const result = await deleteItineraryTemplate(id);
    if(result.success) {
      toast({title: "Plantilla eliminada"});
      setTemplates(prev => prev.filter(t => t.id !== id));
    } else {
      toast({title: "Error al eliminar", description: result.error, variant: "destructive"});
    }
    setDeletingTemplateId(null);
  };

  const openModal = (item?: ProgramaEventoItem) => {
    setCurrentItem(item || { hora: '20:00', titulo: '', descripcion: '', icono: 'Clock' });
    setIsEditModalOpen(true);
  };

  const handleSaveItem = (e: FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.titulo) return;

    const newItem: ProgramaEventoItem = {
      id: currentItem.id || `prog_${Date.now()}`,
      ...currentItem,
    } as ProgramaEventoItem;

    let updatedPrograma;
    if (currentItem.id) {
      updatedPrograma = programa.map(p => p.id === newItem.id ? newItem : p);
    } else {
      updatedPrograma = [...programa, newItem].sort((a,b) => a.hora.localeCompare(b.hora));
    }
    setPrograma(updatedPrograma);
    setIsEditModalOpen(false);
    setCurrentItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setPrograma(prev => prev.filter(p => p.id !== id));
  };
  
  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (over && active.id !== over.id) {
      setPrograma((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSaveItinerario = async () => {
    setIsSaving(true);
    try {
      const result = await updateProgramaFiestaActual(programa);
      if (result.success) {
        toast({ title: "Cronograma Guardado", description: "El cronograma del evento ha sido actualizado." });
        if (result.updatedData) setPrograma(result.updatedData);
      } else {
        throw new Error(result.error || "Error desconocido al guardar.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleRestoreDefault = () => {
    setPrograma([...defaultPrograma.map(p => ({...p, id: `prog_${Date.now()}_${Math.random().toString(36).substring(2,9)}`}))]);
    toast({description: "El cronograma por defecto ha sido cargado."});
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /> <p className="ml-2">Cargando cronograma...</p></div>;
  if (error) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Añadir'} Momento</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label htmlFor="item-hora">Hora*</Label><Input id="item-hora" type="time" value={currentItem?.hora || ''} onChange={(e) => setCurrentItem(p => p ? {...p, hora: e.target.value} : null)} required /></div>
              <div className="space-y-1"><Label htmlFor="item-icono">Icono</Label>
                <Select value={currentItem?.icono || 'Clock'} onValueChange={(val) => setCurrentItem(p => p ? {...p, icono: val} : null)}>
                  <SelectTrigger id="item-icono"><SelectValue/></SelectTrigger>
                  <SelectContent>{ALL_ICONS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label htmlFor="item-titulo">Título*</Label><Input id="item-titulo" value={currentItem?.titulo || ''} onChange={(e) => setCurrentItem(p => p ? {...p, titulo: e.target.value} : null)} required /></div>
            <div className="space-y-1"><Label htmlFor="item-desc">Descripción (Opcional)</Label><Textarea id="item-desc" value={currentItem?.descripcion || ''} onChange={(e) => setCurrentItem(p => p ? {...p, descripcion: e.target.value} : null)} rows={3} /></div>
            <DialogFooter className="pt-3">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Guardar Cronograma como Plantilla</DialogTitle></DialogHeader>
          <div className="py-2 space-y-2"><Label htmlFor="template-name">Nombre de la Plantilla</Label><Input id="template-name" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Ej: Cronograma Boda Clásica"/></div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSaveTemplate} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : "Guardar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isLoadTemplateModalOpen} onOpenChange={setIsLoadTemplateModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cargar Cronograma desde Plantilla</DialogTitle></DialogHeader>
          {isLoadingTemplates ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin"/></div> :
            templates.length > 0 ? (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {templates.map(t => (
                  <li key={t.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{t.name} ({t.items.length} momentos)</span>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleLoadTemplate(t)}>Cargar</Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDeleteTemplate(t.id)} disabled={deletingTemplateId===t.id}>{deletingTemplateId===t.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}</Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="p-4 text-center text-muted-foreground">No hay plantillas guardadas.</p>}
          <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Cronograma de la Fiesta</h1>
        </div>
        <div className="flex gap-2">
            <Link href="/fiestas/nueva/itinerario/pdf" passHref>
              <Button variant="secondary" size="sm"><Eye className="w-4 h-4 mr-2"/>Vista Previa / PDF</Button>
            </Link>
            <Link href="/fiestas/nueva" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cronograma del Evento</CardTitle>
          <CardDescription>Organiza cada momento de la fiesta. Arrastra y suelta para reordenar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openModal()}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Momento</Button>
            <Button onClick={handleOpenLoadTemplateModal} variant="secondary"><FolderOpen className="w-4 h-4 mr-2"/>Cargar Plantilla</Button>
            <Button onClick={handleOpenSaveTemplateModal} variant="secondary"><Save className="w-4 h-4 mr-2"/>Guardar como Plantilla</Button>
            <Button onClick={handleRestoreDefault} variant="outline"><RotateCcw className="w-4 h-4 mr-2"/>Restaurar por Defecto</Button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={programa.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {programa.map(item => (
                  <SortableItem key={item.id} item={item} onEdit={openModal} onDelete={handleDeleteItem} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
           {programa.length === 0 && <p className="text-center text-muted-foreground p-6">Aún no has añadido ningún momento al cronograma.</p>}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={handleSaveItinerario} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
            Guardar Cronograma
          </Button>
        </CardFooter>
      </Card>

      <style jsx global>{`
        @media print {
          body { font-size: 10pt; }
          .print-hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
