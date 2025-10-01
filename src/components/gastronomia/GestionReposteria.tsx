'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ReposteriaData } from '@/types/fiesta';
import { Cake, Edit } from 'lucide-react';
import { defaultReposteriaData } from '@/lib/fiesta-defaults';

interface GestionReposteriaProps {
  initialData: ReposteriaData | null;
  onDataChange: (data: ReposteriaData) => void;
  invitados: { adultos: number; ninos: number; adolescentes: number };
}

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export const GestionReposteria: React.FC<GestionReposteriaProps> = ({ initialData, onDataChange, invitados }) => {
  const [reposteria, setReposteria] = useState<ReposteriaData>(initialData || defaultReposteriaData);

  useEffect(() => {
    onDataChange(reposteria);
  }, [reposteria, onDataChange]);

  const handleCategoryActivation = (categoryId: string, activada: boolean) => {
    setReposteria(prev => ({
      ...prev,
      categorias: prev.categorias.map(c => c.id === categoryId ? { ...c, activada } : c)
    }));
  };

  const totalCostoReposteria = useMemo(() => {
    let total = 0;
    reposteria.categorias.forEach(cat => {
      if (cat.activada) {
        cat.items.forEach(item => {
          total += (item.costoEstimado || 0) * (item.cantidad || 1);
        });
      }
    });
    return total;
  }, [reposteria]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <div className="p-3 bg-primary/10 rounded-lg"><Cake className="w-8 h-8 text-primary" /></div>
        <div>
          <CardTitle className="font-headline text-2xl">Repostería</CardTitle>
          <CardDescription>Activa y configura las mesas dulces y postres.</CardDescription>
        </div>
        <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">Costo Total Estimado</p>
            <p className="text-xl font-bold">{formatCurrency(totalCostoReposteria)}</p>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-3" defaultValue={reposteria.categorias.filter(c=>c.activada).map(c=>c.id)}>
          {reposteria.categorias.map(cat => (
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
                        <h4 className="text-sm font-medium">Ítems Sugeridos:</h4>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {cat.items.map(item => <li key={item.id}>{item.nombre} ({item.cantidad} {item.unidad})</li>)}
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
