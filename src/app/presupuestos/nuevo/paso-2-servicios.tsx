
'use client';

import type { PresupuestoFormData } from '@/types/presupuesto';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Tag, Search, PackageSearch, Gift, PlusCircle } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from 'next/link';

interface Paso2ServiciosProps {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  serviciosCatalogo: ServicioEmpresa[];
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function Paso2Servicios({ formData, setFormData, serviciosCatalogo }: Paso2ServiciosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoriaServicio>>(new Set());

  const handleServicioToggle = (servicio: ServicioEmpresa) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      if (newSelected.has(servicio.id)) {
        newSelected.delete(servicio.id);
      } else {
        newSelected.set(servicio.id, {
          cantidad: 1, 
          precioUnitarioOriginal: servicio.precioVenta || 0,
          precioUnitarioPresupuesto: servicio.precioVenta || 0,
          nombreServicio: servicio.nombre,
          unidad: servicio.unidad,
          categoriaServicio: servicio.categoria,
          esRegalo: false,
        });
      }
      return { ...prev, serviciosSeleccionados: newSelected };
    });
  };

  const handleServicioDetailChange = (
    servicioId: string,
    field: 'cantidad' | 'precioUnitarioPresupuesto' | 'esRegalo',
    value: string | number | boolean
  ) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      const currentServicio = newSelected.get(servicioId);
      if (currentServicio) {
        let updatedServicio = { ...currentServicio };

        if (field === 'esRegalo') {
          updatedServicio.esRegalo = !!value;
        } else if (field === 'cantidad') {
          const numericValue = Number(value);
          updatedServicio.cantidad = isNaN(numericValue) || numericValue < 1 ? 1 : numericValue;
        } else if (field === 'precioUnitarioPresupuesto') {
          const numericValue = Number(value);
          updatedServicio.precioUnitarioPresupuesto = isNaN(numericValue) || numericValue < 0 ? 0 : numericValue;
          // Desmarcar como regalo si se edita el precio manualmente
          if (updatedServicio.esRegalo && numericValue > 0) {
            updatedServicio.esRegalo = false;
          }
        }
        
        newSelected.set(servicioId, updatedServicio);
      }
      return { ...prev, serviciosSeleccionados: newSelected };
    });
  };
  
  const handleCategoryFilterToggle = (category: CategoriaServicio) => {
    setSelectedCategories(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(category)) newSelected.delete(category);
      else newSelected.add(category);
      return newSelected;
    });
  };

  const filteredServicios = useMemo(() => {
    return serviciosCatalogo.filter(s => {
      const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.subcategoria && s.subcategoria.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(s.categoria);
      return matchesSearch && matchesCategory && s.precioVenta !== undefined && s.precioVenta > 0;
    });
  }, [serviciosCatalogo, searchTerm, selectedCategories]);
  
  const serviciosAgrupados = useMemo(() => {
    return filteredServicios.reduce((acc, servicio) => {
        const categoria = servicio.categoria || 'Otros';
        const subcategoria = servicio.subcategoria || 'General';
        
        if (!acc[categoria]) {
            acc[categoria] = {};
        }
        if (!acc[categoria][subcategoria]) {
            acc[categoria][subcategoria] = [];
        }
        acc[categoria][subcategoria].push(servicio);
        return acc;
    }, {} as Record<string, Record<string, ServicioEmpresa[]>>);
  }, [filteredServicios]);

  const categoriasOrdenadas = useMemo(() => {
    return Object.keys(serviciosAgrupados).sort();
  }, [serviciosAgrupados]);


  const costoTotalServiciosSeleccionados = useMemo(() => {
    let total = 0;
    formData.serviciosSeleccionados.forEach(item => {
      if (!item.esRegalo) {
        total += item.cantidad * item.precioUnitarioPresupuesto;
      }
    });
    return total;
  }, [formData.serviciosSeleccionados]);
  
  const uniqueCategoriesFromCatalog = useMemo(() => {
    const cats = new Set(serviciosCatalogo.filter(s => s.precioVenta !== undefined && s.precioVenta > 0).map(s => s.categoria));
    return Array.from(cats).sort();
  }, [serviciosCatalogo]);


  if (!serviciosCatalogo || serviciosCatalogo.length === 0) {
    return (
      <div className="text-center py-10">
        <PackageSearch className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-lg">No hay servicios definidos en el catálogo.</p>
        <p className="text-sm text-muted-foreground">
          Ve a <Link href="/empresa/todos-los-servicios" className="underline text-primary">Inventario General</Link> para añadir servicios.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-grow space-y-2">
            <Label htmlFor="search-servicios" className="text-base">Buscar Servicio</Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="search-servicios" type="text" placeholder="Nombre, categoría o subcategoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 text-base p-3"/>
            </div>
        </div>
        <div className="space-y-2 sm:w-1/3">
            <Label className="text-base block mb-1.5">Filtrar por Categoría</Label>
            <Accordion type="single" collapsible className="w-full border rounded-md">
              <AccordionItem value="filter-category" className="border-b-0">
                <AccordionTrigger className="px-3 py-2.5 text-sm hover:no-underline h-auto [&[data-state=open]>svg]:text-primary">
                  {selectedCategories.size === 0 ? "Todas las Categorías" : `${selectedCategories.size} Seleccionada(s)`}
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <ScrollArea className="h-auto max-h-48 p-2 border-t">
                  {uniqueCategoriesFromCatalog.length > 0 ? uniqueCategoriesFromCatalog.map(cat => (
                    <div key={cat} className="flex items-center space-x-2 py-1.5 px-1 hover:bg-muted/50 rounded-sm">
                      <Checkbox id={`cat-filter-${cat}`} checked={selectedCategories.has(cat)} onCheckedChange={() => handleCategoryFilterToggle(cat)} />
                      <Label htmlFor={`cat-filter-${cat}`} className="text-sm font-normal cursor-pointer flex-grow">{cat}</Label>
                    </div>
                  )) : <p className="text-xs text-muted-foreground p-2 text-center">No hay categorías con servicios costeables.</p>}
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </div>
      </div>
      <Separator/>
      <p className="text-sm text-muted-foreground">Selecciona servicios del catálogo. Puedes ajustar cantidad y precio para este presupuesto.</p>
      
      <ScrollArea className="h-[450px] pr-1">
        {categoriasOrdenadas.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-2" defaultValue={categoriasOrdenadas}>
            {categoriasOrdenadas.map(categoria => (
              <AccordionItem key={categoria} value={categoria} className="border rounded-md shadow-sm bg-card overflow-hidden">
                <AccordionTrigger className="px-4 py-3 text-md font-medium text-primary hover:bg-muted/30 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary/80" />
                    {categoria}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pt-0 pb-3">
                  <div className="space-y-2 pt-2">
                    {Object.keys(serviciosAgrupados[categoria]).sort().map(subcategoria => (
                      <div key={subcategoria} className="ml-2 pl-3 border-l-2">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">{subcategoria}</h4>
                        <ul className="space-y-3">
                          {serviciosAgrupados[categoria][subcategoria].map(servicio => {
                            const isSelected = formData.serviciosSeleccionados.has(servicio.id);
                            const selectedInfo = formData.serviciosSeleccionados.get(servicio.id);
                            const finalPrice = selectedInfo ? (selectedInfo.esRegalo ? 0 : selectedInfo.cantidad * selectedInfo.precioUnitarioPresupuesto) : 0;
                            return (
                              <li key={servicio.id} className={`p-3 border rounded-md transition-all ${isSelected ? 'bg-primary/10 ring-1 ring-primary/50' : 'bg-muted/20 hover:bg-muted/40'}`}>
                                <div className="flex items-start gap-3">
                                  <Checkbox id={`s-${servicio.id}`} checked={isSelected} onCheckedChange={() => handleServicioToggle(servicio)} className="mt-1 w-5 h-5 shrink-0"/>
                                  <div className="flex-grow">
                                    <Label htmlFor={`s-${servicio.id}`} className="font-medium text-sm cursor-pointer">{servicio.nombre}</Label>
                                    <p className="text-xs text-muted-foreground">
                                      Catálogo: {formatCurrency(servicio.precioVenta)} {servicio.unidad ? `/ ${servicio.unidad.toLowerCase()}` : ''}
                                    </p>
                                  </div>
                                </div>
                                {isSelected && selectedInfo && (
                                  <div className="mt-2 pt-2 border-t border-dashed space-y-2 pl-8">
                                    <div className="grid grid-cols-2 gap-3 items-center">
                                      <div className="space-y-0.5">
                                        <Label htmlFor={`qty-${servicio.id}`} className="text-xs">Cant.</Label>
                                        <Input id={`qty-${servicio.id}`} type="number" value={selectedInfo.cantidad} onChange={(e) => handleServicioDetailChange(servicio.id, 'cantidad', e.target.value)} min="1" className="h-8 text-sm" required />
                                      </div>
                                      <div className="space-y-0.5">
                                        <Label htmlFor={`price-${servicio.id}`} className="text-xs">P.Unit. (Presup.)</Label>
                                        <Input id={`price-${servicio.id}`} type="number" value={selectedInfo.precioUnitarioPresupuesto} onChange={(e) => handleServicioDetailChange(servicio.id, 'precioUnitarioPresupuesto', e.target.value)} min="0" step="any" className="h-8 text-sm" required />
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id={`gift-${servicio.id}`} checked={selectedInfo.esRegalo} onCheckedChange={(checked) => handleServicioDetailChange(servicio.id, 'esRegalo', !!checked)}/>
                                        <Label htmlFor={`gift-${servicio.id}`} className="text-xs font-normal flex items-center gap-1 text-primary"><Gift className="w-3 h-3"/>Marcar como Regalo (Precio = $0)</Label>
                                    </div>
                                    <p className="text-xs font-medium text-right pt-1">Subtotal Servicio: {formatCurrency(finalPrice)}</p>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-10 text-muted-foreground"><Search className="w-12 h-12 mx-auto mb-3 opacity-50"/>No hay servicios que coincidan o con precio de venta para mostrar.</div>
        )}
      </ScrollArea>
      <div className="mt-6 pt-4 border-t">
        <p className="text-xl font-semibold text-right">Costo Total de Servicios Seleccionados: {formatCurrency(costoTotalServiciosSeleccionados)}</p>
      </div>
    </div>
  );
}
