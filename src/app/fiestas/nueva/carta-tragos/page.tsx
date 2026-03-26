
'use client';

import React, { useState, useEffect, useCallback, Suspense, type ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Printer as PrinterIcon, Save, Loader2, Edit, Upload, Image as ImageIconLucide, Download, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CartaTragosData, Trago } from '@/types/fiesta';
import { getFiestaById, updateCartaTragos as updateCartaTragosAction } from '@/app/actions/fiesta/fiesta.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';
import { CartaTragosMenu } from '@/components/invitacion/templates/CartaTragosMenu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import NextImage from 'next/image';
import html2canvas from 'html2canvas';


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
  
  const printRef = useRef<HTMLDivElement>(null);


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
  
  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent' | 'background', value: string) => {
    setCartaTragos(prev => ({
        ...prev,
        paletaColores: {
            ...(prev.paletaColores || { primary: '#9333ea', secondary: '#363636', accent: '#ffffff', background: '#ffffff' }),
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
        toast({ title: "¡Guardado!", description: "La carta de tragos ha sido actualizada." });
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

  const handleDownloadJpg = async () => {
    if (!printRef.current) return;
    toast({ title: "Generando imagen...", description: "Por favor, espera un momento."});
    try {
        const canvas = await html2canvas(printRef.current, { 
            scale: 2, // Increase resolution
            useCORS: true, // For external images
            backgroundColor: '#ffffff',
        });
        const link = document.createElement('a');
        link.download = `carta-tragos-${fiesta?.configuracion.nombreEvento}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9); // Use jpeg format
        link.click();
        toast({ title: "¡Descarga iniciada!", description: "La imagen de la carta de tragos se está descargando."});
    } catch(e) {
        toast({ title: "Error al generar imagen", description: "No se pudo crear el archivo JPG.", variant: "destructive"});
    }
  };


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

  if (isLoading || !fiesta) {
    return <div className="p-8 max-w-4xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (error) {
    return <div className="p-8 max-w-4xl mx-auto text-center">{error}</div>;
  }
  
  return (
    <div className="bg-gray-100 min-h-screen pb-10 print:bg-white print:pb-0">
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
                            {previewUrl && <div className="relative w-20 h-28 mb-2"><NextImage src={previewUrl} alt="Preview" layout="fill" objectFit="cover" className="rounded-md border" /></div>}
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
            <div className="flex items-center gap-2">
                <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
                    <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5"/></Button>
                </Link>
                <h1 className="font-headline text-lg">Editor de Carta de Tragos (15x10 cm)</h1>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                <div className="flex flex-col">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Color Borde</Label>
                    <Input type="color" value={cartaTragos.paletaColores?.primary || '#8b5cf6'} onChange={e => handleColorChange('primary', e.target.value)} className="w-10 h-8 p-0.5"/>
                </div>
                <div className="flex flex-col">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Color Título</Label>
                    <Input type="color" value={cartaTragos.paletaColores?.accent || '#3b82f6'} onChange={e => handleColorChange('accent', e.target.value)} className="w-10 h-8 p-0.5"/>
                </div>
                <div className="flex flex-col">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Color Texto</Label>
                    <Input type="color" value={cartaTragos.paletaColores?.secondary || '#4b5563'} onChange={e => handleColorChange('secondary', e.target.value)} className="w-10 h-8 p-0.5"/>
                </div>
                <div className="flex flex-col">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Color Fondo</Label>
                    <Input type="color" value={cartaTragos.backgroundColor || '#ffffff'} onChange={e => handleColorChange('background', e.target.value)} className="w-10 h-8 p-0.5"/>
                </div>

               <div className="flex items-end gap-2 ml-4">
                 <Button size="sm" onClick={handleSave} disabled={isSaving} title="Guardar Cambios">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    Guardar
                 </Button>
                 <Button onClick={handleDownloadJpg} size="sm" variant="outline" title="Descargar como JPG">
                    <Download className="w-4 h-4 mr-2"/> JPG
                 </Button>
                 <Button onClick={handlePrint} size="sm" variant="outline" title="Imprimir PDF">
                    <PrinterIcon className="w-4 h-4 mr-2"/> PDF
                 </Button>
               </div>
            </div>
        </div>
        
        <div className="flex flex-col items-center py-10 print:py-0">
          <Card className="p-0 border-none shadow-2xl print:shadow-none bg-white">
            <div ref={printRef} className="w-[15cm] h-[10cm] bg-white print:mx-auto">
                <CartaTragosMenu fiesta={fiesta} carta={cartaTragos} isPreview={true} onUpdate={setCartaTragos} openEditModal={openEditModal} />
            </div>
          </Card>
          <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2 print:hidden bg-white/80 p-3 rounded-lg border border-dashed">
              <Info className="w-4 h-4 text-primary"/>
              <p>Doble clic en los textos para editar. Haz clic en las imágenes de los tragos para cambiarlas.</p>
          </div>
        </div>

       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@400;700&family=Great+Vibes&display=swap');
         @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; background: white !important; }
            .sidebar, header, nav, button, .no-print, .notifications-hub, .sidebar-inset > header { display: none !important ; }
            @page { 
                size: 15cm 10cm landscape;
                margin: 0; 
            }
            main { padding: 0 !important; margin: 0 !important; }
            .print-main-override { padding: 0 !important; }
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
