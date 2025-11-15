
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { BebidasData, BebidaCategoria, BebidaItem, BebidaReceta, IngredienteReceta } from '@/types/fiesta';
import { GlassWater, Edit, Trash2, PlusCircle, BookOpen, Search } from 'lucide-react';
import { defaultBebidasData } from '@/lib/fiesta-defaults';
import { useToast } from '@/hooks/use-toast';
import { saveBebidasMasterTemplate } from '@/app/actions/bebidas.actions';
import { getInsumos } from '@/app/actions/insumos';
import type { ServicioEmpresa } from '@/types/empresa';
import { ScrollArea } from '../ui/scroll-area';
import Link from 'next/link';

interface GestionBebidasProps {
  initialData: BebidasData | null;
  onDataChange: (data: BebidasData) => void;
  onSave?: (data: BebidasData) => Promise<any>;
  invitados: { adultos: number; ninos: number; adolescentes: number };
  isTemplateMode?: boolean;
}

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export const GestionBebidas: React.FC<GestionBebidasProps> = ({ initialData, onDataChange, onSave, invitados, isTemplateMode = false }) => {
  const { toast } = useToast();
  const [bebidas, setBebidas] = useState<BebidasData>(initialData || defaultBebidasData);
  const [catalogoInsumos, setCatalogoInsumos] = useState<ServicioEmpresa[]>([]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BebidaCategoria | null>(null);
  
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');

  useEffect(() => {
    if(initialData) {
      setBebidas(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    onDataChange(bebidas);
  }, [bebidas, onDataChange]);

  const fetchCatalogo = useCallback(async () => {
    const todosLosInsumos = await getInsumos();
    setCatalogoInsumos(todosLosInsumos);
  }, []);

  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);


  const handleCategoryActivation = (categoryId: string, activada: boolean) => {
    setBebidas(prev => ({
      ...prev,
      categorias: prev.categorias.map(c => c.id === categoryId ? { ...c, activada } : c)
    }));
  };
  
  const openEditModal = (category: BebidaCategoria) => {
    // Always use the latest data from the main state when opening the modal
    const currentCategoryData = bebidas.categorias.find(c => c.id === category.id);
    setEditingCategory(JSON.parse(JSON.stringify(currentCategoryData || category))); // Deep copy
    setIsEditModalOpen(true);
  };

  const handleItemChange = (itemId: string, field: keyof BebidaItem, value: any) => {
    setEditingCategory(prevCat => {
        if (!prevCat) return null;
        return {
            ...prevCat,
            items: prevCat.items.map(item => {
              if (item.id !== itemId) return item;
              const updatedItem = { ...item, [field]: value };
              if (field === 'cantidadNecesaria' || field === 'costoUnitario') {
                updatedItem.costoTotal = (updatedItem.cantidadNecesaria || 0) * (updatedItem.costoUnitario || 0);
              }
              return updatedItem;
            })
        };
    });
  };

  const addNewItem = () => {
    if (!editingCategory) return;
    const newItem: BebidaItem = {
        id: `beb-item-${Date.now()}`, nombre: 'Nueva Bebida', cantidadNecesaria: 1, unidadCantidad: 'Botellas', costoUnitario: 0, costoTotal: 0
    };
    setEditingCategory(prev => prev ? {...prev, items: [...prev.items, newItem]} : null);
  };
  
  const addFromCatalog = (insumo: ServicioEmpresa) => {
      if (!editingCategory) return;
      const newItem: BebidaItem = {
        id: `beb-item-cat-${insumo.id}-${Date.now()}`,
        origenId: insumo.id,
        nombre: insumo.nombre,
        cantidadNecesaria: 1,
        unidadCantidad: insumo.unidad || 'unidad',
        costoUnitario: insumo.valorUnitarioEstimado || 0,
        costoTotal: (insumo.valorUnitarioEstimado || 0) * 1,
        proveedorHabitual: insumo.proveedor || ''
      };
      setEditingCategory(prev => prev ? { ...prev, items: [...prev.items, newItem] } : null);
      toast({ description: `"${insumo.nombre}" añadido a ${editingCategory.nombreDisplay}.` });
  };

  const deleteItem = (itemId: string) => {
     if (!editingCategory) return;
     setEditingCategory(prev => prev ? {...prev, items: prev.items.filter(item => item.id !== itemId)} : null);
  };

  const handleSaveEdits = async () => {
    if (!editingCategory) return;
    const newBebidasData = {
      ...bebidas,
      categorias: bebidas.categorias.map(c => c.id === editingCategory.id ? editingCategory : c)
    };
    setBebidas(newBebidasData);
    setIsEditModalOpen(false);

    if(onSave) {
        await onSave(newBebidasData);
    }
    toast({title: "Cambios en Bebidas Guardados", description: `Se actualizaron los ítems de ${editingCategory.nombreDisplay}.`});
  };

  const totalCostoBebidas = useMemo(() => {
    let total = 0;
    bebidas.categorias.forEach(cat => {
      if (isTemplateMode || cat.activada) {
        cat.items.forEach(item => {
          total += item.costoTotal || ((item.costoUnitario || 0) * (item.cantidadNecesaria || 0));
        });
        cat.recetas?.forEach(receta => {
            const factorEscala = (invitados.adultos + invitados.adolescentes + invitados.ninos) / (receta.porcionesBase || 1);
            total += (receta.costoTotalReceta || 0) * (isNaN(factorEscala) ? 0 : factorEscala);
        });
      }
    });
    return total;
  }, [bebidas, invitados, isTemplateMode]);
  
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
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Editar Plantilla de Compra: {editingCategory?.nombreDisplay}</DialogTitle><DialogDescription>Añade, edita o elimina los ítems de compra directa para esta categoría.</DialogDescription></DialogHeader>
          <div className="py-2">
            <Button size="sm" variant="outline" onClick={() => setIsCatalogModalOpen(true)}><BookOpen className="w-4 h-4 mr-2"/>Añadir desde Catálogo</Button>
          </div>
          <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-3 p-1">
            {editingCategory?.items.map(item => (
              <div key={item.id} className="p-3 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                <div className="space-y-1 md:col-span-3"><Label htmlFor={`beb-name-${item.id}`}>Nombre</Label><Input id={`beb-name-${item.id}`} value={item.nombre} onChange={(e) => handleItemChange(item.id, 'nombre', e.target.value)} disabled={!!item.origenId}/></div>
                <div className="space-y-1"><Label htmlFor={`beb-qty-${item.id}`}>Cantidad</Label><Input id={`beb-qty-${item.id}`} type="number" value={item.cantidadNecesaria || ''} onChange={(e) => handleItemChange(item.id, 'cantidadNecesaria', Number(e.target.value))} /></div>
                <div className="space-y-1"><Label htmlFor={`beb-unit-${item.id}`}>Unidad</Label><Input id={`beb-unit-${item.id}`} value={item.unidadCantidad || ''} onChange={(e) => handleItemChange(item.id, 'unidadCantidad', e.target.value)} disabled={!!item.origenId}/></div>
                <div className="space-y-1 relative"><Label htmlFor={`beb-cost-${item.id}`}>Costo Unitario</Label><Input id={`beb-cost-${item.id}`} type="number" value={item.costoUnitario || ''} onChange={(e) => handleItemChange(item.id, 'costoUnitario', Number(e.target.value))} className="pl-6" disabled={!!item.origenId}/><span className="absolute left-2 top-1/2 mt-1 text-muted-foreground">$</span></div>
                <Button variant="ghost" size="icon" className="text-destructive self-end" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
              </div>
            ))}
             <Button variant="outline" size="sm" onClick={addNewItem} className="mt-3"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Ítem Manual</Button>
          </div>
          </ScrollArea>
          <DialogFooter><DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose><Button onClick={handleSaveEdits}>Guardar Cambios</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Seleccionar del Catálogo de Insumos</DialogTitle><DialogDescription>Añadiendo a: {editingCategory?.nombreDisplay}</DialogDescription></DialogHeader>
            <div className="py-2 space-y-2">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input placeholder="Buscar insumo..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="pl-9"/></div>
                <ScrollArea className="h-64 border rounded-md p-1"><ul className="space-y-1">{filteredInsumos.map(insumo => (<li key={insumo.id}><Button type="button" variant="ghost" className="w-full justify-start text-left h-auto" onClick={() => { addFromCatalog(insumo); setIsCatalogModalOpen(false); }}><div><p className="font-medium text-sm">{insumo.nombre}</p><p className="text-xs text-muted-foreground">{formatCurrency(insumo.valorUnitarioEstimado)} / {insumo.unidad}</p></div></Button></li>))}</ul></ScrollArea>
            </div>
             <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="shadow-lg">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="p-3 bg-primary/10 rounded-lg"><GlassWater className="w-8 h-8 text-primary" /></div>
          <div>
            <CardTitle className="font-headline text-2xl">Bebidas</CardTitle>
            <CardDescription>
              {isTemplateMode ? "Define los ítems base y recetas para cada categoría de bebidas." : "Activa y configura las bebidas para el evento."}
            </CardDescription>
          </div>
          {!isTemplateMode && (
            <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Costo Total Estimado</p>
                <p className="text-xl font-bold">{formatCurrency(totalCostoBebidas)}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-3" defaultValue={isTemplateMode ? bebidas.categorias.map(c => c.id) : bebidas.categorias.filter(c=>c.activada).map(c=>c.id)}>
            {bebidas.categorias.map(cat => (
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
                    
                    {cat.items.length > 0 && (
                      <div className="space-y-2">
                          <h4 className="text-sm font-medium">Ítems de Compra Directa:</h4>
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                              {cat.items.map(item => <li key={item.id}>{item.nombre} ({item.cantidadNecesaria} {item.unidadCantidad})</li>)}
                          </ul>
                      </div>
                    )}
                    
                    {cat.recetas && cat.recetas.length > 0 && (
                       <div className="space-y-2">
                          <h4 className="text-sm font-medium">Recetas / Preparaciones:</h4>
                          {cat.recetas.map(receta => (
                            <div key={receta.id} className="pl-4">
                              <p className="font-medium text-sm text-foreground">{receta.nombre}</p>
                              {isTemplateMode && (
                                <ul className="list-disc pl-5 text-xs text-muted-foreground">
                                    {receta.ingredientes?.map(ing => (
                                    <li key={ing.id}>{ing.nombreInsumo}: {ing.cantidad} {ing.unidad}</li>
                                    ))}
                                </ul>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(cat)}>
                          <Edit className="w-3 h-3 mr-2" /> Editar Ítems de Compra
                      </Button>
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
