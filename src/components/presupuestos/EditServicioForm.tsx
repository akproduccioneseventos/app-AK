
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit3, Trash2, Loader2, AlertTriangle, Package, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getServiciosEmpresa, saveServicioEmpresa, deleteServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ServicioEmpresa, CategoriaServicio, TipoItemEmpresa, UnidadServicio } from '@/types/empresa';
import { ALL_CATEGORIAS_SERVICIO, ALL_TIPOS_ITEM_EMPRESA, ALL_UNIDADES_SERVICIO } from '@/types/empresa';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const initialFormState: Partial<ServicioEmpresa> = {
    nombre: '',
    tipoItem: 'Servicio',
    categoria: 'Otros servicios',
    precioVenta: 0,
    calculationMethod: 'fijo',
};

const EditServicioForm: React.FC<{ onCatalogUpdate: () => Promise<void> }> = ({ onCatalogUpdate }) => {
    const { toast } = useToast();
    const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<ServicioEmpresa>>(initialFormState);

    const fetchAndSetServicios = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getServiciosEmpresa();
            setServicios(data.filter(s => s.tipoItem === 'Servicio'));
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar el catálogo.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAndSetServicios();
    }, [fetchAndSetServicios]);
    
    const openModal = (item?: ServicioEmpresa) => {
        setCurrentItem(item || initialFormState);
        setIsModalOpen(true);
    };

    const handleFormChange = (field: keyof ServicioEmpresa, value: any) => {
        setCurrentItem(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentItem || !currentItem.nombre) return;
        
        setIsSaving(true);
        try {
            const result = await saveServicioEmpresa(currentItem as ServicioEmpresa);
            if (result.success) {
                toast({ title: `Servicio ${currentItem.id ? 'actualizado' : 'creado'}` });
                setIsModalOpen(false);
                await fetchAndSetServicios(); // Refresh parent and local list
                await onCatalogUpdate();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (err: any) {
            toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        setIsSaving(true);
        try {
            const result = await deleteServicioEmpresa(id);
            if (result.success) {
                toast({ title: "Servicio eliminado", variant: "destructive"});
                await fetchAndSetServicios();
                await onCatalogUpdate();
            } else {
                 throw new Error(result.error || 'Error desconocido');
            }
        } catch(err: any) {
             toast({ title: "Error al eliminar", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="py-4 h-full flex flex-col">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{currentItem?.id ? 'Editar' : 'Añadir'} Servicio</DialogTitle>
                    </DialogHeader>
                    {currentItem && (
                        <form onSubmit={handleSave} className="space-y-4">
                             <div className="space-y-1"><Label htmlFor="item-nombre">Nombre del Servicio *</Label><Input id="item-nombre" value={currentItem.nombre || ''} onChange={(e) => handleFormChange('nombre', e.target.value)} required /></div>
                             <div className="space-y-1"><Label htmlFor="item-categoria">Categoría *</Label><Select value={currentItem.categoria || ''} onValueChange={(value) => handleFormChange('categoria', value as CategoriaServicio)} required><SelectTrigger id="item-categoria"><SelectValue /></SelectTrigger><SelectContent>{ALL_CATEGORIAS_SERVICIO.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
                             <div className="space-y-1"><Label htmlFor="item-precioVenta">Precio de Venta Fijo (UYU)</Label><Input id="item-precioVenta" type="number" value={currentItem.precioVenta ?? ''} onChange={(e) => handleFormChange('precioVenta', e.target.value)} required min="0" step="any"/></div>
                             <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}{currentItem.id ? 'Guardar Cambios' : 'Crear Servicio'}</Button>
                             </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
            <div className="flex justify-between items-center mb-4">
                <Button onClick={() => openModal()}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Servicio</Button>
            </div>
            
            <ScrollArea className="flex-grow pr-3 -mr-3">
                {isLoading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin"/></div> :
                servicios.length > 0 ? (
                    <div className="space-y-2">
                        {servicios.map(servicio => (
                            <div key={servicio.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/40">
                                <div className="flex-grow">
                                    <p className="font-medium text-sm">{servicio.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(servicio.precioVenta)} - {servicio.categoria}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(servicio)}><Edit3 className="w-4 h-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(servicio.id)} disabled={isSaving}><Trash2 className="w-4 h-4"/></Button>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-center text-muted-foreground p-4">No hay servicios en el catálogo.</p>}
            </ScrollArea>
        </div>
    );
};

export default EditServicioForm;
