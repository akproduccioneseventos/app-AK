
'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: Date;
  assignedTo?: string;
}

export default function TareasEventoPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Reservar salón de fiestas', completed: true, dueDate: new Date(2024, 4, 10), assignedTo: 'Ana' },
    { id: '2', text: 'Enviar invitaciones', completed: false, dueDate: new Date(2024, 4, 20) },
    { id: '3', text: 'Contratar catering', completed: false, assignedTo: 'Carlos' },
  ]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      dueDate: newTaskDueDate,
      assignedTo: newTaskAssignedTo.trim() || undefined,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setNewTaskText('');
    setNewTaskDueDate(undefined);
    setNewTaskAssignedTo('');
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const formatDate = (date: Date | undefined): string => {
    return date ? format(date, "d MMM yyyy", { locale: es }) : 'Sin fecha';
  };

  const pendingTasks = tasks.filter(task => !task.completed).length;
  const completedTasks = tasks.filter(task => task.completed).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Tareas del Evento
        </h1>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline">
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
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-duedate">Fecha Límite (Opcional)</Label>
                <DatePickerDemo
                  selectedDate={newTaskDueDate}
                  onDateChange={(date) => setNewTaskDueDate(date)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assigned">Asignar a (Opcional)</Label>
                <Input
                  id="task-assigned"
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Tarea
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Lista de Tareas</CardTitle>
          <CardDescription>
            {tasks.length === 0 
              ? "Aún no has añadido ninguna tarea." 
              : `Tienes ${pendingTasks} tarea(s) pendiente(s) y ${completedTasks} completada(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <ScrollArea className="h-[300px] pr-3">
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                      className="mt-1 flex-shrink-0"
                      aria-label={`Marcar tarea ${task.text} como ${task.completed ? 'pendiente' : 'completada'}`}
                    />
                    <div className="flex-grow">
                      <Label
                        htmlFor={`task-${task.id}`}
                        className={`font-medium cursor-pointer ${
                          task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {task.text}
                      </Label>
                      <div className="text-xs text-muted-foreground space-x-2 mt-0.5">
                        {task.dueDate && (
                          <span>
                            Vence: {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.assignedTo && (
                          <span>
                            Asignado a: {task.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      aria-label={`Eliminar tarea ${task.text}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Comienza añadiendo tu primera tarea para el evento.</p>
            </div>
          )}
        </CardContent>
        {tasks.length > 0 && (
             <CardFooter className="text-sm text-muted-foreground">
                Total de tareas: {tasks.length}
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

    