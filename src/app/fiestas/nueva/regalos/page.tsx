'use client';

import React, { useState, useEffect, useCallback, type FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Gift, Save, Loader2, PlusCircle, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updateGiftRegistry } from '@/app/actions/fiesta/regalos.actions';
import type { FiestaEnPlanificacion, GiftItem } from '@/types/fiesta';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { defaultGiftItems } from '@/lib/fiesta-defaults';

function GiftRegistryPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [giftList, setGiftList] = useState<GiftItem[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<GiftItem> | null>(null);
  
  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      let currentGiftList = fiestaData?.invitacionDigital?.regalos?.items || [];

      // If the list is empty, populate with defaults
      if (currentGiftList.length === 0) {
        currentGiftList = defaultGiftItems.map(item => ({
          ...item,
          id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          isClaimed: false,
        }));
      }
      setGiftList(currentGiftList);
    } catch (e) {
      toast({ title: "Error", description: "No se pudo cargar la lista de regalos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openItemModal = (item?: GiftItem) => {
    setCurrentItem(item ? { ...item } : { name: '', description: '', imageUrl: '', isClaimed: false });
    setIsModalOpen(true);
  };
  
  const handleItemChange = (field: keyof GiftItem, value: any) => {
    setCurrentItem(prev => (prev ? { ...prev, [field]: value } : null));
  };
  
  const handleSaveItem = () => {
    if (!currentItem || !currentItem.name?.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" });
      return;
    }
    const finalItem: GiftItem = {
      ...currentItem,
      id: currentItem.id || `gift_${Date.now()}`,
      name: currentItem.name.trim(),
    } as GiftItem;

    setGiftList(prev => {
      const existingIndex = prev.findIndex(i => i.id === finalItem.id);
      if (existingIndex > -1) {
        const newList = [...prev];
        newList[existingIndex] = finalItem;
        return newList;
      } else {
        return [...prev, finalItem];
      }
    });
    setIsModalOpen(false);
  };
  
  const handleDeleteItem = (itemId: string) => {
    setGiftList(prev => prev.filter(i => i.id !== itemId));
  };

  const handleSaveChanges = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateGiftRegistry(fiestaId, giftList);
      if (result.success) {
        toast({ title: "¡Lista de Regalos Guardada!" });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentItem?.id ? 'Editar' : 'Añadir'} Regalo</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label htmlFor="item-name">Nombre del Regalo *</Label><Input id="item-name" value={currentItem?.name || ''} onChange={e => handleItemChange('name', e.target.value)} required /></div>
            <div className="space-y-1"><Label htmlFor="item-desc">Descripción (Opcional)</Label><Textarea id="item-desc" value={currentItem?.description || ''} onChange={e => handleItemChange('description', e.target.value)} rows={2}/></div>
            <div className="space-y-1"><Label htmlFor="item-img">URL de Imagen (Opcional)</Label><Input id="item-img" value={currentItem?.imageUrl || ''} onChange={e => handleItemChange('imageUrl', e.target.value)} placeholder="https://ejemplo.com/foto.jpg"/></div>
             {currentItem?.imageUrl && <NextImage src={currentItem.imageUrl} alt="preview" width={100} height={100} className="rounded-md border object-contain"/>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveItem}>Guardar Regalo</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Gift className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Regalos</h1></div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button></Link>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Gestionar Lista de Regalos</CardTitle>
          <CardDescription>Añade, edita o elimina los ítems que tus invitados podrán ver en la página del evento. Los regalos marcados como "reclamados" no pueden desmarcarse desde aquí.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button onClick={() => openItemModal()}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Regalo</Button>
           <div className="space-y-3">
            {giftList.length > 0 ? (
                giftList.map(item => (
                    <Card key={item.id} className="p-3">
                       <div className="flex justify-between items-start gap-3">
                        <div className="flex items-start gap-3">
                          {item.imageUrl && <div className="relative w-16 h-16 rounded-md border overflow-hidden flex-shrink-0"><NextImage src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover"/></div>}
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                             {item.isClaimed && <p className="text-xs font-semibold text-green-600">Reclamado por: {item.claimedBy}</p>}
                          </div>
                        </div>
                         <div className="flex-shrink-0 flex gap-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openItemModal(item)} disabled={item.isClaimed}><Edit className="w-4 h-4"/></Button>
                             <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
                         </div>
                       </div>
                    </Card>
                ))
            ) : <p className="text-center text-muted-foreground py-4">Aún no has añadido ningún regalo a la lista.</p>}
           </div>
        </CardContent>
         <CardFooter className="border-t pt-4">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
            Guardar Cambios en la Lista
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegalosPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <GiftRegistryPageContent />
        </Suspense>
    );
}
