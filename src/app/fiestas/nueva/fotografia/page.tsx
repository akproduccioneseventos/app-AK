
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Film, PlusCircle, Trash2, Camera, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateFotografiaYFilmacionFiestaActual as updateFotografia } from '@/app/actions/fiesta-actual';
import type { FotografiaYFilmacionData, ServicioFotografia, EntregaMaterialEstado } from '@/types/fiesta';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ALL_ESTADOS_ENTREGA: EntregaMaterialEstado[] = ['Pendiente', 'En edición', 'En revisión', 'Entregado parcial', 'Entregado completo'];

function FotografiaContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    const [formData, setFormData] = useState<FotografiaYFilmacionData | null>(null);
    const [eventDate, setEventDate] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<ServicioFotografia> | null>(null);

    const loadData = useCallback(async (showLoading = true) => {
        if (!fiestaId) return;
        if(showLoading) setIsLoading(true);
        try {
            const fiesta = await getFiestaById(fiestaId);
            if (!fiesta) throw new Error("Fiesta no encontrada");
            
            setEventDate(fiesta.configuracion.fechaEvento);
            let currentFotoData = fiesta.fotografiaYFilmacion || { servicios: [], notasGenerales: '' };

            // AUTO-SYNC LOGIC: If no services are defined, check the budget
            if (currentFotoData.servicios.length === 0 && fiesta.presupuestoId) {
                const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
                if (presupuesto) {
                    const newServicios: ServicioFotografia[] = [];
                    
                    presupuesto.itemsPresupuestados.forEach(item => {
                        const name = item.nombreServicio.toLowerCase();
                        if (name.includes('foto') || name.includes('film') || name.includes('video')) {
                            // Calculate default delivery date: Day after party + 30 days
                            let deliveryDate = undefined;
                            if (fiesta.configuracion.fechaEvento) {
                                const d = new Date(fiesta.configuracion.fechaEvento);
                                d.setDate(d.getDate() + 31); // 1 day after + 30 days of edition
                                deliveryDate = d.toISOString();
                            }

                            newServicios.push({
                                id: `sync_${item.idServicioCatalogo}_${Date.now()}`,
                                nombre: item.nombreServicio,
                                estado: 'Pendiente',
                                fechaEntregaEstimada: deliveryDate,
                            });
                        }
                    });

                    if (newServicios.length > 0) {
                        currentFotoData = { ...currentFotoData, servicios: newServicios };
                    }
                }
            }

            setFormData(currentFotoData);
        } catch (e) {
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast, fiestaId]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleSave = async () => {
        if (!formData || !fiestaId) return;
        setIsSaving(true);
        try {
            const result = await updateFotografia(fiestaId, formData);
            if (result.success) {
                toast({ title: "¡Guardado!", description: "La información ha sido actualizada y es visible para el cliente." });
                if (result.updatedData) setFormData(result.updatedData);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const openItemModal = (item?: ServicioFotografia) => {
        setCurrentItem(item || { nombre: '', estado: 'Pendiente' });
        setIsModalOpen(true);
    };

    const handleItemSave = () => {
        if (!currentItem || !currentItem.nombre) {
            toast({title: "Nombre requerido", variant: "destructive"});
            return;
        }

        const itemToSave: ServicioFotografia = {
            ...currentItem,
            id: currentItem.id || `serv_foto_${Date.now()}`,
            nombre: currentItem.nombre,
            estado: currentItem.estado || 'Pendiente',
            fechaEntregaEstimada: currentItem.fechaEntregaEstimada,
            linkEntrega: currentItem.linkEntrega
        };

        setFormData(prev => {
            if (!prev) return null;
            const servicios = prev.servicios || [];
            const existing = servicios.find(s => s.id === itemToSave.id);
            if (existing) {
                return { ...prev, servicios: servicios.map(s => s.id === itemToSave.id ? itemToSave : s) };
            } else {
                return { ...prev, servicios: [...servicios, itemToSave] };
            }
        });

        setIsModalOpen(false);
        setCurrentItem(null);
    };
    
    const handleDeleteItem = (itemId: string) => {
        setFormData(prev => {
            if (!prev) return null;
            return { ...prev, servicios: (prev.servicios || []).filter(s => s.id !== itemId) }
        });
    };

    if (isLoading || !formData) {
        return <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary mb-4"/><p>Sincronizando con el presupuesto...</p></div>
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-headline text-xl">{currentItem?.id ? 'Editar' : 'Añadir'} Servicio de Fotografía</DialogTitle>
                    </DialogHeader>
                    {currentItem && (
                        <div className="space-y-4 py-2">
                           <div className="space-y-1">
                                <Label htmlFor="item-nombre">Nombre del Servicio (Fiesta, Exteriores, etc.)*</Label>
                                <Input id="item-nombre" value={currentItem.nombre || ''} onChange={e => setCurrentItem(p => p ? {...p, nombre: e.target.value} : null)} placeholder="Ej: Fotografía de Fiesta, Sesión Exterior"/>
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="item-estado">Estado de Entrega</Label>
                                <Select value={currentItem.estado} onValueChange={(v) => setCurrentItem(p => p ? {...p, estado: v as EntregaMaterialEstado} : null)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>{ALL_ESTADOS_ENTREGA.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                           </div>
                            <div className="space-y-1">
                                <Label htmlFor="item-fecha">Fecha Estimada de Entrega</Label>
                                <DatePickerDemo selectedDate={currentItem.fechaEntregaEstimada ? new Date(currentItem.fechaEntregaEstimada) : undefined} onDateChange={(date) => setCurrentItem(p => p ? {...p, fechaEntregaEstimada: date?.toISOString()} : null)}/>
                                {currentItem.nombre?.toLowerCase().includes('fiesta') && eventDate && (
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3"/> El plazo comienza a contar desde el día después de la fiesta ({new Date(new Date(eventDate).getTime() + 86400000).toLocaleDateString('es-UY')})
                                    </p>
                                )}
                           </div>
                            <div className="space-y-1">
                                <Label htmlFor="item-link">Enlace de Galería Digital (Ej: Google Drive, WeTransfer)</Label>
                                <Input id="item-link" type="url" value={currentItem.linkEntrega || ''} onChange={e => setCurrentItem(p => p ? {...p, linkEntrega: e.target.value} : null)} placeholder="https://..."/>
                           </div>
                        </div>
                    )}
                    <DialogFooter>
                         <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                         <Button onClick={handleItemSave}>Actualizar Seguimiento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Film className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Seguimiento de Fotografía y Video</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => loadData(true)} title="Actualizar desde presupuesto">
                        <RefreshCw className="w-4 h-4 mr-2"/>Sincronizar
                    </Button>
                    <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
                </div>
            </div>
            
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-800">
                        <Camera className="w-4 h-4"/> Control de Entregables
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-700 space-y-1">
                    <p>● Los servicios se cargan automáticamente desde el presupuesto.</p>
                    <p>● Configura aquí los tiempos de entrega para que el cliente los vea en su portal.</p>
                    <p>● El plazo de edición para la fiesta inicia el día siguiente al evento.</p>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Servicios en Seguimiento</CardTitle>
                    <CardDescription>Gestiona el estado de cada material contratado. El cliente puede ver este avance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(formData.servicios || []).map(servicio => (
                            <Card key={servicio.id} className={cn("p-4 border-l-4 transition-all hover:shadow-md", 
                                servicio.estado === 'Entregado completo' ? 'border-l-green-500 bg-green-50/10' : 
                                servicio.estado === 'En edición' ? 'border-l-blue-500 bg-blue-50/10' : 'border-l-amber-500 bg-amber-50/10'
                            )}>
                               <div className="flex justify-between items-start gap-2">
                                  <div className="space-y-2 flex-grow">
                                      <div className="flex items-center justify-between">
                                          <p className="font-bold text-lg">{servicio.nombre}</p>
                                          <Badge variant={servicio.estado === 'Entregado completo' ? 'default' : 'secondary'} className={cn(
                                              servicio.estado === 'Entregado completo' ? 'bg-green-100 text-green-700' : 
                                              servicio.estado === 'En edición' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                          )}>
                                              {servicio.estado}
                                          </Badge>
                                      </div>
                                      
                                      <div className="space-y-1 text-sm text-muted-foreground">
                                          <div className="flex items-center gap-2">
                                              <Clock className="w-4 h-4 text-primary/60"/>
                                              <span>Entrega estimada: <strong>{servicio.fechaEntregaEstimada ? new Date(servicio.fechaEntregaEstimada).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pendiente'}</strong></span>
                                          </div>
                                          {servicio.linkEntrega && (
                                              <div className="flex items-center gap-2 text-primary hover:underline">
                                                  <CheckCircle2 className="w-4 h-4 text-green-500"/>
                                                  <a href={servicio.linkEntrega} target="_blank" rel="noopener noreferrer">Acceder a la Galería</a>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                               </div>
                               <div className="mt-4 pt-3 border-t flex justify-end gap-2">
                                   <Button variant="outline" size="sm" onClick={() => openItemModal(servicio)}>
                                       <Edit className="w-4 h-4 mr-2"/>Configurar
                                   </Button>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteItem(servicio.id)}>
                                       <Trash2 className="w-4 h-4"/>
                                   </Button>
                               </div>
                            </Card>
                        ))}
                         {(!formData.servicios || formData.servicios.length === 0) && (
                             <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <Camera className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3"/>
                                <p className="text-muted-foreground">No hay servicios detectados en el presupuesto.</p>
                                <Button variant="outline" size="sm" onClick={() => openItemModal()} className="mt-4">
                                    <PlusCircle className="w-4 h-4 mr-2"/>Añadir Manualmente
                                </Button>
                             </div>
                         )}
                     </div>
                     {formData.servicios.length > 0 && (
                        <div className="flex justify-start">
                            <Button variant="outline" size="sm" onClick={() => openItemModal()} className="border-dashed">
                                <PlusCircle className="w-4 h-4 mr-2"/>Añadir Servicio Extra
                            </Button>
                        </div>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-lg">Notas Generales de Entrega</CardTitle></CardHeader>
                <CardContent>
                    <Textarea value={formData.notasGenerales || ''} onChange={(e) => setFormData(p => p ? {...p, notasGenerales: e.target.value} : null)} placeholder="Observaciones sobre retoques, requerimientos especiales del cliente, etc." rows={4}/>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
                    Guardar Cambios y Notificar Cliente
                </Button>
            </div>
        </div>
    );
}

export default function FotografiaPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <FotografiaContent />
        </Suspense>
    )
}
