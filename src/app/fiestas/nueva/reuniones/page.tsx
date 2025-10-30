
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, PlusCircle, Edit3, Trash2, Loader2, AlertTriangle, MessageSquareText, CalendarIcon, NotebookTextIcon, CalendarPlus, Palette, Music2, ChefHat, PackageSearch, Globe, KeyRound, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, Reunion, ClientPortalSettings } from '@/types/fiesta';
import { getFiestaById, addReunionToFiestaActual, updateReunionInFiestaActual, deleteReunionFromFiestaActual, updatePortalSettings } from '@/app/actions/fiesta-actual';
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
import { Separator } from '@/components/ui/separator';
import { useSearchParams, useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { defaultClientPortalSettings } from '@/lib/fiesta-defaults';

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

const moduleShortcuts = [
    { name: 'Decoración', href: '/fiestas/nueva/decoracion', icon: Palette },
    { name: 'Catering', href: '/fiestas/nueva/catering', icon: ChefHat },
    { name: 'Música', href: '/fiestas/nueva/musica', icon: Music2 },
    { name: 'Página del Evento', href: '/fiestas/nueva/pagina-web', icon: Globe },
];

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
    `DESCRIPTION:Reunión para el evento "${fiestaNombre}". Notas: ${reunion.notas.replace(/\\n/g, '\\\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  return icsContent;
};

const portalModules: { id: keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey'>, label: string }[] = [
    { id: 'checklist', label: 'Checklist de Tareas del Cliente' },
    { id: 'itinerario', label: 'Cronograma del Evento' },
    { id: 'musica', label: 'Sugerencias Musicales' },
    { id: 'videoVida', label: 'Carga de Fotos para Video' },
    { id: 'listaRegalos', label: 'Ver Lista de Regalos' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'notasCliente', label: 'Notas Compartidas' },
    { id: 'invitados', label: 'Lista de Invitados y Asignación de Mesas' },
    { id: 'paginaPublica', label: 'Acceso a Página Pública' },
    { id: 'fotografiaYFilmacion', label: 'Seguimiento de Fotografía/Video' },
];

function GestionReunionesContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [portalSettings, setPortalSettings] = useState<ClientPortalSettings>(defaultClientPortalSettings);

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
      setPortalSettings(fiestaData.clientPortalSettings || defaultClientPortalSettings);
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
  
  const handleSavePortalSettings = async () => {
    if (!portalSettings || !fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updatePortalSettings(fiestaId, portalSettings);
      if (result.success) {
        toast({ title: "Configuración Guardada", description: "Los ajustes del portal del cliente se han actualizado." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
       toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
    } finally {
       setIsSaving(false);
    }
  };
  
  const handlePortalSwitch = (moduleId: keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey'>, field: 'visible' | 'editable', value: boolean) => {
    setPortalSettings(prev => {
      if (!prev) return defaultClientPortalSettings;
      const moduleSettings = prev[moduleId] || { visible: false };
      return {
        ...prev,
        [moduleId]: { ...moduleSettings, [field]: value }
      };
    });
  };

  if (isLoading || !fiestaId) { return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>; }
  if (error || !fiesta) { return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>; }
  
  const portalLink = typeof window !== 'undefined' ? `${window.location.origin}/portal?fiestaId=${fiestaId}` : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ... (Dialogs for meetings) ... */}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquareText className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Reuniones y Portal Cliente</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiesta.id}`} passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Accede directamente a los módulos más relevantes para la colaboración con tu cliente.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {moduleShortcuts.map(sc => (
                <Link key={sc.href} href={`${sc.href}?fiestaId=${fiesta?.id}`} passHref>
                    <Button variant="secondary" className="w-full h-full flex-col py-3 gap-1">
                        <sc.icon className="w-5 h-5"/>
                        <span className="text-xs">{sc.name}</span>
                    </Button>
                </Link>
            ))}
        </CardContent>
      </Card>
      
      <Separator />

      {/* Portal Cliente Section */}
      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <KeyRound className="text-primary"/>Portal del Cliente
            </CardTitle>
            <CardDescription>Controla qué información puede ver y editar tu cliente en su portal privado.</CardDescription>
          </CardHeader>
           <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label htmlFor="portal-enabled" className="text-base font-medium">Habilitar Portal del Cliente</Label>
                  <p className="text-sm text-muted-foreground">Permite el acceso del cliente a su portal personalizado.</p>
                </div>
                <Switch id="portal-enabled" checked={portalSettings.enabled} onCheckedChange={(val) => setPortalSettings(p => ({...(p || defaultClientPortalSettings), enabled: val}))} />
              </div>
              {portalSettings.enabled && (
                <div className="space-y-4 animate-in fade-in-20">
                  <div className="space-y-2">
                    <Label htmlFor="portal-password">Contraseña de Acceso del Cliente</Label>
                    <Input id="portal-password" value={portalSettings.accessKey || ''} onChange={(e) => setPortalSettings(p => ({...(p || defaultClientPortalSettings), accessKey: e.target.value}))} placeholder="Crear una contraseña segura..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Enlace para compartir con el cliente</Label>
                    <div className="flex items-center gap-2">
                      <Input value={portalLink} readOnly/>
                      <Button type="button" size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(portalLink); toast({title: "Enlace copiado"}); }}><ClipboardCopy className="w-4 h-4"/></Button>
                    </div>
                  </div>
                  <Separator/>
                   <h4 className="text-md font-medium pt-2">Módulos Visibles para el Cliente</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {portalModules.map(mod => (
                            <div key={mod.id} className="flex items-center space-x-2 p-3 border rounded-md">
                                <Switch 
                                    id={`switch-${mod.id}`}
                                    checked={portalSettings[mod.id as keyof typeof settings]?.visible}
                                    onCheckedChange={(v) => handlePortalSwitch(mod.id, 'visible', v)}
                                />
                                <Label htmlFor={`switch-${mod.id}`}>{mod.label}</Label>
                            </div>
                        ))}
                   </div>
                </div>
              )}
           </CardContent>
          <CardFooter>
            <Button onClick={handleSavePortalSettings} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Guardar Configuración del Portal
            </Button>
          </CardFooter>
        </Card>

    </div>
  );
}

export default function GestionReunionesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <GestionReunionesContent />
    </Suspense>
  )
}
