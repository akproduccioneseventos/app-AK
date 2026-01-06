
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, PlusCircle, Edit3, Trash2, Loader2, AlertTriangle, MessageSquareText, CalendarIcon, CalendarPlus, NotebookTextIcon, Printer, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, Reunion } from '@/types/fiesta';
import { getFiestaById, addReunionToFiestaActual, updateReunionInFiestaActual, deleteReunionFromFiestaActual } from '@/app/actions/fiesta-actual';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { useSearchParams, useRouter } from 'next/navigation';

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

const generateICSContent = (reunion: Reunion, fiestaNombre: string): string => {
  if (!reunion.fecha) return '';
  const startDate = new Date(reunion.fecha);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Asumir 1 hora de duración

  const toUTC = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
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
};

function GestionReunionesContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

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

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError("No se ha especificado un evento. Serás redirigido.");
      setTimeout(() => router.push('/eventos'), 2000);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("No se encontró el evento.");
      setFiesta(fiestaData);
      setReuniones((fiestaData.reuniones || []).sort((a,b) => new Date(a.fecha || 0).getTime() - new Date(b.fecha || 0).getTime()));
    } catch (err: any) {
      console.error("Error loading meetings:", err);
      setError("No se pudieron cargar las reuniones.");
      toast({ title: "Error", description: err.message || "Ocurrió un problema inesperado.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
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
      if (!fiestaId) throw new Error("ID de fiesta no encontrado.");
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
          fiestaId: fiestaId,
          titulo: formTitulo.trim(),
          fecha: finalDate ? finalDate.toISOString() : undefined,
          notas: formNotas.trim(),
        };
        result = await addReunionToFiestaActual(newReunionData);
      }

      if (result.success) {
        toast({ title: `¡Reunión ${currentReunion ? 'Actualizada' : 'Añadida'}!`});
        setIsFormModalOpen(false);
        await loadData();
      } else {
        throw new Error(result.error || `Error al ${currentReunion ? 'actualizar' : 'añadir'} la reunión.`);
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

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
  
  const handleDeleteReunion = async (reunionId: string) => {
    if (!fiestaId) return;
    setDeletingReunionId(reunionId);
    try {
      const result = await deleteReunionFromFiestaActual(fiestaId, reunionId);
      if (result.success) {
        toast({ title: "Reunión Eliminada", variant: "destructive" });
        await loadData();
      } else {
        throw new Error(result.error || "No se pudo eliminar la reunión.");
      }
    } catch (err: any) {
      toast({ title: "Error al Eliminar", description: err.message, variant: "destructive" });
    } finally {
      setDeletingReunionId(null);
    }
  };
  
  const handleShareWhatsApp = (reunion: Reunion) => {
    if (!fiesta) return;
    const message = `*Recordatorio de Reunión*\n\n*Evento:* ${fiesta.configuracion.nombreEvento}\n*Reunión:* ${reunion.titulo}\n*Fecha:* ${formatDate(reunion.fecha)}\n*Hora:* ${new Date(reunion.fecha!).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})} hs.\n\n*Notas:*\n${reunion.notas}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const downloadICS = (reunion: Reunion, fiestaNombre: string) => {
    const icsContent = generateICSContent(reunion, fiestaNombre);
    if (icsContent) {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${reunion.titulo}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  if (isLoading || !fiestaId) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (error || !fiesta) {
    return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;
  }

  const proximasReuniones = reuniones.filter(r => r.fecha && new Date(r.fecha) >= new Date());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">{currentReunion ? 'Editar Reunión' : 'Agendar Nueva Reunión'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            <div className="space-y-1"><Label htmlFor="reunion-titulo">Título *</Label><Input id="reunion-titulo" value={formTitulo} onChange={e => setFormTitulo(e.target.value)} placeholder="Ej: Definir decoración, Degustación menú" required /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label htmlFor="reunion-fecha">Fecha</Label><DatePickerDemo selectedDate={formFecha} onDateChange={setFormFecha} /></div>
              <div className="space-y-1"><Label htmlFor="reunion-hora">Hora</Label><Input id="reunion-hora" type="time" value={formHora} onChange={(e) => setFormHora(e.target.value)} disabled={!formFecha}/></div>
            </div>
            {conflictWarning && <p className="text-xs text-amber-600">{conflictWarning}</p>}
            <div className="space-y-1"><Label htmlFor="reunion-notas">Notas / Temas a tratar</Label><Textarea id="reunion-notas" value={formNotas} onChange={(e) => setFormNotas(e.target.value)} rows={4} placeholder="Puntos importantes para la reunión..."/></div>
            <DialogFooter className="pt-3">
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{currentReunion ? 'Guardar Cambios' : 'Agendar Reunión'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquareText className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Reuniones</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Planificador</Button></Link>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Planificación de Reuniones</CardTitle>
          <CardDescription>Agenda y mantén un registro de las reuniones importantes con tu cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => openFormModal()}><CalendarPlus className="w-4 h-4 mr-2"/>Agendar Nueva Reunión</Button>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Historial de Reuniones</CardTitle>
          <CardDescription>
            {proximasReuniones.length > 0 ? `Tienes ${proximasReuniones.length} reunión(es) próxima(s).` : "No hay reuniones futuras agendadas."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> : 
           reuniones.length > 0 ? (
            reuniones.map(reunion => (
              <Card key={reunion.id} className="p-3 bg-muted/40">
                 <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="flex-grow">
                      <p className="font-semibold">{reunion.titulo}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <CalendarIcon className="w-4 h-4" /> 
                        {formatDate(reunion.fecha)} 
                        {reunion.fecha && <span className="font-medium">{new Date(reunion.fecha).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})} hs.</span>}
                      </p>
                      {reunion.notas && <p className="text-xs text-muted-foreground mt-2 border-l-2 pl-2 whitespace-pre-wrap">{reunion.notas}</p>}
                    </div>
                    <div className="flex gap-1 self-start sm:self-center flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleShareWhatsApp(reunion)}><Share2 className="w-4 h-4 text-green-600"/></Button>
                      <Link href={`/fiestas/nueva/reuniones/imprimir?fiestaId=${fiestaId}&reunionId=${reunion.id}`} passHref>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Printer className="w-4 h-4"/></Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openFormModal(reunion)}><Edit3 className="w-4 h-4"/></Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={deletingReunionId === reunion.id}>
                                  {deletingReunionId === reunion.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>¿Eliminar esta reunión?</AlertDialogTitle><AlertDialogDescription>"{reunion.titulo}" será eliminada.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteReunion(reunion.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                      {reunion.fecha && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => downloadICS(reunion, fiesta.configuracion.nombreEvento)}><CalendarIcon className="w-4 h-4"/></Button>}
                    </div>
                 </div>
              </Card>
            ))
           ) : <p className="text-center text-muted-foreground p-4">No hay reuniones agendadas.</p>
          }
        </CardContent>
      </Card>
    </div>
  );
}

export default function GestionReunionesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
        <GestionReunionesContent />
    </Suspense>
  )
}
