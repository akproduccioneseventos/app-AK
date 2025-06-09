
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Plus, Trash2, Loader2, AlertTriangle, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format as formatDateFn } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Tarea } from '@/types/fiesta';
import { getFiestaActual, updateTareasFiestaActual } from '@/app/actions/fiesta-actual';
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

export default function TareasEventoPage() {
  const { toast } = useToast();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');

  const loadTareas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setTareas(fiestaData.tareas || []); // Initialize with empty array if undefined
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
        setTareas(result.updatedData); // Update local state with data from server
        // toast({ title: "Tareas Actualizadas", description: "Los cambios en las tareas han sido guardados." });
      } else {
        throw new Error(result.error || "Error desconocido al guardar las tareas.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
      // Potentially revert local state or reload if save fails critically
      await loadTareas(); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) {
        toast({ title: "Descripción Requerida", description: "La descripción de la tarea no puede estar vacía.", variant: "destructive" });
        return;
    }
    const newTask: Tarea = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      texto: newTaskText.trim(),
      completada: false,
      fechaLimite: newTaskDueDate ? newTaskDueDate.toISOString() : undefined,
      asignadaA: newTaskAssignedTo.trim() || undefined,
    };
    const updatedTareas = [newTask, ...tareas];
    setTareas(updatedTareas); // Optimistic update
    await handleSaveChanges(updatedTareas);
    
    setNewTaskText('');
    setNewTaskDueDate(undefined);
    setNewTaskAssignedTo('');
    toast({ title: "Tarea Añadida", description: `"${newTask.texto}" ha sido añadida.` });
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const updatedTareas = tareas.map(task =>
      task.id === taskId ? { ...task, completada: !task.completada } : task
    );
    setTareas(updatedTareas); // Optimistic update
    await handleSaveChanges(updatedTareas);
  };

  const deleteTask = async (taskId: string) => {
    const tareaAEliminar = tareas.find(t => t.id === taskId);
    const updatedTareas = tareas.filter(task => task.id !== taskId);
    setTareas(updatedTareas); // Optimistic update
    await handleSaveChanges(updatedTareas);
    if (tareaAEliminar) {
        toast({ title: "Tarea Eliminada", description: `"${tareaAEliminar.texto}" ha sido eliminada.`, variant: "destructive" });
    }
  };

  const formatDateDisplay = (dateString?: string): string => {
    if (!dateString) return '';
    try {
        return formatDateFn(new Date(dateString), "d MMM yy", { locale: es });
    } catch (e) {
        return "Fecha inválida";
    }
  };

  const completedCount = tareas.filter(task => task.completada).length;
  const totalCount = tareas.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-3 text-lg">Cargando tareas...</p>
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="py-10 text-center text-red-600">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
        <p className="font-semibold">Error al cargar tareas</p>
        <p className="text-sm">{error}</p>
         <Button onClick={loadTareas} className="mt-4">Intentar de Nuevo</Button>
      </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <ListChecks className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Gestión de Tareas del Evento
            </h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Nueva Tarea</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-text">Descripción de la Tarea</Label>
              <Input
                id="task-text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Ej: Confirmar lista de música con DJ"
                required
                disabled={isSaving}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-duedate">Fecha Límite (Opcional)</Label>
                <DatePickerDemo
                  selectedDate={newTaskDueDate}
                  onDateChange={(date) => setNewTaskDueDate(date)}
                  className={isSaving ? "disabled:opacity-70" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assigned">Asignar a (Opcional)</Label>
                <Input
                  id="task-assigned"
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  disabled={isSaving}
                />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Plus className="w-4 h-4 mr-2" />
              Añadir Tarea
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Lista de Tareas ({completedCount}/{totalCount} completadas)</CardTitle>
          <Progress value={progressPercentage} className="mt-2 h-3" />
          <CardDescription className="mt-2 text-sm text-muted-foreground">
            {totalCount === 0 
              ? "Aún no has añadido ninguna tarea." 
              : `${progressPercentage.toFixed(0)}% completado.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tareas.length > 0 ? (
            <ScrollArea className="h-[400px] pr-3">
              <ul className="space-y-3">
                {tareas.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completada}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                      className="mt-1 flex-shrink-0"
                      aria-label={`Marcar tarea ${task.texto} como ${task.completada ? 'pendiente' : 'completada'}`}
                      disabled={isSaving}
                    />
                    <div className="flex-grow">
                      <Label
                        htmlFor={`task-${task.id}`}
                        className={`font-medium cursor-pointer ${
                          task.completada ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {task.texto}
                      </Label>
                      {(task.fechaLimite || task.asignadaA) && (
                        <div className="text-xs text-muted-foreground space-x-2 mt-0.5">
                          {task.fechaLimite && (
                            <span className="bg-muted px-1.5 py-0.5 rounded-sm">
                              Vence: {formatDateDisplay(task.fechaLimite)}
                            </span>
                          )}
                          {task.asignadaA && (
                            <span className="bg-muted px-1.5 py-0.5 rounded-sm">
                              Para: {task.asignadaA}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8"
                                aria-label={`Eliminar tarea ${task.texto}`}
                                disabled={isSaving}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. La tarea "{task.texto}" será eliminada permanentemente.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTask(task.id)} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
                                Sí, eliminar
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-md">
                <ListChecks className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Comienza añadiendo tu primera tarea para el evento.</p>
            </div>
          )}
        </CardContent>
        {tareas.length > 0 && (
             <CardFooter className="text-sm text-muted-foreground border-t pt-4">
                Organiza tus pendientes y asegúrate de que nada se te escape.
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

