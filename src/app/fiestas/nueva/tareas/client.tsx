
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, PlusCircle, Trash2, Loader2, AlertTriangle, ListChecks, Clock, Bell, FolderOpen, Save } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format as formatDateFn, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Tarea } from '@/types/fiesta';
import { getFiestaById, updateTareasFiestaActual, addTareaToFiestaActual, deleteTareaFromFiestaActual } from '@/app/actions/fiesta-actual';
import { getTaskTemplates, saveTaskTemplate, deleteTaskTemplate, type TaskTemplate } from '@/app/actions/task-templates';
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
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';


function TareasEventoContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [newTaskDueTime, setNewTaskDueTime] = useState<string>(''); // HH:mm
  const [newTaskReminder, setNewTaskReminder] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newIsDefaultTask, setNewIsDefaultTask] = useState(false); 

  // Template States
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);


  const loadTareas = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada.");
      setTareas(fiestaData.tareas || []);
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError("No se pudieron cargar las tareas.");
      toast({ title: "Error", description: err.message || "Ocurrió un problema inesperado.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    if (!fiestaId) {
        toast({title: "Error", description: "No se ha especificado un ID de fiesta."});
        router.replace('/eventos');
        return;
    }
    loadTareas();
  }, [fiestaId, loadTareas, router, toast]);

  const handleOpenLoadTemplateModal = async () => {
    setIsLoadingTemplates(true);
    setIsLoadTemplateModalOpen(true);
    try {
        const fetchedTemplates = await getTaskTemplates();
        setTemplates(fetchedTemplates);
    } catch(e) {
        toast({title: "Error", description: "No se pudieron cargar las plantillas", variant: "destructive"});
    } finally {
        setIsLoadingTemplates(false);
    }
  };

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
    const result = await saveTaskTemplate(templateName, tareas);
    if (result.success) {
      toast({title: "Plantilla Guardada"});
      setIsSaveTemplateModalOpen(false);
    } else {
      toast({title: "Error al guardar plantilla", description: result.error, variant: "destructive"});
    }
    setIsSaving(false);
  };

  const handleLoadTemplate = async (template: TaskTemplate) => {
    if (!fiestaId) return;
    const newTasksFromTemplate = template.tasks.map(taskTemplate => ({
      ...taskTemplate,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
      completada: false,
    }));
    const updatedTareas = [...tareas, ...newTasksFromTemplate];
    setTareas(updatedTareas);
    await handleSaveChanges(updatedTareas); // Save immediately
    toast({title: "Plantilla de Tareas Cargada", description: `Se añadieron ${newTasksFromTemplate.length} tareas.`});
    setIsLoadTemplateModalOpen(false);
  };
  
  const handleDeleteTemplate = async (id: string) => {
    setDeletingTemplateId(id);
    const result = await deleteTaskTemplate(id);
    if(result.success) {
      toast({title: "Plantilla eliminada"});
      setTemplates(prev => prev.filter(t => t.id !== id));
    } else {
      toast({title: "Error al eliminar", description: result.error, variant: "destructive"});
    }
    setDeletingTemplateId(null);
  };

  const handleSaveChanges = async (updatedTareas: Tarea[]) => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateTareasFiestaActual(fiestaId, updatedTareas);
      if (result.success && result.updatedData) {
        setTareas(result.updatedData);
      } else {
        throw new Error(result.error || "Error desconocido al guardar las tareas.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
      await loadTareas();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !fiestaId) {
        toast({ title: "Título Requerido", description: "El título de la tarea no puede estar vacío.", variant: "destructive" });
        return;
    }

    const newTaskData: Omit<Tarea, 'id'> = {
      texto: newTaskText.trim(),
      descripcion: newTaskDescription.trim() || undefined,
      completada: false,
      fechaLimite: newTaskDueDate ? newTaskDueDate.toISOString() : undefined,
      horaVencimiento: newTaskDueTime.trim() || undefined,
      recordatorio: newTaskReminder.trim() || undefined,
      asignadaA: newTaskAssignedTo.trim() || undefined,
      esPredeterminada: newIsDefaultTask,
    };
    
    setIsSaving(true);
    
    const result = await addTareaToFiestaActual(fiestaId, newTaskData);

    if (result.success && result.tarea) {
        setTareas(prev => [result.tarea!, ...prev]);
        toast({ title: "Tarea Añadida" });
        
        // Reset form
        setNewTaskText('');
        setNewTaskDescription('');
        setNewTaskDueDate(undefined);
        setNewTaskDueTime('');
        setNewTaskReminder('');
        setNewTaskAssignedTo('');
        setNewIsDefaultTask(false);
    } else {
        toast({ title: "Error", description: result.error, variant: 'destructive' });
    }

    setIsSaving(false);
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const updatedTareas = tareas.map(task =>
      task.id === taskId ? { ...task, completada: !task.completada } : task
    );
    setTareas(updatedTareas);
    await handleSaveChanges(updatedTareas);
  };

  const deleteTask = async (taskId: string) => {
    if (!fiestaId) return;
    const tareaAEliminar = tareas.find(t => t.id === taskId);
    if (!tareaAEliminar) return;

    setIsSaving(true);
    const result = await deleteTareaFromFiestaActual(fiestaId, taskId);
    if (result.success) {
      setTareas(prev => prev.filter(t => t.id !== taskId));
      toast({ title: "Tarea Eliminada", description: `"${tareaAEliminar.texto}" ha sido eliminada.`, variant: "destructive" });
    } else {
       toast({ title: "Error al Eliminar", description: result.error, variant: "destructive" });
    }
    setIsSaving(false);
  };

  const formatDateDisplay = (dateString?: string, timeString?: string): string => {
    if (!dateString) return 'Sin fecha';
    try {
        let datePart = formatDateFn(new Date(dateString), "d MMM yy", { locale: es });
        if (timeString) {
            datePart += ` a las ${timeString}`;
        }
        return datePart;
    } catch (e) {
        return "Fecha inválida";
    }
  };

  const getNextDueTaskInfo = (): string => {
    const now = new Date();
    const upcomingTasks = tareas
      .filter(task => !task.completada && task.fechaLimite)
      .map(task => {
        let dueDateTime = new Date(task.fechaLimite!);
        if (task.horaVencimiento) {
          const [hours, minutes] = task.horaVencimiento.split(':');
          dueDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        } else {
          dueDateTime.setHours(23, 59, 59, 999);
        }
        return { ...task, dueDateTime };
      })
      .filter(task => task.dueDateTime > now)
      .sort((a, b) => a.dueDateTime.getTime() - b.dueDateTime.getTime());

    if (upcomingTasks.length > 0) {
      const nextTask = upcomingTasks[0];
      return `Próxima tarea: "${nextTask.texto.substring(0,25)}..." vence ${formatDistanceToNowStrict(nextTask.dueDateTime, { locale: es, addSuffix: true })}`;
    }
    return "No hay tareas pendientes con fecha límite próxima.";
  };

  const completedCount = tareas.filter(task => task.completada).length;
  const totalCount = tareas.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando tareas...</p></div>;
  if (error) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Dialog open={isLoadTemplateModalOpen} onOpenChange={setIsLoadTemplateModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cargar Tareas desde Plantilla</DialogTitle></DialogHeader>
          {isLoadingTemplates ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin"/></div> :
            templates.length > 0 ? (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {templates.map(t => (
                  <li key={t.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{t.name} ({t.tasks.length} tareas)</span>
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
      <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Guardar Lista Actual como Plantilla</DialogTitle></DialogHeader>
          <div className="py-2 space-y-2"><Label htmlFor="template-name">Nombre de la Plantilla</Label><Input id="template-name" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Ej: Plantilla Boda Completa"/></div>
          <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSaveTemplate} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : "Guardar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Tareas del Evento</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button></Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Nueva Tarea</CardTitle>
          <CardDescription>El sistema creará notificaciones automáticas para tareas con fecha límite próxima.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-text">Título de la Tarea</Label>
              <Input id="task-text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Ej: Confirmar lista de música con DJ" required disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Descripción (Opcional)</Label>
              <Textarea id="task-description" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Detalles adicionales sobre la tarea..." rows={2} disabled={isSaving} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-duedate">Fecha Límite (Opcional)</Label>
                <DatePickerDemo selectedDate={newTaskDueDate} onDateChange={(date) => setNewTaskDueDate(date)} className={isSaving ? "disabled:opacity-70" : ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-duetime">Hora Límite (Opcional)</Label>
                <Input id="task-duetime" type="time" value={newTaskDueTime} onChange={(e) => setNewTaskDueTime(e.target.value)} disabled={isSaving || !newTaskDueDate} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-reminder">Recordatorio (Opcional)</Label>
                <Input id="task-reminder" value={newTaskReminder} onChange={(e) => setNewTaskReminder(e.target.value)} placeholder="Ej: 1 día antes, 2h antes" disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assigned">Asignar a (Opcional)</Label>
                <Input id="task-assigned" value={newTaskAssignedTo} onChange={(e) => setNewTaskAssignedTo(e.target.value)} placeholder="Ej: Juan Pérez, Equipo Decoración" disabled={isSaving} />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<PlusCircle className="w-4 h-4 mr-2" />Añadir Tarea
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Lista de Tareas ({completedCount}/{totalCount} completadas)</CardTitle>
          <Progress value={progressPercentage} className="mt-2 h-3" />
          <CardDescription className="mt-2 text-sm text-muted-foreground">
            {totalCount === 0 ? "Aún no has añadido ninguna tarea." : `${progressPercentage.toFixed(0)}% completado. ${getNextDueTaskInfo()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={handleOpenLoadTemplateModal} variant="secondary"><FolderOpen className="w-4 h-4 mr-2"/>Cargar Tareas desde Plantilla</Button>
            <Button onClick={handleOpenSaveTemplateModal} variant="secondary"><Save className="w-4 h-4 mr-2"/>Guardar Lista como Plantilla</Button>
            <Link href="/settings/task-templates" passHref>
              <Button variant="outline">Gestionar Plantillas</Button>
            </Link>
          </div>
          {tareas.length > 0 ? (
            <ScrollArea className="h-[400px] pr-3">
              <ul className="space-y-3">
                {tareas.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox id={`task-${task.id}`} checked={task.completada} onCheckedChange={() => toggleTaskCompletion(task.id)} className="mt-1 flex-shrink-0" aria-label={`Marcar tarea ${task.texto}`} disabled={isSaving} />
                    <div className="flex-grow">
                      <Label htmlFor={`task-${task.id}`} className={`font-medium cursor-pointer ${task.completada ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.texto}</Label>
                      {task.descripcion && <p className={`text-xs ${task.completada ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>{task.descripcion}</p>}
                      <div className="text-xs text-muted-foreground space-x-2 mt-1">
                        {(task.fechaLimite || task.horaVencimiento) && (<span className="bg-muted px-1.5 py-0.5 rounded-sm inline-flex items-center gap-1"><Clock className="w-3 h-3"/> {formatDateDisplay(task.fechaLimite, task.horaVencimiento) || 'Sin fecha/hora'}</span>)}
                        {task.asignadaA && (<span className="bg-muted px-1.5 py-0.5 rounded-sm">Para: {task.asignadaA}</span>)}
                        {task.recordatorio && (<span className="bg-muted px-1.5 py-0.5 rounded-sm inline-flex items-center gap-1"><Bell className="w-3 h-3"/> {task.recordatorio}</span>)}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8" aria-label={`Eliminar tarea ${task.texto}`} disabled={isSaving}><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. La tarea "{task.texto}" será eliminada permanentemente.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteTask(task.id)} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">Sí, eliminar</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-md"><ListChecks className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">Comienza añadiendo tu primera tarea para el evento.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TareasClientPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <TareasEventoContent />
        </Suspense>
    );
}
