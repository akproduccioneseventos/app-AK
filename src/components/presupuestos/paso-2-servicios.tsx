
'use client';

import type { PresupuestoFormData } from '@/types/presupuesto';
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio } from '@/types/empresa';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Tag, Search, PackageSearch } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useMemo, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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

  const handleServicioToggle = (servicioId: string, servicioInfo: { nombreServicio: string, precioUnitarioOriginal: number, unidad?: UnidadServicio, categoriaServicio?: CategoriaServicio }) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      if (newSelected.has(servicioId)) {
        newSelected.delete(servicioId);
      } else {
        newSelected.set(servicioId, {
          cantidad: 1, 
          precioUnitarioOriginal: servicioInfo.precioUnitarioOriginal,
          precioUnitarioPresupuesto: servicioInfo.precioUnitarioOriginal,
          nombreServicio: servicioInfo.nombreServicio,
          unidad: servicioInfo.unidad,
          categoriaServicio: servicioInfo.categoriaServicio,
        });
      }
      return { ...prev, serviciosSeleccionados: newSelected };
    });
  };

  const handleServicioDetailChange = (
    servicioId: string,
    field: 'cantidad' | 'precioUnitarioPresupuesto',
    value: string | number
  ) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      const currentServicio = newSelected.get(servicioId);
      if (currentServicio) {
        let numericValue = Number(value);
        if (field === 'cantidad') {
            numericValue = Math.max(1, Math.floor(numericValue)); // Ensure quantity is at least 1 and an integer
        } else if (field === 'precioUnitarioPresupuesto') {
            numericValue = Math.max(0, numericValue); // Ensure price is not negative
        }
        newSelected.set(servicioId, {
          ...currentServicio,
          [field]: isNaN(numericValue) ? (field === 'cantidad' ? 1 : 0) : numericValue,
        });
      }
      return { ...prev, serviciosSeleccionados: newSelected };
    });
  };
  
  const handleCategoryFilterToggle = (category: CategoriaServicio) => {
    setSelectedCategories(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(category)) {
        newSelected.delete(category);
      } else {
        newSelected.add(category);
      }
      return newSelected;
    });
  };

  const filteredServicios = useMemo(() => {
    return serviciosCatalogo.filter(s => {
      const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.categoria.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(s.categoria);
      return matchesSearch && matchesCategory && s.precioVenta !== undefined && s.precioVenta > 0; // Only show items with a sale price > 0
    });
  }, [serviciosCatalogo, searchTerm, selectedCategories]);

  const costoTotalServiciosSeleccionados = useMemo(() => {
    let total = 0;
    formData.serviciosSeleccionados.forEach(item => {
      total += item.cantidad * item.precioUnitarioPresupuesto;
    });
    return total;
  }, [formData.serviciosSeleccionados]);
  
  const uniqueCategories = useMemo(() => {
    // Filter categories to only include those from services with a sale price
    const cats = new Set(
        serviciosCatalogo
        .filter(s => s.precioVenta !== undefined && s.precioVenta > 0)
        .map(s => s.categoria)
    );
    return Array.from(cats).sort();
  }, [serviciosCatalogo]);


  if (!serviciosCatalogo || serviciosCatalogo.length === 0) {
    return (
        <div className="text-center py-10">
            <PackageSearch className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">No hay servicios definidos en el catálogo general de la empresa.</p>
            <p className="text-sm text-muted-foreground">
                Por favor, ve a <Link href="/empresa/todos-los-servicios" className="underline text-primary">Inventario General</Link> para añadir servicios.
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
                <Input
                id="search-servicios"
                type="text"
                placeholder="Buscar por nombre o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 text-base p-3"
                />
            </div>
        </div>
        <div className="space-y-2 sm:w-1/3">
            <Label className="text-base block mb-1.5">Filtrar por Categoría</Label>
            <Accordion type="single" collapsible className="w-full border rounded-md">
              <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="px-3 py-2.5 text-sm hover:no-underline h-auto [&[data-state=open]>svg]:text-primary">
                  {selectedCategories.size === 0 ? "Todas las Categorías" : `${selectedCategories.size} Categoría(s) Seleccionada(s)`}
                </AccordionTrigger>
                <AccordionContent className="p-0">
                    <ScrollArea className="h-auto max-h-48 p-2 border-t">
                        {uniqueCategories.length > 0 ? uniqueCategories.map(cat => (
                            <div key={cat} className="flex items-center space-x-2 py-1.5 px-1 hover:bg-muted/50 rounded-sm">
                                <Checkbox id={`cat-${cat}`} checked={selectedCategories.has(cat)} onCheckedChange={() => handleCategoryFilterToggle(cat)} />
                                <Label htmlFor={`cat-${cat}`} className="text-sm font-normal cursor-pointer flex-grow">{cat}</Label>
                            </div>
                        )) : <p className="text-xs text-muted-foreground p-2 text-center">No hay categorías con servicios costeables.</p>}
                    </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </div>
      </div>

      <Separator/>

      <Label className="text-xl font-semibold">Servicios Disponibles del Catálogo</Label>
      <p className="text-sm text-muted-foreground">
        Selecciona los servicios de tu empresa para incluirlos en el presupuesto.
        Puedes ajustar la cantidad y el precio unitario para este presupuesto específico si es necesario. Solo se muestran servicios con precio de venta definido.
      </p>
      <ScrollArea className="h-[450px] pr-4 border rounded-md p-1">
        {filteredServicios.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
            {filteredServicios.map((servicio) => {
                const isSelected = formData.serviciosSeleccionados.has(servicio.id);
                const selectedInfo = formData.serviciosSeleccionados.get(servicio.id);
                return (
                <Card key={servicio.id} className={`transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'border-border'}`}>
                    <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-md font-medium">{servicio.nombre}</CardTitle>
                        <Checkbox
                        id={`servicio-check-${servicio.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleServicioToggle(servicio.id, {
                            nombreServicio: servicio.nombre,
                            precioUnitarioOriginal: servicio.precioVenta || 0, // Default to 0 if undefined
                            unidad: servicio.unidad,
                            categoriaServicio: servicio.categoria
                        })}
                        className="w-5 h-5 flex-shrink-0 ml-2 mt-0.5"
                        />
                    </div>
                    <Badge variant="outline" className="text-xs">{servicio.categoria}</Badge>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Precio Catálogo: {formatCurrency(servicio.precioVenta)} {servicio.unidad ? `por ${servicio.unidad.toLowerCase()}` : ''}
                    </p>
                    {isSelected && selectedInfo && (
                        <div className="space-y-2 pt-2 border-t mt-2">
                        <div className="grid grid-cols-2 gap-2 items-center">
                            <div className="space-y-0.5">
                            <Label htmlFor={`qty-${servicio.id}`} className="text-xs">Cantidad</Label>
                            <Input
                                id={`qty-${servicio.id}`}
                                type="number"
                                value={selectedInfo.cantidad}
                                onChange={(e) => handleServicioDetailChange(servicio.id, 'cantidad', e.target.value)}
                                min="1"
                                className="h-8 text-sm"
                            />
                            </div>
                            <div className="space-y-0.5">
                            <Label htmlFor={`price-${servicio.id}`} className="text-xs">Precio Unit. (Presupuesto)</Label>
                            <Input
                                id={`price-${servicio.id}`}
                                type="number"
                                value={selectedInfo.precioUnitarioPresupuesto}
                                onChange={(e) => handleServicioDetailChange(servicio.id, 'precioUnitarioPresupuesto', e.target.value)}
                                min="0"
                                step="any"
                                className="h-8 text-sm"
                            />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-right">
                            Subtotal Ítem: {formatCurrency(selectedInfo.cantidad * selectedInfo.precioUnitarioPresupuesto)}
                        </p>
                        </div>
                    )}
                    </CardContent>
                </Card>
                );
            })}
            </div>
        ) : (
            <div className="text-center py-10 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50"/>
                No se encontraron servicios con los filtros actuales o que tengan un precio de venta definido.
            </div>
        )}
      </ScrollArea>
      <div className="mt-6 pt-4 border-t">
        <p className="text-xl font-semibold text-right">
          Costo Total de Servicios Seleccionados: {formatCurrency(costoTotalServiciosSeleccionados)}
        </p>
      </div>
    </div>
  );
}
