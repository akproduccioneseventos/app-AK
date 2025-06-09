
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, PlusCircle, Edit3, Trash2, Loader2, AlertTriangle, MessageSquareText, CalendarIcon, NotebookTextIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, Reunion } from '@/types/fiesta';
import { getFiestaActual, addReunionToFiestaActual, updateReunionInFiestaActual, deleteReunionFromFiestaActual } from '@/app/actions/fiesta-actual';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no especificada";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

export default function GestionReunionesPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentReunion, setCurrentReunion] = useState<Reunion | null>(null); // For editing
  const [formTitulo, setFormTitulo] = useState('');
  const [formFecha, setFormFecha] = useState<Date | undefined>(undefined);
  const [formNotas, setFormNotas] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingReunionId, setDeletingReunionId] = useState<string | null>(null);

  const loadReuniones = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      setReuniones(fiestaData.reuniones || []);
    } catch (err: any) {
      console.error("Error loading meetings:", err);
      setError("No se pudieron cargar las reuniones.");
      toast({ title: "Error", description: err.message || "Ocurrió un problema inesperado.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadReuniones();
  }, [loadReuniones]);

  const openFormModal = (reunion?: Reunion) => {
    if (reunion) {
      setCurrentReunion(reunion);
      setFormTitulo(reunion.titulo);
      setFormFecha(reunion.fecha ? new Date(reunion.fecha) : undefined);
      setFormNotas(reunion.notas);
    } else {
      setCurrentReunion(null);
      setFormTitulo('');
      setFormFecha(undefined);
      setFormNotas('');
    }
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      toast({ title: "Título Requerido", description: "Por favor, ingresa un título para la reunión.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      let result;
      if (currentReunion) { // Editing existing reunion
        const updatedReunionData: Reunion = {
          ...currentReunion,
          titulo: formTitulo.trim(),
          fecha: formFecha ? formFecha.toISOString() : undefined,
          notas: formNotas.trim(),
        };
        result = await updateReunionInFiestaActual(updatedReunionData);
      } else { // Adding new reunion
        const newReunionData: Omit<Reunion, 'id'> = {
          titulo: formTitulo.trim(),
          fecha: formFecha ? formFecha.toISOString() : undefined,
          notas: formNotas.trim(),
        };
        result = await addReunionToFiestaActual(newReunionData);
      }

      if (result.success && result.reunion) {
        toast({ title: `¡Reunión ${currentReunion ? 'Actualizada' : 'Añadida'}!`, description: `La reunión "${result.reunion.titulo}" ha sido guardada.` });
        setIsFormModalOpen(false);
        await loadReuniones(); // Refresh list
      } else {
        throw new Error(result.error || `Error desconocido al ${currentReunion ? 'actualizar' : 'añadir'} la reunión.`);
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReunion = async (reunionId: string) => {
    setDeletingReunionId(reunionId);
    try {
      const result = await deleteReunionFromFiestaActual(reunionId);
      if (result.success) {
        toast({ title: "Reunión Eliminada", description: "La reunión ha sido eliminada correctamente." });
        await loadReuniones(); // Refresh list
      } else {
        throw new Error(result.error || "Error desconocido al eliminar la reunión.");
      }
    } catch (err: any) {
      toast({ title: "Error al Eliminar", description: err.message, variant: "destructive" });
    } finally {
      setDeletingReunionId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquareText className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestión de Reuniones del Evento
          </h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => openFormModal()}>
            <PlusCircle className="w-5 h-5 mr-2" />
            Añadir Nueva Reunión
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {currentReunion ? 'Editar Reunión' : 'Añadir Nueva Reunión'}
            </DialogTitle>
            <DialogDescription>
              {currentReunion ? 'Modifica los detalles de la reunión.' : 'Completa los detalles para registrar una nueva reunión.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reunion-titulo">Título de la Reunión</Label>
              <Input
                id="reunion-titulo"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Ej: 1ra Reunión - Definición de Alcance"
                disabled={isSaving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reunion-fecha">Fecha de la Reunión (Opcional)</Label>
              <DatePickerDemo selectedDate={formFecha} onDateChange={setFormFecha} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reunion-notas">Notas / Acuerdos</Label>
              <Textarea
                id="reunion-notas"
                value={formNotas}
                onChange={(e) => setFormNotas(e.target.value)}
                placeholder="Detalles importantes, decisiones tomadas, próximos pasos..."
                rows={5}
                disabled={isSaving}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {currentReunion ? 'Guardar Cambios' : 'Guardar Reunión'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Listado de Reuniones</CardTitle>
          <CardDescription>Reuniones registradas para: {fiesta?.configuracion.nombreEvento || "el evento actual"}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando reuniones...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">Error al cargar reuniones</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : reuniones.length > 0 ? (
            <ScrollArea className="h-auto max-h-[600px] pr-3">
              <div className="space-y-4">
                {reuniones.sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime()).map((reunion) => (
                  <Card key={reunion.id} className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-primary">{reunion.titulo}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openFormModal(reunion)} aria-label="Editar reunión">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Eliminar reunión" disabled={deletingReunionId === reunion.id}>
                                {deletingReunionId === reunion.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. La reunión "{reunion.titulo}" será eliminada permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={deletingReunionId === reunion.id}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteReunion(reunion.id)} disabled={deletingReunionId === reunion.id} className="bg-destructive hover:bg-destructive/90">
                                  {deletingReunionId === reunion.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {reunion.fecha && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <CalendarIcon className="w-3 h-3" /> {formatDate(reunion.fecha)}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {reunion.notas && reunion.notas.trim() !== "" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-background p-3 rounded-md border text-sm">
                           <ReactMarkdownWithBreaks text={reunion.notas} />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic p-3 bg-background rounded-md border">No hay notas detalladas para esta reunión.</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-10 text-center">
              <NotebookTextIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No hay reuniones registradas para esta fiesta.</p>
              <Button onClick={() => openFormModal()} className="mt-6">
                <PlusCircle className="w-5 h-5 mr-2" />
                Añadir Primera Reunión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component to render markdown with line breaks preserved
function ReactMarkdownWithBreaks({ text }: { text: string }) {
  // Replace newlines with <br /> for display, then split into paragraphs for safety if needed
  // This is a simplified approach. For full markdown, use a library like react-markdown.
  return (
    <div>
      {text.split('\n').map((paragraph, index, array) => (
        <React.Fragment key={index}>
          {paragraph}
          {index < array.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
}

