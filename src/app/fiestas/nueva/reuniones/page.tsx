
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, PlusCircle, Edit3, Trash2, Loader2, AlertTriangle, MessageSquareText, CalendarIcon, CalendarPlus, Printer, ClipboardCheck, ArrowRight, Info, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, Reunion, ReunionChecklistItem } from '@/types/fiesta';
import { getFiestaById, addReunionToFiestaActual, updateReunionInFiestaActual, deleteReunionFromFiestaActual } from '@/app/actions/fiesta-actual';
import { getMeetingMasterTemplate } from '@/app/actions/meeting-checklist';
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

function GestionReunionesContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [masterTemplate, setMasterTemplate] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentReunion, setCurrentReunion] = useState<Reunion | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formFecha, setFormFecha] = useState<Date | undefined>(undefined);
  const [formHora, setFormHora] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const [formAcuerdos, setFormAcuerdos] = useState('');
  const [formChecklist, setFormChecklist] = useState<ReunionChecklistItem[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [deletingReunionId, setDeletingReunionId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError("No se ha especificado un evento. Serás redirigido.");
      setTimeout(() => router.push('/eventos'), 2000);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [fiestaData, templateData] = await Promise.all([
        getFiestaById(fiestaId),
        getMeetingMasterTemplate()
      ]);
      if (!fiestaData) throw new Error("No se encontró el evento.");
      setFiesta(fiestaData);
      setMasterTemplate(templateData);
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
          acuerdos: formAcuerdos.trim(),
          checklist: formChecklist,
        };
        result = await updateReunionInFiestaActual(updatedReunionData);
      } else {
        const newReunionData: Omit<Reunion, 'id'> = {
          fiestaId: fiestaId,
          titulo: formTitulo.trim(),
          fecha: finalDate ? finalDate.toISOString() : undefined,
          notas: formNotas.trim(),
          acuerdos: formAcuerdos.trim(),
          checklist: formChecklist,
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
      setFormAcuerdos(reunion.acuerdos || '');
      setFormChecklist(reunion.checklist || []);
    } else {
      setCurrentReunion(null);
      setFormTitulo('');
      setFormFecha(undefined);
      setFormHora('');
      setFormNotas('');
      setFormAcuerdos('');
      // Cargar del maestro si es nueva
      setFormChecklist(masterTemplate?.checklist.map((i: any) => ({ ...i, completed: false })) || []);
    }
    setIsFormModalOpen(true);
  };
  
  const toggleChecklistItem = (id: string) => {
      setFormChecklist(prev => prev.map(item => 
          item.id === id ? { ...item, completed: !item.completed } : item
      ));
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

  const proximasReuniones = reuniones.filter(r => r.fecha && new Date(r.fecha) >= new Date());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                {currentReunion ? <Edit3 className="w-6 h-6 text-primary"/> : <PlusCircle className="w-6 h-6 text-primary"/>}
                {currentReunion ? 'Editar Reunión' : 'Agendar Nueva Reunión'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="detalles" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="detalles">Datos y Acuerdos</TabsTrigger>
                <TabsTrigger value="guia"><ListChecks className="w-4 h-4 mr-2"/>Guía y Checklist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detalles" className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-1"><Label htmlFor="reunion-titulo">Título de la Reunión*</Label><Input id="reunion-titulo" value={formTitulo} onChange={e => setFormTitulo(e.target.value)} placeholder="Ej: Definir decoración, Degustación menú" required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><Label htmlFor="reunion-fecha">Fecha</Label><DatePickerDemo selectedDate={formFecha} onDateChange={setFormFecha} /></div>
                    <div className="space-y-1"><Label htmlFor="reunion-hora">Hora</Label><Input id="reunion-hora" type="time" value={formHora} onChange={(e) => setFormHora(e.target.value)} disabled={!formFecha}/></div>
                </div>
                
                <div className="space-y-1"><Label htmlFor="reunion-notas">Notas / Temas a tratar</Label><Textarea id="reunion-notas" value={formNotas} onChange={(e) => setFormNotas(e.target.value)} rows={3} placeholder="Puntos a discutir en la reunión..."/></div>
                
                <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <Label htmlFor="reunion-acuerdos" className="text-primary font-bold flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4"/> Acuerdos Alcanzados
                    </Label>
                    <CardDescription>Documenta aquí las decisiones finales tomadas.</CardDescription>
                    <Textarea 
                        id="reunion-acuerdos" 
                        value={formAcuerdos} 
                        onChange={(e) => setFormAcuerdos(e.target.value)} 
                        rows={6} 
                        placeholder="Ej: Se acordó cambiar el plato principal a Pollo Relleno..."
                        className="bg-white"
                    />
                </div>
            </TabsContent>

            <TabsContent value="guia" className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                {masterTemplate?.guideNotes && (
                    <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600"/>
                        <AlertTitle className="text-blue-800 font-bold">Guía de Planificación</AlertTitle>
                        <div className="text-xs text-blue-700 whitespace-pre-line">
                            {masterTemplate.guideNotes}
                        </div>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label className="font-bold text-lg flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-primary"/> Checklist de Revisión
                    </Label>
                    <p className="text-xs text-muted-foreground mb-4">Usa esta lista para no olvidar ningún punto clave durante la charla.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {formChecklist.map(item => (
                            <div key={item.id} className="flex items-center space-x-3 p-2 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                <Checkbox 
                                    id={`check-${item.id}`} 
                                    checked={item.completed} 
                                    onCheckedChange={() => toggleChecklistItem(item.id)}
                                />
                                <Label 
                                    htmlFor={`check-${item.id}`} 
                                    className={cn("text-sm cursor-pointer", item.completed && "line-through text-muted-foreground")}
                                >
                                    {item.text}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-3 border-t">
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
            <Button onClick={handleFormSubmit} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {currentReunion ? 'Guardar Cambios' : 'Agendar Reunión'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquareText className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Reuniones con Cliente</h1>
        </div>
        <div className="flex gap-2">
            <Link href={`/fiestas/nueva/resumen-planificacion?fiestaId=${fiestaId}`}>
                <Button variant="secondary" size="sm">
                    <ClipboardCheck className="w-4 h-4 mr-2"/> Ver Planificación Actual
                </Button>
            </Link>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
        </div>
      </div>

      <Card className="shadow-md border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2"><CalendarPlus className="w-5 h-5"/>Planificación de Reuniones</CardTitle>
          <CardDescription>Agenda y mantén un registro de cada decisión tomada con tu cliente.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => openFormModal()} className="flex-1"><PlusCircle className="w-4 h-4 mr-2"/>Agendar Nueva Reunión</Button>
          <Link href={`/fiestas/nueva/resumen-planificacion?fiestaId=${fiestaId}`} className="flex-1">
            <Button variant="outline" className="w-full">
                Consolidado de Planificación <ArrowRight className="w-4 h-4 ml-2"/>
            </Button>
          </Link>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Historial de Reuniones</CardTitle>
          <CardDescription>
            {proximasReuniones.length > 0 ? `Tienes ${proximasReuniones.length} reunión(es) próxima(s).` : "No hay reuniones futuras agendadas."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reuniones.length > 0 ? (
            reuniones.map(reunion => (
              <Card key={reunion.id} className="p-4 bg-muted/40 border-l-4 border-primary">
                 <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-grow space-y-3">
                      <div>
                        <p className="font-bold text-lg text-primary">{reunion.titulo}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <CalendarIcon className="w-4 h-4" /> 
                            {formatDate(reunion.fecha)} 
                            {reunion.fecha && <span className="font-medium">{new Date(reunion.fecha).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})} hs.</span>}
                        </p>
                      </div>
                      
                      {reunion.checklist && reunion.checklist.some(i => i.completed) && (
                          <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                                  {reunion.checklist.filter(i => i.completed).length} puntos revisados
                              </Badge>
                          </div>
                      )}

                      {reunion.acuerdos && (
                        <div className="text-sm space-y-1">
                            <p className="font-bold text-primary flex items-center gap-1.5">
                                <ClipboardCheck className="w-4 h-4"/> Acuerdos y Decisiones:
                            </p>
                            <p className="bg-primary/5 p-3 rounded-md border border-primary/10 whitespace-pre-wrap">{reunion.acuerdos}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openFormModal(reunion)} title="Editar"><Edit3 className="w-4 h-4"/></Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" disabled={deletingReunionId === reunion.id} title="Eliminar">
                                  {deletingReunionId === reunion.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>¿Eliminar esta reunión?</AlertDialogTitle><AlertDialogDescription>"{reunion.titulo}" será eliminada.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteReunion(reunion.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                 </div>
              </Card>
            ))
           ) : <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                <MessageSquareText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No hay reuniones agendadas.</p>
                <p className="text-xs text-muted-foreground mt-1">Usa reuniones para documentar cada cambio en la planificación.</p>
            </div>
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
