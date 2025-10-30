
'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Save, Loader2, Edit, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CartaTragosData, Trago } from '@/types/fiesta';
import { getFiestaById, updateCartaTragos as updateCartaTragosAction } from '@/app/actions/fiesta/fiesta.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import { CartaTragosMenu } from '@/components/invitacion/templates/CartaTragosMenu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import NextImage from 'next/image';

function CartaTragosContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const router = useRouter();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cartaTragos, setCartaTragos] = useState<CartaTragosData>(defaultCartaTragosData);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Trago | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      toast({ title: "Error", description: "No se encontró ID de evento.", variant: "destructive" });
      router.push('/eventos');
      return;
    }
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      setFiesta(fiestaData);
      
      const mergedData = { ...defaultCartaTragosData, ...(fiestaData.cartaTragos || {}) };
      if (!mergedData.protagonistaNombre) mergedData.protagonistaNombre = fiestaData.configuracion.protagonista1Nombre || 'La Agasajada';
      if (!mergedData.titulo) mergedData.titulo = 'CARTA DE TRAGOS';
      if (!mergedData.numeroPrincipal) mergedData.numeroPrincipal = fiestaData.configuracion.tipoCelebracion === 'XV años' ? 'Mis XV' : 'Nuestra Boda';
      
      setCartaTragos(mergedData);

    } catch (e: any) {
      setError("No se pudo cargar la información del evento.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = (field: keyof CartaTragosData, value: any) => {
    setCartaTragos(prev => ({ ...prev, [field]: value }));
  };
  
  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    setCartaTragos(prev => ({
        ...prev,
        paletaColores: {
            ...(prev.paletaColores || { primary: '#9333ea', secondary: '#363636', accent: '#ffffff' }),
            [colorType]: value,
        }
    }));
  };

  const handleProtagonistPhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiestaId, file);
      if (result.success && result.url) {
        setCartaTragos(prev => ({ ...prev, protagonistaFotoUrl: result.url }));
        toast({ title: "Foto actualizada" });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al subir foto", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackgroundImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fiestaId) return;
    setIsUploading(true);
    try {
      const result = await uploadPublicPageAsset(fiestaId, file);
      if (result.success && result.url) {
        setCartaTragos(prev => ({ ...prev, backgroundImageUrl: result.url }));
        toast({ title: "Imagen de fondo actualizada" });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al subir foto de fondo", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateCartaTragosAction(fiestaId, cartaTragos);
      if (result.success) {
        toast({ title: "Guardado!", description: "La carta de tragos ha sido actualizada." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  const handlePrint = () => window.print();

  const openEditModal = (item: Trago) => {
    setEditingItem(item);
    setPreviewUrl(item.imageUrl);
    setFileToUpload(null);
    setIsEditModalOpen(true);
  };
  
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    let finalImageUrl = editingItem.imageUrl;
    let finalItem = { ...editingItem };

    if (fileToUpload) {
      if (!fiestaId) {
        toast({ title: "Error", description: "ID de fiesta no encontrado para subir imagen.", variant: "destructive" });
        return;
      }
      setIsUploading(true);
      try {
        const result = await uploadPublicPageAsset(fiestaId, fileToUpload);
        if(result.success && result.url) {
          finalImageUrl = result.url;
        } else {
          throw new Error(result.error);
        }
      } catch (e: any) {
        toast({ title: "Error al subir", description: e.message, variant: "destructive" });
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    finalItem.imageUrl = finalImageUrl;
    
    setCartaTragos(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === finalItem.id ? finalItem : item
      ),
    }));
    
    setIsEditModalOpen(false);
    setEditingItem(null);
    setFileToUpload(null);
    setPreviewUrl(null);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEmpresaUpdate = (field: keyof NonNullable<CartaTragosData['empresa']>, value: string) => {
    setCartaTragos(prev => ({...prev, empresa: { ...(prev.empresa || defaultCartaTragosData.empresa), [field]: value } }));
  };

  if (isLoading || !fiesta) {
    return <div className="p-8 max-w-4xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-8 max-w-4xl mx-auto text-center">{error}</div>;
  }
  
  return (
    <div className="bg-gray-100 print:bg-white">
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Trago</DialogTitle>
                </DialogHeader>
                {editingItem && (
                    <form onSubmit={handleUpdateItem} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="item-name">Nombre del Trago</Label>
                            <Input id="item-name" value={editingItem.nombre} onChange={e => setEditingItem(prev => prev ? {...prev, nombre: e.target.value} : null)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="item-image-upload">Cambiar Imagen</Label>
                            {previewUrl && <NextImage src={previewUrl} alt="Preview" width={100} height={150} className="rounded-md border object-cover" />}
                            <Input id="item-image-upload" type="file" accept="image/*" onChange={handleFileChange} />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="item-ai-hint">AI Hint (para futuras funciones)</Label>
                            <Input id="item-ai-hint" value={editingItem.aiHint || ''} onChange={e => setEditingItem(prev => prev ? {...prev, aiHint: e.target.value} : null)} placeholder="Ej: pink cocktail with lime"/>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={isUploading}>{isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Guardar Trago</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
        <div className="py-2 px-4 print:hidden flex flex-col md:flex-row justify-between items-center gap-4 bg-white shadow-sm sticky top-0 z-50">
            <h1 className="font-headline text-lg">Editor de Carta de Tragos</h1>
            <div className="flex flex-wrap gap-2 items-center">
                <div className="space-y-1"><Label htmlFor="protagonista-foto" className="text-xs">Foto Protagonista</Label><Input id="protagonista-foto" type="file" accept="image/*" onChange={handleProtagonistPhotoUpload} className="text-xs w-48" disabled={isUploading}/></div>
                <div className="space-y-1"><Label htmlFor="titulo-numero" className="text-xs">Título/Número</Label><Input id="titulo-numero" value={cartaTragos.numeroPrincipal || ''} onChange={(e) => handleUpdate('numeroPrincipal', e.target.value)} className="h-9 w-24"/></div>
                <div className="space-y-1"><Label htmlFor="protagonista-nombre" className="text-xs">Nombre Protagonista</Label><Input id="protagonista-nombre" value={cartaTragos.protagonistaNombre || ''} onChange={(e) => handleUpdate('protagonistaNombre', e.target.value)} className="h-9 w-32"/></div>
                <div className="space-y-1"><Label htmlFor="bg-image-upload" className="text-xs">Fondo</Label><Input id="bg-image-upload" type="file" accept="image/*" onChange={handleBackgroundImageUpload} className="text-xs w-44" disabled={isUploading}/></div>
                <div className="space-y-1"><Label className="text-xs">Color Principal</Label><Input type="color" value={cartaTragos.paletaColores?.primary || '#9333ea'} onChange={e => handleColorChange('primary', e.target.value)} className="w-9 h-8 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Color Secundario</Label><Input type="color" value={cartaTragos.paletaColores?.secondary || '#363636'} onChange={e => handleColorChange('secondary', e.target.value)} className="w-9 h-8 p-0.5"/></div>
                <div className="space-y-1"><Label className="text-xs">Fondo Tarjetas</Label><Input type="color" value={cartaTragos.backgroundColor || '#e9d5ff'} onChange={e => handleUpdate('backgroundColor', e.target.value)} className="w-9 h-8 p-0.5"/></div>

               <div className="flex items-end gap-2">
                 <Button size="sm" onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}</Button>
                 <Button onClick={handlePrint} size="sm" variant="outline"><PrinterIcon className="w-4 h-4"/></Button>
                 <Link href={`/fiestas/nueva/catering?fiestaId=${fiestaId}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4"/></Button></Link>
               </div>
            </div>
        </div>
        
        <div className="w-[21cm] h-[29.7cm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto p-4 flex items-center justify-center">
            <div className="w-full h-full relative">
                <CartaTragosMenu fiesta={fiesta} carta={cartaTragos} isPreview={true} onUpdate={setCartaTragos} openEditModal={openEditModal} />
            </div>
        </div>

       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@400;700&family=Great+Vibes&display=swap');
         @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
            @page { size: A4 landscape; margin: 0; }
        }
       `}</style>
    </div>
  );
}

export default function CartaTragosPageWrapper() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <CartaTragosContent/>
        </Suspense>
    )
}
