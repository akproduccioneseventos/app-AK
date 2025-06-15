
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Plus, Trash2, Loader2, AlertTriangle, ListChecks, Clock, Bell, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format as formatDateFn, differenceInCalendarDays, differenceInHours, differenceInMinutes, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Tarea } from '@/types/fiesta';
import { getFiestaActual, updateTareasFiestaActual } from '@/app/actions/fiesta-actual';
import { tareasPredeterminadasEjemplo } from '@/lib/fiesta-defaults';
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
import { Separator } from '@/components/ui/separator';


export default function TareasEventoPage() {
  const { toast } = useToast();
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
  const [newIsDefaultTask, setNewIsDefaultTask] = useState(false); // UI only

  const loadTareas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setTareas(fiestaData.tareas || []);
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError("No se pudieron cargar las tareas.");
      toast({ title: "Error", description: err.message || "Ocurrió un problema inesperado.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTareas();
  }, [loadTareas]);

  const handleSaveChanges = async (updatedTareas: Tarea[]) => {
    setIsSaving(true);
    try {
      const result = await updateTareasFiestaActual(updatedTareas);
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
    if (!newTaskText.trim()) {
        toast({ title: "Título Requerido", description: "El título de la tarea no puede estar vacío.", variant: "destructive" });
        return;
    }
    const newTask: Tarea = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      texto: newTaskText.trim(),
      descripcion: newTaskDescription.trim() || undefined,
      completada: false,
      fechaLimite: newTaskDueDate ? newTaskDueDate.toISOString() : undefined,
      horaVencimiento: newTaskDueTime.trim() || undefined,
      recordatorio: newTaskReminder.trim() || undefined,
      asignadaA: newTaskAssignedTo.trim() || undefined,
      esPredeterminada: newIsDefaultTask, // UI state, no backend logic yet
    };
    const updatedTareas = [newTask, ...tareas];
    setTareas(updatedTareas);
    await handleSaveChanges(updatedTareas);

    setNewTaskText('');
    setNewTaskDescription('');
    setNewTaskDueDate(undefined);
    setNewTaskDueTime('');
    setNewTaskReminder('');
    setNewTaskAssignedTo('');
    setNewIsDefaultTask(false);
    toast({ title: "Tarea Añadida", description: `"${newTask.texto}" ha sido añadida.` });
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const updatedTareas = tareas.map(task =>
      task.id === taskId ? { ...task, completada: !task.completada } : task
    );
    setTareas(updatedTareas);
    await handleSaveChanges(updatedTareas);
  };

  const deleteTask = async (taskId: string) => {
    const tareaAEliminar = tareas.find(t => t.id === taskId);
    const updatedTareas = tareas.filter(task => task.id !== taskId);
    setTareas(updatedTareas);
    await handleSaveChanges(updatedTareas);
    if (tareaAEliminar) {
        toast({ title: "Tarea Eliminada", description: `"${tareaAEliminar.texto}" ha sido eliminada.`, variant: "destructive" });
    }
  };
  
  const handleUsePredeterminadaTask = (taskTemplate: Pick<Tarea, 'texto' | 'descripcion'>) => {
    setNewTaskText(taskTemplate.texto);
    setNewTaskDescription(taskTemplate.descripcion || '');
    setNewIsDefaultTask(false); // It's being used, not saved as new default from here
    toast({ description: `Datos de "${taskTemplate.texto}" cargados en el formulario.`});
    // Scroll to form or focus first field could be a UX improvement here.
    document.getElementById('task-text')?.focus();
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
          dueDateTime.setHours(23, 59, 59, 999); // End of day if no time specified
        }
        return { ...task, dueDateTime };
      })
      .filter(task => task.dueDateTime > now)
      .sort((a, b) => a.dueDateTime.getTime() - b.dueDateTime.getTime());

    if (upcomingTasks.length > 0) {
      const nextTask = upcomingTasks[0];
      return `Próxima tarea: "${nextTask.texto.substring(0,25)}..." vence en ${formatDistanceToNowStrict(nextTask.dueDateTime, { locale: es, addSuffix: true })}`;
    }
    return "No hay tareas pendientes con fecha límite próxima.";
  };

  const completedCount = tareas.filter(task => task.completada).length;
  const totalCount = tareas.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando tareas...</p></div>;
  if (error) return <div className="py-10 text-center text-red-600"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">Error al cargar tareas</p><p className="text-sm">{error}</p><Button onClick={loadTareas} className="mt-4">Reintentar</Button></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Tareas del Evento</h1>
        </div>
        <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Nueva Tarea</CardTitle>
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
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="task-isdefault" checked={newIsDefaultTask} onCheckedChange={(checked) => setNewIsDefaultTask(Boolean(checked))} disabled={isSaving} />
              <Label htmlFor="task-isdefault" className="text-sm font-normal">Guardar como tarea predeterminada para futuras fiestas (UI only)</Label>
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Plus className="w-4 h-4 mr-2" />Añadir Tarea
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><FolderOpen className="w-5 h-5 text-primary/80"/>Plantillas de Tareas Comunes</CardTitle>
          <CardDescription>Selecciona una tarea predefinida para cargarla rápidamente en el formulario de arriba.</CardDescription>
        </CardHeader>
        <CardContent>
          {tareasPredeterminadasEjemplo.length > 0 ? (
            <ScrollArea className="h-[200px] pr-2">
              <div className="space-y-2">
                {tareasPredeterminadasEjemplo.map((task, index) => (
                  <Card key={`predet-${index}`} className="p-2 bg-muted/50 hover:bg-muted/70">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{task.texto}</p>
                        {task.descripcion && <p className="text-xs text-muted-foreground">{task.descripcion.substring(0,60)}...</p>}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleUsePredeterminadaTask(task)} disabled={isSaving} className="text-xs">
                        Usar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">No hay tareas predeterminadas disponibles.</p>
          )}
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
        {tareas.length > 0 && (<CardFooter className="text-sm text-muted-foreground border-t pt-4">Organiza tus pendientes y asegúrate de que nada se te escape.</CardFooter>)}
      </Card>
    </div>
  );
}

