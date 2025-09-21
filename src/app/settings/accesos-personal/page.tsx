
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, PlusCircle, Trash2, Loader2, AlertTriangle, KeyRound, ClipboardCopy, Share2, KanbanSquare, Music2, Clock, PackageSearch, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createAccesoPersonal, getAccesosGenerales, deleteAccesoPersonal, type AccesoPersonal, type ModuloPermiso } from '@/app/actions/accesos-personal';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const MODULOS_PERMITIDOS: { id: ModuloPermiso, label: string, icon: React.ElementType, type: 'general' | 'evento' }[] = [
    { id: 'crm', label: 'Gestión de Prospectos (CRM)', icon: KanbanSquare, type: 'general' },
    { id: 'musica', label: 'Música de la Fiesta', icon: Music2, type: 'evento' },
    { id: 'itinerario', label: 'Itinerario del Evento', icon: Clock, type: 'evento' },
    { id: 'carga-operativa', label: 'Lista de Carga Operativa', icon: PackageSearch, type: 'evento' },
    { id: 'decoracion', label: 'Plan de Decoración', icon: Palette, type: 'evento' },
];

export default function AccesosPersonalPage() {
  const { toast } = useToast();
  const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);
  const [accesos, setAccesos] = useState<AccesoPersonal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombreAcceso, setNombreAcceso] = useState('');
  const [permisos, setPermisos] = useState<Set<ModuloPermiso>>(new Set());
  const [tipoAcceso, setTipoAcceso] = useState<'general' | 'evento'>('general');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fiesta, fetchedAccesos] = await Promise.all([
        getFiestaActual(),
        getAccesosGenerales()
      ]);
      setFiestaActual(fiesta);
      setAccesos(fetchedAccesos);
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateAcceso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreAcceso.trim() || permisos.size === 0) {
      toast({ title: "Datos incompletos", description: "El nombre y al menos un permiso son requeridos.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    const result = await createAccesoPersonal({
      nombreAcceso,
      fiestaId: tipoAcceso === 'evento' ? fiestaActual?.id : undefined,
      permisos: Array.from(permisos)
    });
    if (result.success) {
      toast({ title: "¡Acceso Creado!", description: "El enlace de acceso ha sido generado." });
      setIsModalOpen(false);
      setNombreAcceso('');
      setPermisos(new Set());
      await loadData();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsProcessing(false);
  };
  
  const handleDeleteAcceso = async (accesoId: string) => {
      setIsProcessing(true);
      const result = await deleteAccesoPersonal(accesoId);
      if(result.success) {
          toast({title: "Acceso Eliminado"});
          await loadData();
      } else {
          toast({title: "Error", description: result.error, variant: "destructive"});
      }
      setIsProcessing(false);
  }
  
  const copyLink = (tokenId: string) => {
    const url = `${window.location.origin}/acceso-personal/${tokenId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Enlace Copiado" });
  };
  
  const shareLink = (tokenId: string) => {
     const url = `${window.location.origin}/acceso-personal/${tokenId}`;
     const message = `¡Hola! Aquí tienes tu acceso para los detalles del evento: ${url}`;
     window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear Nuevo Acceso para Colaborador</DialogTitle><DialogDescription>Define un nombre y selecciona los módulos a los que tendrá acceso.</DialogDescription></DialogHeader>
          <form onSubmit={handleCreateAcceso} className="space-y-4 py-2">
            <div className="space-y-1"><Label htmlFor="nombre-acceso">Nombre del Acceso *</Label><Input id="nombre-acceso" value={nombreAcceso} onChange={e => setNombreAcceso(e.target.value)} placeholder="Ej: Acceso Secretaria, Acceso DJ" required /></div>
            <div className="space-y-1"><Label htmlFor="tipo-acceso">Tipo de Acceso</Label>
                <Select value={tipoAcceso} onValueChange={(v) => {setTipoAcceso(v as 'general' | 'evento'); setPermisos(new Set())}}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="general">General (CRM, etc.)</SelectItem>
                        <SelectItem value="evento">Para el Evento Actual</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2"><Label>Permisos *</Label>
              <div className="space-y-2 p-3 border rounded-md">
                {MODULOS_PERMITIDOS.filter(m => m.type === tipoAcceso).map(modulo => (
                  <div key={modulo.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`permiso-${modulo.id}`}
                      checked={permisos.has(modulo.id)}
                      onCheckedChange={(checked) => {
                        setPermisos(prev => {
                          const newPermisos = new Set(prev);
                          if (checked) newPermisos.add(modulo.id);
                          else newPermisos.delete(modulo.id);
                          return newPermisos;
                        });
                      }}
                    />
                    <Label htmlFor={`permiso-${modulo.id}`} className="font-normal">{modulo.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="pt-3">
                <DialogClose asChild><Button type="button" variant="outline" disabled={isProcessing}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isProcessing}>{isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Crear Acceso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Accesos para Colaboradores</h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Configuración</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Accesos</CardTitle>
          <CardDescription>Crea enlaces únicos y seguros para que tu personal (secretaria, DJ, etc.) pueda ver solo la información relevante, sin necesidad de una contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsModalOpen(true)}><PlusCircle className="w-4 h-4 mr-2"/>Crear Nuevo Enlace de Acceso</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Enlaces de Acceso Activos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
           {isLoading ? <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div> : 
             accesos.length > 0 ? (
                 accesos.map(acceso => (
                    <Card key={acceso.id} className="p-3 bg-muted/40">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                           <div>
                                <p className="font-semibold text-primary">{acceso.nombreAcceso}</p>
                                <p className="text-xs text-muted-foreground">Permisos: {acceso.permisos.join(', ')}</p>
                                <p className="text-xs text-muted-foreground">Válido para: {acceso.fiestaId ? 'Evento Actual' : 'General'}</p>
                           </div>
                           <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                               <Button variant="outline" size="sm" onClick={() => copyLink(acceso.id)} className="flex-1"><ClipboardCopy className="w-3.5 h-3.5 mr-1.5"/>Copiar</Button>
                               <Button variant="secondary" size="sm" onClick={() => shareLink(acceso.id)} className="flex-1"><Share2 className="w-3.5 h-3.5 mr-1.5"/>Compartir</Button>
                               <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => handleDeleteAcceso(acceso.id)} disabled={isProcessing}><Trash2 className="w-4 h-4"/></Button>
                           </div>
                        </div>
                    </Card>
                 ))
             ) : <p className="text-center text-muted-foreground py-4">No hay enlaces de acceso creados.</p>
           }
        </CardContent>
      </Card>
    </div>
  );
}
