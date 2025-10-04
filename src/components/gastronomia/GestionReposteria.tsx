
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getServiciosEmpresa, saveServicioEmpresa } from '@/app/actions/servicios-empresa'; // Importar servicios

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

  useEffect(() => {
    onDataChange(reposteria);
  }, [reposteria, onDataChange]);

  useEffect(() => {
    // Cargar los servicios de repostería desde el catálogo principal
    const fetchCatalogo = async () => {
      const todosLosServicios = await getServiciosEmpresa();
      const serviciosDeReposteria = todosLosServicios.filter(
        s => s.categoria === 'Servicio de repostería'
      );
      setCatalogoReposteria(serviciosDeReposteria);
      
      // Sincronizar los items de la categoría con los del catálogo
      setReposteria(prev => {
        const newCategorias = (prev.categorias || []).map(cat => {
            const itemsFromCatalog = serviciosDeReposteria
                .filter(s => s.subcategoria === cat.nombreDisplay)
                .map(s => ({
                    id: s.id,
                    nombre: s.nombre,
                    costoEstimado: s.valorUnitarioEstimado || 0,
                    precioSugerido: s.precioVenta || s.precioPorPersona || s.precioBase || 0,
                    unidad: s.unidad || 'unidad',
                    cantidad: 1, // Default quantity
                }));

            // Merge with existing items to preserve quantity/other settings if needed
            const existingItemsMap = new Map(cat.items.map(item => [item.id, item]));
            const mergedItems = itemsFromCatalog.map(item => ({
                ...item,
                ...existingItemsMap.get(item.id),
            }));

            return { ...cat, items: mergedItems };
        });
        return { ...prev, categorias: newCategorias };
      });
    };
    fetchCatalogo();
  }, []);

  const handleCategoryActivation = (categoryId: string, activada: boolean) => {
    setReposteria(prev => ({
      ...prev,
      categorias: prev.categorias.map(c => c.id === categoryId ? { ...c, activada } : c)
    }));
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

  return (
    <>
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
              // Now items come from the main catalog
              const itemsDeCategoria = catalogoReposteria.filter(s => s.subcategoria === cat.nombreDisplay);
              
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
                    {itemsDeCategoria.length > 0 ? (
                      <div className="space-y-2">
                          <h4 className="text-sm font-medium">Ítems Disponibles en Catálogo:</h4>
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                              {itemsDeCategoria.map(item => <li key={item.id}>{item.nombre} - {formatCurrency(item.valorUnitarioEstimado)}</li>)}
                          </ul>
                      </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic text-center py-2">No hay ítems en el catálogo para esta categoría.</p>
                    )}
                    {isTemplateMode && (
                      <div className="flex justify-end pt-2">
                        <Link href="/empresa/servicios">
                           <Button variant="outline" size="sm">
                               <Edit className="w-3 h-3 mr-2" /> Gestionar en Catálogo
                           </Button>
                        </Link>
                      </div>
                    )}
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
