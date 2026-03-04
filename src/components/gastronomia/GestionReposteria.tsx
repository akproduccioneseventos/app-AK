
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReposteriaData, ReposteriaCategoria, ReposteriaItem } from '@/types/fiesta';
import { Cake, Edit, Trash2, PlusCircle, BookOpen, Search } from 'lucide-react';
import { defaultReposteriaData } from '@/lib/fiesta-defaults';
import { useToast } from '@/hooks/use-toast';
import { ALL_UNIDADES_SERVICIO, type UnidadServicio, type ServicioEmpresa } from '@/types/empresa';
import { getInsumos } from '@/app/actions/insumos';
import { ScrollArea } from '../ui/scroll-area';
import Link from 'next/link';

interface GestionReposteriaProps {
  initialData: ReposteriaData | null;
  onDataChange: (data: ReposteriaData) => void;
  invitados: { adultos: number; ninos: number; adolescentes: number };
  isTemplateMode?: boolean;
}

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

export const GestionReposteria: React.FC<GestionReposteriaProps> = ({ initialData, onDataChange, invitados, isTemplateMode = false }) => {
  const { toast } = useToast();
  const [reposteria, setReposteria] = useState<ReposteriaData>(initialData || defaultReposteriaData);
  const [catalogoInsumos, setCatalogoInsumos] = useState<ServicioEmpresa[]>([]);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ReposteriaCategoria | null>(null);
  const [currentItem, setCurrentItem] = useState<Partial<ReposteriaItem>>({});
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');

  useEffect(() => {
    if (initialData) {
        setReposteria(initialData);
    }
  }, [initialData]);

  const triggerChange = (updatedData: ReposteriaData) => {
    setReposteria(updatedData);
    onDataChange(updatedData);
  };

  const fetchCatalogo = useCallback(async () => {
    try {
        const todosLosInsumos = await getInsumos();
        setCatalogoInsumos(todosLosInsumos);
    } catch(e) {
        console.error("Failed to load insumos catalog:", e);
    }
  }, []);

  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);

  const handleCategoryActivation = (categoryId: string, activada: boolean) => {
    const updated = {
      ...reposteria,
      categorias: reposteria.categorias.map(c => c.id === categoryId ? { ...c, activada } : c)
    };
    triggerChange(updated);
  };
  
  const openItemModal = (category: ReposteriaCategoria, item?: ReposteriaItem) => {
    setEditingCategory(category);
    setCurrentItem(item || { nombre: '', cantidad: 1, unidad: 'unidad', costoEstimado: 0 });
    setIsItemModalOpen(true);
  };
  
  const openCatalogModal = (category: ReposteriaCategoria) => {
    setEditingCategory(category);
    setCatalogSearchTerm('');
    setIsCatalogModalOpen(true);
  };

  const handleItemChange = (field: keyof ReposteriaItem, value: any) => {
    setCurrentItem(prev => (prev ? { ...prev, [field]: value } : {}));
  };

  const handleSaveItem = () => {
    if (!editingCategory || !currentItem.nombre?.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" });
      return;
    }
    const finalItem: ReposteriaItem = {
      ...currentItem,
      id: currentItem.id || `item_${Date.now()}`,
      nombre: currentItem.nombre.trim(),
      cantidad: Number(currentItem.cantidad) || 1,
      unidad: currentItem.unidad || 'unidad',
      costoEstimado: Number(currentItem.costoEstimado) || 0,
    } as ReposteriaItem;

    const updated = {
      ...reposteria,
      categorias: reposteria.categorias.map(cat => {
        if (cat.id !== editingCategory.id) return cat;
        const existingItemIndex = cat.items.findIndex(i => i.id === finalItem.id);
        if (existingItemIndex > -1) {
          const newItems = [...cat.items];
          newItems[existingItemIndex] = finalItem;
          return { ...cat, items: newItems };
        } else {
          return { ...cat, items: [...cat.items, finalItem] };
        }
      })
    };
    
    triggerChange(updated);
    setIsItemModalOpen(false);
    toast({title: "Ítem guardado"});
  };
  
  const handleAddFromCatalog = (insumo: ServicioEmpresa) => {
      if (!editingCategory) return;
      const newItem: ReposteriaItem = {
          id: `item_cat_${insumo.id}_${Date.now()}`,
          origenId: insumo.id,
          nombre: insumo.nombre,
          cantidad: 1,
          unidad: insumo.unidad || 'unidad',
          costoEstimado: insumo.valorUnitarioEstimated || 0,
      };
      const updated = {
        ...reposteria,
        categorias: reposteria.categorias.map(cat => 
          cat.id === editingCategory.id ? {...cat, items: [...cat.items, newItem]} : cat
        )
      };
      triggerChange(updated);
      toast({description: `"${insumo.nombre}" añadido.`});
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
     const updated = {
      ...reposteria,
      categorias: reposteria.categorias.map(cat => 
        cat.id === categoryId ? { ...cat, items: cat.items.filter(i => i.id !== itemId) } : cat
      )
    };
    triggerChange(updated);
    toast({title: "Ítem eliminado", variant: "destructive"});
  };
  
  const totalCostoReposteria = useMemo(() => {
    let total = 0;
    reposteria.categorias.forEach(cat => {
      if (isTemplateMode || cat.activada) {
        cat.items.forEach(item => {
          total += (item.costoEstimado || 0) * (item.cantidad || 1);
        });
      }
    });
    return total;
  }, [reposteria, isTemplateMode]);

  const filteredInsumos = useMemo(() => {
    if (!catalogSearchTerm) return catalogoInsumos;
    const lowerSearch = catalogSearchTerm.toLowerCase();
    return catalogoInsumos.filter(i => 
      i.nombre.toLowerCase().includes(lowerSearch) ||
      i.categoria?.toLowerCase().includes(lowerSearch)
    );
  }, [catalogoInsumos, catalogSearchTerm]);

  return (
    <>
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Ítem para {editingCategory?.nombreDisplay}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label htmlFor="item-nombre-manual">Nombre Ítem</Label><Input id="item-nombre-manual" value={currentItem.nombre || ''} onChange={e => handleItemChange('nombre', e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label htmlFor="item-qty-manual">Cantidad</Label><Input id="item-qty-manual" type="number" value={currentItem.cantidad || 1} onChange={e => handleItemChange('cantidad', e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="item-unit-manual">Unidad</Label><Select value={currentItem.unidad || 'unidad'} onValueChange={(v) => handleItemChange('unidad', v)}><SelectTrigger id="item-unit-manual"><SelectValue /></SelectTrigger><SelectContent>{ALL_UNIDADES_SERVICIO.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1 relative"><Label htmlFor="item-cost-manual">Costo Est.</Label><Input id="item-cost-manual" type="number" value={currentItem.costoEstimado || 0} onChange={e => handleItemChange('costoEstimado', e.target.value)} className="pl-6"/><span className="absolute left-2 top-1/2 mt-1 text-muted-foreground">$</span></div>
            </div>
            <div className="space-y-1"><Label htmlFor="item-notes-manual">Notas</Label><Input id="item-notes-manual" value={currentItem.notes || ''} onChange={e => handleItemChange('notes', e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveItem}>Guardar Ítem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Seleccionar del Catálogo de Insumos</DialogTitle><DialogDescription>Añadiendo a: {editingCategory?.nombreDisplay}</DialogDescription></DialogHeader>
            <div className="py-2 space-y-2">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder="Buscar insumo..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="pl-9"/></div>
                <ScrollArea className="h-64 border rounded-md p-1"><ul className="space-y-1">{filteredInsumos.length > 0 ? filteredInsumos.map(insumo => (<li key={insumo.id}><Button type="button" variant="ghost" className="w-full justify-start text-left h-auto" onClick={() => { handleAddFromCatalog(insumo); setIsCatalogModalOpen(false); }}><div><p className="font-medium text-sm">{insumo.nombre}</p><p className="text-xs text-muted-foreground">{formatCurrency(insumo.valorUnitarioEstimado)} / {insumo.unidad}</p></div></Button></li>))
                    : <li className="p-4 text-sm text-center text-muted-foreground">No hay insumos que coincidan.</li>}
                </ul></ScrollArea>
            </div>
             <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="shadow-lg">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="p-3 bg-primary/10 rounded-lg"><Cake className="w-8 h-8 text-primary" /></div>
          <div>
            <CardTitle className="font-headline text-2xl">Repostería</CardTitle>
            <CardDescription>
              Activa y configura las mesas dulces y postres. Los cambios se guardan automáticamente.
            </CardDescription>
          </div>
          {!isTemplateMode && (
            <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Costo Total Estimado</p>
                <p className="text-xl font-bold">{formatCurrency(totalCostoReposteria)}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-3" defaultValue={isTemplateMode ? reposteria.categorias.map(c => c.id) : reposteria.categorias.filter(c=>c.activada).map(c=>c.id)}>
            {reposteria.categorias.map(cat => (
              <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg shadow-sm">
                <div className="flex items-center p-3">
                  <AccordionTrigger className="hover:no-underline flex-1"><span className="font-semibold text-primary">{cat.nombreDisplay}</span></AccordionTrigger>
                  {!isTemplateMode && (<Switch checked={cat.activada} onCheckedChange={(checked) => handleCategoryActivation(cat.id, checked)} onClick={(e) => e.stopPropagation()}/>)}
                </div>
                <AccordionContent className="px-4 pb-4 border-t">
                  <div className="space-y-4 pt-3">
                    <p className="text-sm text-muted-foreground">{cat.descripcion}</p>
                    {cat.items.length > 0 ? (
                      <div className="space-y-2">
                          <h4 className="text-sm font-medium">Ítems Añadidos:</h4>
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                              {cat.items.map(item => (
                                <li key={item.id} className="flex items-center justify-between">
                                  <span>{item.nombre} ({item.cantidad} {item.unidad}) - {formatCurrency(item.costoEstimado)}</span>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openItemModal(cat, item)}><Edit className="w-3.5 h-3.5"/></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(cat.id, item.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                  </div>
                                </li>
                              ))}
                          </ul>
                      </div>
                    ) : ( <p className="text-sm text-muted-foreground italic text-center py-2">No hay ítems para esta categoría.</p> )}
                    <div className="flex justify-end pt-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => openItemModal(cat)}><PlusCircle className="w-3 h-3 mr-2"/>Añadir Manual</Button>
                        <Button variant="outline" size="sm" onClick={() => openCatalogModal(cat)}><BookOpen className="w-3 h-3 mr-2"/>Añadir desde Catálogo</Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
};
