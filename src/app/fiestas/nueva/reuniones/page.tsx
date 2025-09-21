
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, PlusCircle, Edit3, Trash2, Loader2, AlertTriangle, MessageSquareText, CalendarIcon, NotebookTextIcon, CalendarPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, Reunion } from '@/types/fiesta';
import { getFiestaActual, addReunionToFiestaActual, updateReunionInFiestaActual, deleteReunionFromFiestaActual } from '@/app/actions/fiesta-actual';
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
import { isToday, isWithinInterval, addDays, startOfDay, endOfDay } from 'date-fns';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no especificada";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

// Función para generar contenido de archivo .ics
const generateICSContent = (reunion: Reunion, fiestaNombre: string): string => {
  if (!reunion.fecha) return '';
  const startDate = new Date(reunion.fecha);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Asumir 1 hora de duración

  const toUTC = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AKProducciones//App//EN',
    'BEGIN:VEVENT',
    `UID:${reunion.id}@akproducciones.app`,
    `DTSTAMP:${toUTC(new Date())}`,
    `DTSTART:${toUTC(startDate)}`,
    `DTEND:${toUTC(endDate)}`,
    `SUMMARY:Reunión: ${reunion.titulo}`,
    `DESCRIPTION:Reunión para el evento "${fiestaNombre}". Notas: ${reunion.notas.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  return icsContent;
};


export default function GestionReunionesPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentReunion, setCurrentReunion] = useState<Reunion | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formFecha, setFormFecha] = useState<Date | undefined>(undefined);
  const [formHora, setFormHora] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingReunionId, setDeletingReunionId] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const loadReuniones = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      setReuniones((fiestaData.reuniones || []).sort((a,b) => new Date(a.fecha || 0).getTime() - new Date(b.fecha || 0).getTime()));
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
  
  useEffect(() => {
    if (formFecha && formHora) {
      const currentDateTime = new Date(formFecha);
      const [hours, minutes] = formHora.split(':').map(Number);
      currentDateTime.setHours(hours, minutes, 0, 0);

      const existingReunion = reuniones.find(r => {
        if (!r.fecha) return false;
        if (currentReunion && r.id === currentReunion.id) return false;
        return new Date(r.fecha).getTime() === currentDateTime.getTime();
      });

      if (existingReunion) {
        setConflictWarning(`Advertencia: Ya existe una reunión ("${existingReunion.titulo}") a esta misma hora.`);
      } else {
        setConflictWarning(null);
      }
    } else {
      setConflictWarning(null);
    }
  }, [formFecha, formHora, reuniones, currentReunion]);


  const openFormModal = (reunion?: Reunion) => {
    if (reunion) {
      setCurrentReunion(reunion);
      setFormTitulo(reunion.titulo);
      setFormFecha(reunion.fecha ? new Date(reunion.fecha) : undefined);
      setFormHora(reunion.fecha ? new Date(reunion.fecha).toTimeString().substring(0,5) : '');
      setFormNotas(reunion.notas);
    } else {
      setCurrentReunion(null);
      setFormTitulo('');
      setFormFecha(undefined);
      setFormHora('');
      setFormNotas('');
    }
    setConflictWarning(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      toast({ title: "Título Requerido", description: "Por favor, ingresa un título para la reunión.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    let finalDate: Date | undefined = undefined;
    if(formFecha) {
        finalDate = new Date(formFecha);
        if(formHora) {
            const [hours, minutes] = formHora.split(':').map(Number);
            finalDate.setHours(hours, minutes, 0, 0);
        }
    }

    try {
      let result;
      if (currentReunion) {
        const updatedReunionData: Reunion = {
          ...currentReunion,
          titulo: formTitulo.trim(),
          fecha: finalDate ? finalDate.toISOString() : undefined,
          notas: formNotas.trim(),
        };
        result = await updateReunionInFiestaActual(updatedReunionData);
      } else {
        const newReunionData: Omit<Reunion, 'id'> = {
          titulo: formTitulo.trim(),
          fecha: finalDate ? finalDate.toISOString() : undefined,
          notas: formNotas.trim(),
        };
        result = await addReunionToFiestaActual(newReunionData);
      }

      if (result.success && result.reunion) {
        toast({ title: `¡Reunión ${currentReunion ? 'Actualizada' : 'Añadida'}!`, description: `La reunión "${result.reunion.titulo}" ha sido guardada.` });
        setIsFormModalOpen(false);
        await loadReuniones();
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
        await loadReuniones();
      } else {
        throw new Error(result.error || "Error desconocido al eliminar la reunión.");
      }
    } catch (err: any) {
      toast({ title: "Error al Eliminar", description: err.message, variant: "destructive" });
    } finally {
      setDeletingReunionId(null);
    }
  };

  const handleAddToCalendar = (reunion: Reunion) => {
    if (!fiesta) return;
    const icsContent = generateICSContent(reunion, fiesta.configuracion.nombreEvento);
    if (icsContent) {
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Reunion - ${reunion.titulo}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({title: "Archivo de Calendario Descargado", description: "Abre el archivo para añadirlo a tu calendario."});
    }
  };


  const now = new Date();
  const todayReuniones = reuniones.filter(r => r.fecha && isToday(new Date(r.fecha)));
  const next7DaysReuniones = reuniones.filter(r => r.fecha && isWithinInterval(new Date(r.fecha), { start: endOfDay(now), end: addDays(now, 7) }));
  const futureReuniones = reuniones.filter(r => r.fecha && new Date(r.fecha) > addDays(now, 7));
  const undatedReuniones = reuniones.filter(r => !r.fecha);


  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /> <p className="ml-2">Cargando reuniones...</p></div>;
  if (error) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;

  const renderReunionCard = (reunion: Reunion) => (
    <Card key={reunion.id} className="bg-muted/30">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-primary">{reunion.titulo}</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => openFormModal(reunion)} aria-label="Editar reunión" className="h-8 w-8"><Edit3 className="w-4 h-4" /></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-8 w-8" aria-label="Eliminar reunión" disabled={deletingReunionId === reunion.id}>
                  {deletingReunionId === reunion.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>La reunión "{reunion.titulo}" será eliminada.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteReunion(reunion.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {reunion.fecha && (
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
            <CalendarIcon className="w-4 h-4" /> {formatDate(reunion.fecha)} - {new Date(reunion.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}hs
          </div>
        )}
      </CardHeader>
      <CardContent>
        {reunion.notas && reunion.notas.trim() !== "" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none bg-background p-3 rounded-md border text-sm whitespace-pre-wrap">{reunion.notas}</div>
        ) : (
          <p className="text-sm text-muted-foreground italic p-3 bg-background rounded-md border">No hay notas.</p>
        )}
      </CardContent>
       {reunion.fecha && (
        <CardFooter>
          <Button variant="outline" size="sm" onClick={() => handleAddToCalendar(reunion)}>
            <CalendarPlus className="w-4 h-4 mr-2" />
            Añadir a Calendario
          </Button>
        </CardFooter>
      )}
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><MessageSquareText className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Reuniones</h1></div>
        <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button></Link>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogTrigger asChild><Button onClick={() => openFormModal()}><PlusCircle className="w-5 h-5 mr-2" />Añadir Nueva Reunión</Button></DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-headline text-xl">{currentReunion ? 'Editar' : 'Añadir'} Reunión</DialogTitle></DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="reunion-titulo">Título</Label><Input id="reunion-titulo" value={formTitulo} onChange={(e) => setFormTitulo(e.target.value)} placeholder="Ej: 1ra Reunión - Definición de Alcance" required/></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="reunion-fecha">Fecha</Label><DatePickerDemo selectedDate={formFecha} onDateChange={setFormFecha} /></div>
                <div className="space-y-2"><Label htmlFor="reunion-hora">Hora</Label><Input id="reunion-hora" type="time" value={formHora} onChange={(e) => setFormHora(e.target.value)} /></div>
            </div>
            {conflictWarning && <p className="text-sm text-yellow-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>{conflictWarning}</p>}
            <div className="space-y-2"><Label htmlFor="reunion-notas">Notas / Acuerdos</Label><Textarea id="reunion-notas" value={formNotas} onChange={(e) => setFormNotas(e.target.value)} placeholder="Detalles, decisiones, próximos pasos..." rows={5}/></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose><Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {todayReuniones.length > 0 && <div><h2 className="text-xl font-semibold font-headline mb-3 text-primary">Hoy</h2><div className="space-y-3">{todayReuniones.map(renderReunionCard)}</div></div>}
        {next7DaysReuniones.length > 0 && <div><h2 className="text-xl font-semibold font-headline mb-3 text-primary">Próximos 7 Días</h2><div className="space-y-3">{next7DaysReuniones.map(renderReunionCard)}</div></div>}
        {futureReuniones.length > 0 && <div><h2 className="text-xl font-semibold font-headline mb-3 text-primary">Futuras</h2><div className="space-y-3">{futureReuniones.map(renderReunionCard)}</div></div>}
        {undatedReuniones.length > 0 && <div><h2 className="text-xl font-semibold font-headline mb-3 text-muted-foreground">Sin Fecha</h2><div className="space-y-3">{undatedReuniones.map(renderReunionCard)}</div></div>}
        {reuniones.length === 0 && <div className="py-10 text-center"><NotebookTextIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground text-lg">No hay reuniones registradas.</p></div>}
      </div>
    </div>
  );
}
