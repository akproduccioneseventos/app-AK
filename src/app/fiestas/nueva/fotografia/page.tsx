
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Film, PlusCircle, Trash2 } from 'lucide-react';
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

const ALL_ESTADOS_ENTREGA: EntregaMaterialEstado[] = ['Pendiente', 'En edición', 'En revisión', 'Entregado parcial', 'Entregado completo'];

function FotografiaContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    const [formData, setFormData] = useState<FotografiaYFilmacionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<ServicioFotografia> | null>(null);

    const loadData = useCallback(async () => {
        if (!fiestaId) return;
        setIsLoading(true);
        try {
            const fiesta = await getFiestaById(fiestaId);
            if (!fiesta) throw new Error("Fiesta no encontrada");
            setFormData(fiesta.fotografiaYFilmacion || { servicios: [], notasGenerales: '' });
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
                toast({ title: "¡Guardado!", description: "La información de fotografía y filmación ha sido actualizada." });
                await loadData();
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
        return <div className="p-8 max-w-2xl mx-auto"><Loader2 className="w-8 h-8 animate-spin"/></div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentItem?.id ? 'Editar' : 'Añadir'} Servicio</DialogTitle>
                    </DialogHeader>
                    {currentItem && (
                        <div className="space-y-4 py-2">
                           <div className="space-y-1">
                                <Label htmlFor="item-nombre">Nombre del Servicio*</Label>
                                <Input id="item-nombre" value={currentItem.nombre || ''} onChange={e => setCurrentItem(p => p ? {...p, nombre: e.target.value} : null)} placeholder="Ej: Fotografía de Fiesta, Sesión Exterior"/>
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="item-estado">Estado</Label>
                                <Select value={currentItem.estado} onValueChange={(v) => setCurrentItem(p => p ? {...p, estado: v as EntregaMaterialEstado} : null)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>{ALL_ESTADOS_ENTREGA.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                           </div>
                            <div className="space-y-1">
                                <Label htmlFor="item-fecha">Fecha Estimada Entrega</Label>
                                <DatePickerDemo selectedDate={currentItem.fechaEntregaEstimada ? new Date(currentItem.fechaEntregaEstimada) : undefined} onDateChange={(date) => setCurrentItem(p => p ? {...p, fechaEntregaEstimada: date?.toISOString()} : null)}/>
                           </div>
                            <div className="space-y-1">
                                <Label htmlFor="item-link">Enlace de Entrega</Label>
                                <Input id="item-link" type="url" value={currentItem.linkEntrega || ''} onChange={e => setCurrentItem(p => p ? {...p, linkEntrega: e.target.value} : null)}/>
                           </div>
                        </div>
                    )}
                    <DialogFooter>
                         <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                         <Button onClick={handleItemSave}>Guardar Servicio</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Film className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Proceso de Edición y Entrega</h1>
                </div>
                <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`} passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button></Link>
            </div>
            
            <p className="text-muted-foreground">Aquí es donde se sigue el proceso de edición y entrega de las fotos o videos contratados. Mantén un registro del estado de cada entregable para una comunicación clara con el cliente.</p>

            <Card>
                <CardHeader>
                    <CardTitle>Servicios Contratados</CardTitle>
                    <CardDescription>Añade y gestiona el estado de cada servicio de fotografía y video para este evento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Button onClick={() => openItemModal()}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Servicio</Button>
                     <div className="space-y-3">
                        {(formData.servicios || []).map(servicio => (
                            <Card key={servicio.id} className="p-3 bg-muted/30">
                               <div className="flex justify-between items-start gap-2">
                                  <div>
                                      <p className="font-semibold">{servicio.nombre}</p>
                                      <p className="text-sm text-muted-foreground">Estado: <span className="font-medium text-primary">{servicio.estado}</span></p>
                                      {servicio.fechaEntregaEstimada && <p className="text-xs text-muted-foreground">Entrega Est: {new Date(servicio.fechaEntregaEstimada).toLocaleDateString()}</p>}
                                  </div>
                                  <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openItemModal(servicio)}>Editar</Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteItem(servicio.id)}><Trash2 className="w-4 h-4"/></Button>
                                  </div>
                               </div>
                            </Card>
                        ))}
                         {(!formData.servicios || formData.servicios.length === 0) && <p className="text-sm text-center text-muted-foreground py-4">No hay servicios de fotografía/video añadidos.</p>}
                     </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Notas Generales</CardTitle></CardHeader>
                <CardContent>
                    <Textarea value={formData.notasGenerales || ''} onChange={(e) => setFormData(p => p ? {...p, notasGenerales: e.target.value} : null)} placeholder="Anotaciones sobre proveedores, contacto, etc."/>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    Guardar Cambios
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
