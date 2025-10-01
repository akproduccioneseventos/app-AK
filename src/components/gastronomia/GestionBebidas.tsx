'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { BebidasData, BebidaCategoria, BebidaItem, BebidaReceta, TipoAsistente } from '@/types/fiesta';
import { GlassWater, Edit, Trash2, PlusCircle, Info } from 'lucide-react';
import { defaultBebidasData } from '@/lib/fiesta-defaults';

interface GestionBebidasProps {
  initialData: BebidasData | null;
  onDataChange: (data: BebidasData) => void;
  invitados: { adultos: number; ninos: number; adolescentes: number };
}

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export const GestionBebidas: React.FC<GestionBebidasProps> = ({ initialData, onDataChange, invitados }) => {
  const [bebidas, setBebidas] = useState<BebidasData>(initialData || defaultBebidasData);

  useEffect(() => {
    onDataChange(bebidas);
  }, [bebidas, onDataChange]);

  const handleCategoryActivation = (categoryId: string, activada: boolean) => {
    setBebidas(prev => ({
      ...prev,
      categorias: prev.categorias.map(c => c.id === categoryId ? { ...c, activada } : c)
    }));
  };

  const totalCostoBebidas = useMemo(() => {
    let total = 0;
    bebidas.categorias.forEach(cat => {
      if (cat.activada) {
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
  }, [bebidas, invitados]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <div className="p-3 bg-primary/10 rounded-lg"><GlassWater className="w-8 h-8 text-primary" /></div>
        <div>
          <CardTitle className="font-headline text-2xl">Bebidas</CardTitle>
          <CardDescription>Activa y configura las bebidas para el evento.</CardDescription>
        </div>
        <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">Costo Total Estimado</p>
            <p className="text-xl font-bold">{formatCurrency(totalCostoBebidas)}</p>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-3" defaultValue={bebidas.categorias.filter(c=>c.activada).map(c=>c.id)}>
          {bebidas.categorias.map(cat => (
            <AccordionItem key={cat.id} value={cat.id} className="border rounded-lg shadow-sm">
              <div className="flex items-center p-3">
                <AccordionTrigger className="hover:no-underline flex-1">
                  <span className="font-semibold text-primary">{cat.nombreDisplay}</span>
                </AccordionTrigger>
                <Switch
                  checked={cat.activada}
                  onCheckedChange={(checked) => handleCategoryActivation(cat.id, checked)}
                  onClick={(e) => e.stopPropagation()}
                />
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
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {cat.recetas.map(receta => <li key={receta.id}>{receta.nombre}</li>)}
                        </ul>
                    </div>
                  )}
                   <div className="flex justify-end">
                       <Button variant="outline" size="sm" disabled>
                           <Edit className="w-3 h-3 mr-2" /> Editar Ítems (Próximamente)
                       </Button>
                   </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
