'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, GlassWater, Loader2, PlusCircle, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Trago } from '@/types/fiesta';
import { getCartaTragosMaster, saveCartaTragosMaster } from '@/app/actions/carta-tragos-master.actions';

export default function TragosMasterPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Trago[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await getCartaTragosMaster());
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateItem = (id: string, patch: Partial<Trago>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    const id = `trago_master_${Date.now()}`;
    setItems((prev) => [...prev, { id, nombre: 'Nuevo Trago', imageUrl: '', ingredientes: [], stockDisponible: 0 }]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveCartaTragosMaster(items);
    setIsSaving(false);
    if (result.success) {
      toast({ title: 'Catálogo guardado' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GlassWater className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-black">Módulo General de Tragos</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Sincroniza con la carta de tragos de cada fiesta</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={addItem} variant="outline"><PlusCircle className="w-4 h-4 mr-2" />Agregar</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Guardar</Button>
          <Link href="/empresa/menus"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{item.nombre}</CardTitle>
              <CardDescription>Foto, ingredientes y stock base para todos los eventos</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={item.nombre} onChange={(e) => updateItem(item.id, { nombre: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Foto (URL)</Label>
                <Input value={item.imageUrl || ''} onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Ingredientes (coma)</Label>
                <Input value={(item.ingredientes || []).join(', ')} onChange={(e) => updateItem(item.id, { ingredientes: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} />
              </div>
              <div className="space-y-1">
                <Label>Stock base</Label>
                <div className="flex gap-2">
                  <Input type="number" value={item.stockDisponible ?? 0} onChange={(e) => updateItem(item.id, { stockDisponible: Number(e.target.value) || 0 })} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

