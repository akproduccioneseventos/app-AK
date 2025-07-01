
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Plus, Trash2, Loader2, AlertTriangle, ClipboardCheck, User, UserCog } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { ClientTarea, TareaAsignadaA } from '@/types/fiesta';
import { getFiestaActual, updateClientChecklist } from '@/app/actions/fiesta-actual';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function ChecklistClientePage() {
  const { toast } = useToast();
  const [tareas, setTareas] = useState<ClientTarea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<TareaAsignadaA>('Cliente');

  const loadTareas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setTareas(fiestaData.clientChecklist || []);
    } catch (err: any) {
      console.error("Error loading client checklist:", err);
      setError("No se pudo cargar el checklist.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTareas();
  }, [loadTareas]);

  const handleSaveChanges = async (updatedTareas: ClientTarea[]) => {
    setIsSaving(true);
    try {
      const result = await updateClientChecklist(updatedTareas);
      if (result.success && result.updatedData) {
        setTareas(result.updatedData);
      } else {
        throw new Error(result.error || "Error al guardar el checklist.");
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
      toast({ title: "Título Requerido", variant: "destructive" });
      return;
    }
    const newTask: ClientTarea = {
      id: `task_client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      texto: newTaskText.trim(),
      completada: false,
      asignadaA: newTaskAssignedTo,
    };
    const updatedTareas = [newTask, ...tareas];
    setTareas(updatedTareas);
    await handleSaveChanges(updatedTareas);
    setNewTaskText('');
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const updatedTareas = tareas.map(task =>
      task.id === taskId ? { ...task, completada: !task.completada } : task
    );
    setTareas(updatedTareas);
    await handleSaveChanges(updatedTareas);
  };

  const deleteTask = async (taskId: string) => {
    const updatedTareas = tareas.filter(task => task.id !== taskId);
    setTareas(updatedTareas);
    await handleSaveChanges(updatedTareas);
  };

  const completedCount = tareas.filter(task => task.completada).length;
  const totalCount = tareas.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Checklist del Cliente</h1>
        </div>
        <Link href="/fiestas/nueva" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Nueva Tarea</CardTitle>
          <CardDescription>Añade tareas para que el cliente las vea y complete en su portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-text">Título de la Tarea</Label>
              <Input id="task-text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Ej: Enviar lista de invitados, elegir canción principal..." required />
            </div>
            <div className="space-y-2">
              <Label>Asignar a:</Label>
              <RadioGroup value={newTaskAssignedTo} onValueChange={(val) => setNewTaskAssignedTo(val as TareaAsignadaA)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="Cliente" id="assign-cliente" /><Label htmlFor="assign-cliente">Cliente</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="Organizador" id="assign-organizador" /><Label htmlFor="assign-organizador">Organizador</Label></div>
              </RadioGroup>
            </div>
            <Button type="submit" disabled={isSaving}><Plus className="w-4 h-4 mr-2" />Añadir Tarea</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Lista de Tareas Compartida ({completedCount}/{totalCount})</CardTitle>
          <Progress value={progressPercentage} className="mt-2 h-2" />
          <CardDescription className="mt-2 text-sm text-muted-foreground">{progressPercentage.toFixed(0)}% completado</CardDescription>
        </CardHeader>
        <CardContent>
          {tareas.length > 0 ? (
            <ScrollArea className="h-[400px] pr-3">
              <ul className="space-y-3">
                {tareas.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox id={`task-${task.id}`} checked={task.completada} onCheckedChange={() => toggleTaskCompletion(task.id)} className="mt-1 flex-shrink-0" disabled={isSaving} />
                    <div className="flex-grow">
                      <Label htmlFor={`task-${task.id}`} className={`font-medium cursor-pointer ${task.completada ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.texto}</Label>
                      <div className={`text-xs mt-1 flex items-center gap-1 ${task.asignadaA === 'Cliente' ? 'text-blue-600' : 'text-purple-600'}`}>
                        {task.asignadaA === 'Cliente' ? <User className="w-3 h-3"/> : <UserCog className="w-3 h-3"/>}
                        Asignado a: {task.asignadaA}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8" disabled={isSaving}><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirmar eliminación</AlertDialogTitle><AlertDialogDescription>La tarea "{task.texto}" será eliminada.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteTask(task.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <div className="text-center py-8"><p className="text-muted-foreground">No hay tareas en el checklist del cliente.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
