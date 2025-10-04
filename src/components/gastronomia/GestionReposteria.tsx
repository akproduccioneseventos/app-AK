
'use client';

import React, { useState, useEffect, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { ReposteriaData, ReposteriaCategoria, ReposteriaItem } from '@/types/fiesta';
import { Cake, Edit, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { defaultReposteriaData } from '@/lib/fiesta-defaults';
import { useToast } from '@/hooks/use-toast';
import { ALL_UNIDADES_SERVICIO, type UnidadServicio, type ServicioEmpresa } from '@/types/empresa';
import { getServiciosEmpresa, saveServicioEmpresa } from '@/app/actions/servicios-empresa'; 

interface GestionReposteriaProps {
  initialData: ReposteriaData | null;
  onDataChange: (data: ReposteriaData) => void;
  invitados: { adultos: number; ninos: number; adolescentes: number };
  isTemplateMode?: boolean;
}

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export const GestionReposteria: React.FC<GestionReposteriaProps> = ({ initialData, onDataChange, invitados, isTemplateMode = false }) => {
  const { toast } = useToast();
  const [reposteria, setReposteria] = useState<ReposteriaData>(initialData || defaultReposteriaData);
  const [catalogoReposteria, setCatalogoReposteria] = useState<ServicioEmpresa[]>([]);
  
  // State for manual item modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ReposteriaCategoria | null>(null);
  const [currentItem, setCurrentItem] = useState<Partial<ReposteriaItem>>({});

  useEffect(() => {
    onDataChange(reposteria);
  }, [reposteria, onDataChange]);

  const fetchCatalogo = useCallback(async () => {
    const todosLosServicios = await getServiciosEmpresa();
    const serviciosDeReposteria = todosLosServicios.filter(
      s => s.categoria === 'Servicio de repostería'
    );
    setCatalogoReposteria(serviciosDeReposteria);
  }, []);

  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);

  const handleCategoryActivation = (categoryId: string, activada: boolean) => {
    setReposteria(prev => ({
      ...prev,
      categorias: prev.categorias.map(c => c.id === categoryId ? { ...c, activada } : c)
    }));
  };
  
  const openItemModal = (category: ReposteriaCategoria, item?: ReposteriaItem) => {
    setEditingCategory(category);
    setCurrentItem(item || { nombre: '', cantidad: 1, unidad: 'unidad', costoEstimado: 0 });
    setIsItemModalOpen(true);
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

    setReposteria(prev => ({
      ...prev,
      categorias: prev.categorias.map(cat => {
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
    }));
    
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
     setReposteria(prev => ({
      ...prev,
      categorias: prev.categorias.map(cat => 
        cat.id === categoryId ? { ...cat, items: cat.items.filter(i => i.id !== itemId) } : cat
      )
    }));
  };
  
  const totalCostoReposteria = useMemo(() => {
    let total = 0;
    reposteria.categorias.forEach(cat => {
      if (isTemplateMode || cat.activada) {
        const itemsDeCatalogo = catalogoReposteria.filter(s => s.subcategoria === cat.nombreDisplay);
        const allItems = [...cat.items, ...itemsDeCatalogo];
        allItems.forEach(item => {
          total += (item.costoEstimado || 0) * (item.cantidad || 1);
        });
      }
    });
    return total;
  }, [reposteria, isTemplateMode, catalogoReposteria]);

  return (
    <>
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Añadir Ítem de Compra para {editingCategory?.nombreDisplay}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label htmlFor="item-nombre-manual">Nombre Ítem</Label><Input id="item-nombre-manual" value={currentItem.nombre || ''} onChange={e => handleItemChange('nombre', e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label htmlFor="item-qty-manual">Cantidad</Label><Input id="item-qty-manual" type="number" value={currentItem.cantidad || 1} onChange={e => handleItemChange('cantidad', e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="item-unit-manual">Unidad</Label><Select value={currentItem.unidad || 'unidad'} onValueChange={v => handleItemChange('unidad', v)}><SelectTrigger id="item-unit-manual"><SelectValue /></SelectTrigger><SelectContent>{ALL_UNIDADES_SERVICIO.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label htmlFor="item-cost-manual">Costo Est.</Label><Input id="item-cost-manual" type="number" value={currentItem.costoEstimado || 0} onChange={e => handleItemChange('costoEstimado', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label htmlFor="item-notes-manual">Notas</Label><Input id="item-notes-manual" value={currentItem.notas || ''} onChange={e => handleItemChange('notas', e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveItem}>Añadir Ítem</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="p-3 bg-primary/10 rounded-lg"><Cake className="w-8 h-8 text-primary" /></div>
          <div>
            <CardTitle className="font-headline text-2xl">Repostería</CardTitle>
            <CardDescription>
              {isTemplateMode ? "Gestiona las opciones de repostería disponibles en el simulador y presupuestos." : "Activa y configura las mesas dulces y postres para el evento."}
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
            {reposteria.categorias.map(cat => {
              const itemsDeCatalogo = catalogoReposteria.filter(s => s.subcategoria === cat.nombreDisplay);
              
              return (
              <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg shadow-sm">
                <div className="flex items-center p-3">
                  <AccordionTrigger className="hover:no-underline flex-1">
                    <span className="font-semibold text-primary">{cat.nombreDisplay}</span>
                  </AccordionTrigger>
                  {!isTemplateMode && (
                    <Switch
                      checked={cat.activada}
                      onCheckedChange={(checked) => handleCategoryActivation(cat.id, checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
                <AccordionContent className="px-4 pb-4 border-t">
                  <div className="space-y-4 pt-3">
                    <p className="text-sm text-muted-foreground">{cat.descripcion}</p>
                    
                    {[...itemsDeCatalogo, ...cat.items].length > 0 ? (
                      <div className="space-y-2">
                          <h4 className="text-sm font-medium">Ítems Incluidos:</h4>
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                              {itemsDeCatalogo.map(item => <li key={item.id}>{item.nombre} - {formatCurrency(item.valorUnitarioEstimado)}</li>)}
                              {cat.items.map(item => (
                                <li key={item.id} className="flex items-center justify-between">
                                  <span>{item.nombre} ({item.cantidad} {item.unidad}) - {formatCurrency(item.costoEstimado)}</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteItem(cat.id, item.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                </li>
                              ))}
                          </ul>
                      </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic text-center py-2">No hay ítems para esta categoría.</p>
                    )}
                    
                    <div className="flex justify-end pt-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => openItemModal(cat)}>
                            <PlusCircle className="w-3 h-3 mr-2"/>Añadir Ítem Manual
                        </Button>
                        <Link href={`/empresa/servicios?categoria=Servicio+de+repostería&subcategoria=${encodeURIComponent(cat.nombreDisplay)}`} passHref>
                           <Button variant="outline" size="sm">
                               <Edit className="w-3 h-3 mr-2" /> Gestionar en Catálogo
                           </Button>
                        </Link>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )})}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
};
