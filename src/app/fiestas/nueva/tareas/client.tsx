
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
import { ArrowLeft, PlusCircle, Trash2, Loader2, AlertTriangle, ListChecks, Clock, Bell, FolderOpen, Save, RefreshCw, CalendarCheck, Users, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format as formatDateFn, formatDistanceToNowStrict, subDays, startOfWeek, isBefore } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';


function TareasEventoContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');

  const [fiestaEventDate, setFiestaEventDate] = useState<string | undefined>(undefined);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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
      setFiestaEventDate(fiestaData.configuracion.fechaEvento);
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
    setTemplateName(''); 
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
    await handleSaveChanges(updatedTareas);
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

  const handleSyncSystemTasks = async () => {
    if (!fiestaId || !fiestaEventDate) {
        toast({ title: "Sin fecha de evento", description: "Configura primero la fecha del evento para sincronizar tareas.", variant: "destructive" });
        return;
    }

    setIsSyncing(true);
    const eventDate = new Date(fiestaEventDate);
    
    let mondayForCatering = startOfWeek(eventDate, { weekStartsOn: 1 });
    if (eventDate.getDay() === 1 || eventDate.getDay() === 2) {
        mondayForCatering = subDays(mondayForCatering, 7);
    }

    const systemTasks: Omit<Tarea, 'id'>[] = [
        {
            texto: "Comprar insumos de catering y bebidas",
            descripcion: "Ir al mercado/proveedores para comprar todo lo necesario para el menú.",
            completada: false,
            fechaLimite: mondayForCatering.toISOString(),
            asignadaA: 'Organizador',
            esPredeterminada: true
        },
        {
            texto: "Enviar recordatorio y confirmar personal",
            descripcion: "Avisar por WhatsApp a mozos, barmen y auxiliares.",
            completada: false,
            fechaLimite: subDays(eventDate, 3).toISOString(),
            asignadaA: 'Organizador',
            esPredeterminada: true
        },
        {
            texto: "Carga de fotos para Video de Vida",
            descripcion: "Solicitar al cliente que complete la subida de fotos en su portal.",
            completada: false,
            fechaLimite: subDays(eventDate, 15).toISOString(),
            asignadaA: 'Cliente',
            esPredeterminada: true
        },
        {
            texto: "Reunión final de coordinación",
            descripcion: "Repasar itinerario y detalles de último momento con el cliente.",
            completada: false,
            fechaLimite: subDays(eventDate, 7).toISOString(),
            asignadaA: 'Organizador',
            esPredeterminada: true
        },
        {
            texto: "Revisión de lista de carga y camión",
            descripcion: "Controlar que todo el mobiliario y equipos estén listos.",
            completada: false,
            fechaLimite: subDays(eventDate, 1).toISOString(),
            asignadaA: 'Organizador',
            esPredeterminada: true
        },
        {
            texto: "Check-in final del salón y montaje",
            descripcion: "Llegada al salón para supervisar el armado inicial.",
            completada: false,
            fechaLimite: eventDate.toISOString(),
            asignadaA: 'Organizador',
            esPredeterminada: true
        }
    ];

    const currentTasks = [...tareas];
    let addedCount = 0;

    systemTasks.forEach(sysTask => {
        if (!currentTasks.some(t => t.texto === sysTask.texto)) {
            currentTasks.push({
                ...sysTask,
                id: `sys_task_${Date.now()}_${Math.random().toString(36).substring(7)}`
            } as Tarea);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        setTareas(currentTasks);
        await handleSaveChanges(currentTasks);
        toast({ title: "Sincronización Exitosa", description: `Se han añadido ${addedCount} tareas operativas basadas en la fecha del evento.` });
    } else {
        toast({ title: "Al día", description: "Las tareas automáticas ya están en tu lista." });
    }
    
    setIsSyncing(false);
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
      asignadaA: newTaskAssignedTo.trim() as any || undefined,
      esPredeterminada: newIsDefaultTask,
    };
    
    setIsSaving(true);
    const result = await addTareaToFiestaActual(fiestaId, newTaskData);

    if (result.success && result.tarea) {
        setTareas(prev => [result.tarea!, ...prev]);
        toast({ title: "Tarea Añadida" });
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
      return `Próxima: "${nextTask.texto.substring(0,20)}..." vence ${formatDistanceToNowStrict(nextTask.dueDateTime, { locale: es, addSuffix: true })}`;
    }
    return "No hay vencimientos próximos.";
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Tareas del Evento</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSyncSystemTasks} disabled={isSyncing || isSaving} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Sincronizar Tareas del Sistema
            </Button>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Nueva Tarea</CardTitle>
          <CardDescription>Crea tareas personalizadas para este evento específico.</CardDescription>
        </CardHeader>
        <form onSubmit={handleAddTask}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-text">Título de la Tarea</Label>
              <Input id="task-text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Ej: Confirmar DJ" required disabled={isSaving} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-duedate">Fecha Límite</Label>
                <DatePickerDemo selectedDate={newTaskDueDate} onDateChange={(date) => setNewTaskDueDate(date)} className={isSaving ? "disabled:opacity-70" : ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assigned">Asignada A</Label>
                <Select value={newTaskAssignedTo} onValueChange={setNewTaskAssignedTo} disabled={isSaving}>
                    <SelectTrigger id="task-assigned"><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Organizador">Organizador (Yo)</SelectItem>
                        <SelectItem value="Cliente">Cliente (Portal)</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
              Añadir Tarea
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="font-headline text-xl flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary"/> Lista de Tareas ({completedCount}/{totalCount})
            </CardTitle>
            <div className="flex items-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin text-primary"/>}
                <Button variant="ghost" size="sm" onClick={handleOpenLoadTemplateModal} className="h-8"><FolderOpen className="w-4 h-4 mr-1.5"/>Cargar</Button>
                <Button variant="ghost" size="sm" onClick={handleOpenSaveTemplateModal} className="h-8"><Save className="w-4 h-4 mr-1.5"/>Guardar</Button>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">{getNextDueTaskInfo()}</p>
        </CardHeader>
        <CardContent>
          {tareas.length > 0 ? (
            <ScrollArea className="h-auto max-h-[500px] pr-3">
              <ul className="space-y-3">
                {tareas.map((task) => (
                  <li key={task.id} className={cn(
                      "flex items-start gap-3 p-3 border rounded-md transition-all",
                      task.completada ? "bg-muted/30 opacity-70" : "bg-card hover:shadow-sm"
                  )}>
                    <Checkbox id={`task-${task.id}`} checked={task.completada} onCheckedChange={() => toggleTaskCompletion(task.id)} className="mt-1 flex-shrink-0" disabled={isSaving} />
                    <div className="flex-grow min-w-0">
                      <Label htmlFor={`task-${task.id}`} className={cn("font-semibold cursor-pointer block truncate", task.completada && "line-through text-muted-foreground")}>{task.texto}</Label>
                      {task.descripcion && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.descripcion}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(task.fechaLimite || task.horaVencimiento) && (
                            <Badge variant="outline" className={cn("text-[10px] py-0 h-5 font-normal", !task.completada && isBefore(new Date(task.fechaLimite!), new Date()) && "border-destructive text-destructive")}>
                                <Clock className="w-3 h-3 mr-1"/> {formatDateDisplay(task.fechaLimite, task.horaVencimiento)}
                            </Badge>
                        )}
                        {task.asignadaA && (
                            <Badge variant="secondary" className="text-[10px] py-0 h-5 font-normal bg-primary/5 text-primary border-primary/10">
                                {task.asignadaA === 'Cliente' ? <Users className="w-3 h-3 mr-1"/> : <UserCheck className="w-3 h-3 mr-1"/>} {task.asignadaA}
                            </Badge>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" disabled={isSaving}><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle><AlertDialogDescription>"{task.texto}" será borrada permanentemente.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTask(task.id)} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                <ListChecks className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Tu lista está vacía. Usa el botón superior para sincronizar las tareas operativas estándar.</p>
            </div>
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
