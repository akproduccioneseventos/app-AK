'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Gift, PlusCircle, Trash2, Loader2, Save, Edit3, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { GiftItem } from '@/types/fiesta';
import { getFiestaActual, updateGiftRegistry } from '@/app/actions/fiesta-actual';
import NextImage from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ListaRegalosPage() {
  const { toast } = useToast();
  const [giftList, setGiftList] = useState<GiftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<GiftItem>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaActual();
      setGiftList(fiestaData.webPageSettings?.giftRegistry || []);
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo cargar la lista de regalos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openItemModal = (item?: GiftItem) => {
    setCurrentItem(item || { name: '', description: '', imageUrl: '', isClaimed: false });
    setIsItemModalOpen(true);
  };
  
  const handleItemModalChange = (field: keyof GiftItem, value: string) => {
    setCurrentItem(prev => (prev ? { ...prev, [field]: value } : {}));
  };
  
  const handleItemModalSave = () => {
    if (!currentItem || !currentItem.name?.trim()) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }
    setGiftList(prev => {
      if (currentItem.id) {
        // Edit existing
        return prev.map(item => item.id === currentItem.id ? (currentItem as GiftItem) : item);
      } else {
        // Add new
        return [...prev, { ...currentItem, id: `gift_${Date.now()}`, isClaimed: false } as GiftItem];
      }
    });
    setIsItemModalOpen(false);
  };
  
  const handleDeleteItem = (itemId: string) => {
    setGiftList(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSaveList = async () => {
    setIsSaving(true);
    const result = await updateGiftRegistry(giftList);
    if (result.success) {
      toast({ title: "¡Lista Guardada!", description: "La lista de regalos se ha actualizado." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Añadir'} Regalo</DialogTitle></DialogHeader>
            {currentItem && (
                <div className="space-y-3 py-2">
                    <div className="space-y-1"><Label htmlFor="item-name">Nombre del Regalo *</Label><Input id="item-name" value={currentItem.name || ''} onChange={(e) => handleItemModalChange('name', e.target.value)} required /></div>
                    <div className="space-y-1"><Label htmlFor="item-desc">Descripción (Opcional)</Label><Textarea id="item-desc" value={currentItem.description || ''} onChange={(e) => handleItemModalChange('description', e.target.value)} rows={2}/></div>
                    <div className="space-y-1"><Label htmlFor="item-img-url">URL Imagen (Opcional)</Label><Input id="item-img-url" value={currentItem.imageUrl || ''} onChange={(e) => handleItemModalChange('imageUrl', e.target.value)} placeholder="https://ejemplo.com/regalo.jpg"/></div>
                </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancelar</Button><Button onClick={handleItemModalSave}>Guardar Regalo</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Lista de Regalos</h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Lista</CardTitle>
          <CardDescription>Añade, edita o elimina los regalos que te gustaría recibir. Los invitados podrán ver esta lista y marcar los que elijan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => openItemModal()}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Regalo</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Regalos en la Lista ({giftList.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto"/> :
           giftList.length > 0 ? (
            <ScrollArea className="h-auto max-h-[500px] pr-2">
              <div className="space-y-3">
                {giftList.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-md">
                    {item.imageUrl && <NextImage src={item.imageUrl} alt={item.name} width={60} height={60} className="rounded-md object-cover" data-ai-hint="gift wishlist"/>}
                    <div className="flex-grow">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      {item.isClaimed && <p className="text-xs font-bold text-green-600 flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3"/> Elegido por: {item.claimedBy}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openItemModal(item)} disabled={item.isClaimed}><Edit3 className="w-4 h-4"/></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
           ) : <p className="text-muted-foreground text-center py-4">No hay regalos en la lista.</p>}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={handleSaveList} disabled={isSaving}><Save className="w-4 h-4 mr-2"/>{isSaving ? 'Guardando...' : 'Guardar Cambios en la Lista'}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
