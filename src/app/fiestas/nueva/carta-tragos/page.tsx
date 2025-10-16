
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer as PrinterIcon, Share2, GlassWater, Edit, Upload, PlusCircle, Trash2, Camera, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, CartaTragosData, Trago } from '@/types/fiesta';
import { getFiestaActual, updateCartaTragosFiestaActual as updateCartaTragos } from '@/app/actions/fiesta-actual';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 as LoaderIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { cn } from '@/lib/utils';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';


const companyInfo = {
  name: "AK PRODUCCIONES",
  line1: "Servicio de fiestas integral",
  line2: "Todos los servicios-un solo lugar",
  contact: "098 355 530",
};

const MenuComponent: React.FC<{
  fiesta: FiestaEnPlanificacion;
  carta: CartaTragosData;
  logoUrl: string | null;
  openEditModal: (item: Trago) => void;
}> = ({ fiesta, carta, logoUrl, openEditModal }) => {
  
  const protagonistaNombre = fiesta.configuracion.protagonista1Nombre || 'Protagonista';
  const tipoEvento = fiesta.configuracion.tipoCelebracion || 'Mi Evento';

  return (
    <div className="w-full h-full flex flex-col p-2 relative overflow-hidden bg-gradient-to-br from-[#e9d5ff] to-[#f3e8ff]">
      <div className="absolute top-0 left-0 w-full h-12" style={{ background: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%239333ea" fill-opacity="0.8" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,138.7C960,117,1056,107,1152,117.3C1248,128,1344,160,1392,176L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>\')', backgroundSize: 'cover' }}></div>
      <div className="absolute bottom-0 left-0 w-full h-12" style={{ background: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%239333ea" fill-opacity="0.8" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,138.7C960,117,1056,107,1152,117.3C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>\')', backgroundSize: 'cover' }}></div>

      <header className="relative z-10 grid grid-cols-2 gap-2 items-center px-4 mt-12">
        <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 shadow-lg overflow-hidden justify-self-center">
            <NextImage src={carta.protagonistaFotoUrl || "https://picsum.photos/seed/quinceanera-main/300/300"} alt={`Foto de ${protagonistaNombre}`} width={96} height={96} className="object-cover w-full h-full" data-ai-hint="protagonist photo"/>
        </div>
        <div className="text-center">
            <h1 className="font-bold text-xl text-white uppercase tracking-wider" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Carta de Tragos</h1>
            <h2 className="font-extrabold text-5xl mt-1 text-white" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '3px 3px 5px rgba(0,0,0,0.5)' }}>{protagonistaNombre}</h2>
            <h3 className="font-extrabold text-3xl mt-0 text-white" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '3px 3px 5px rgba(0,0,0,0.5)' }}>{tipoEvento}</h3>
        </div>
      </header>

      <main className="relative z-10 flex-grow grid grid-cols-2 gap-x-2 gap-y-4 px-2 mt-4">
        {carta.items.map((drink) => (
          <div key={drink.id} className="text-center group relative" onClick={() => openEditModal(drink)}>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-20 rounded-lg">
                <Edit className="w-8 h-8 text-white"/>
            </div>
            <h4 className="font-extrabold text-[0.6rem] uppercase tracking-wide text-purple-900" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>{drink.nombre}</h4>
            <div className="mt-1 aspect-[3/4] rounded-lg shadow-md overflow-hidden border-2 border-white">
                <NextImage src={drink.imageUrl} alt={drink.nombre} width={200} height={300} className="w-full h-full object-cover" data-ai-hint={drink.aiHint}/>
            </div>
          </div>
        ))}
      </main>

       <footer className="relative z-10 mt-auto flex justify-center pb-8 pt-4">
            {logoUrl && (
                <div className="w-16 h-16">
                  <NextImage src={logoUrl} alt="AK Producciones Logo" width={64} height={64} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
        </footer>
    </div>
  );
};


export default function CartaTragosPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cartaTragos, setCartaTragos] = useState<CartaTragosData>(defaultCartaTragosData);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Trago | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fiestaData, settings] = await Promise.all([getFiestaActual(), getInvoiceTemplateSettings()]);
      setFiesta(fiestaData);
      setLogoUrl(settings.logoUrl);
      if (fiestaData.cartaTragos) {
        setCartaTragos(fiestaData.cartaTragos);
      }
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos del evento.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSaveChanges = async () => {
    if (!fiesta) return;
    setIsSaving(true);
    try {
      const result = await updateCartaTragos(fiesta.id, cartaTragos);
      if (result.success) {
        toast({ title: "Guardado", description: "La carta de tragos ha sido actualizada." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (item: Trago) => {
    setEditingItem(item);
    setPreviewUrl(item.imageUrl);
    setFileToUpload(null);
    setIsEditModalOpen(true);
  };
  
  const handleAddItem = () => {
    const newItem: Trago = {
      id: `trago_${Date.now()}`,
      nombre: 'Nuevo Trago',
      imageUrl: 'https://placehold.co/400x600/e2e8f0/a0aec0?text=Trago'
    };
    setCartaTragos(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleUpdateItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    let finalImageUrl = editingItem.imageUrl;

    if (fileToUpload) {
      if (!fiesta) {
        toast({ title: "Error", description: "ID de fiesta no encontrado para subir imagen.", variant: "destructive" });
        return;
      }
      setIsUploading(true);
      const formData = new FormData();
      formData.append('fiestaId', fiesta.id);
      formData.append('file', fileToUpload);
      
      const result = await uploadPublicPageAsset(fiesta.id, fileToUpload);
      if(result.success && result.url) {
        finalImageUrl = result.url;
      } else {
        toast({ title: "Error al subir", description: result.error, variant: "destructive" });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    
    setCartaTragos(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === editingItem.id ? { ...editingItem, imageUrl: finalImageUrl } : item
      ),
    }));
    
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = () => {
    if (!editingItem) return;
    setCartaTragos(prev => ({ ...prev, items: prev.items.filter(item => item.id !== editingItem.id) }));
    setIsEditModalOpen(false);
    setEditingItem(null);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };


  const handlePrint = () => window.print();
  const handleShare = () => { /* ... (implement if needed) ... */ };

  if (isLoading || !fiesta) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="bg-gray-100 print:bg-white font-sans">
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Trago</DialogTitle></DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="trago-name">Nombre</Label>
                <Input id="trago-name" value={editingItem.nombre} onChange={e => setEditingItem(prev => prev ? {...prev, nombre: e.target.value} : null)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="trago-image">Imagen</Label>
                 {previewUrl && <NextImage src={previewUrl} alt="preview" width={100} height={150} className="rounded-md object-cover border"/>}
                 <Input id="trago-image" type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              <DialogFooter className="justify-between">
                <Button type="button" variant="destructive" onClick={handleDeleteItem}>Eliminar</Button>
                <div className="flex gap-2">
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={isUploading}>{isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Guardar'}</Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <div className="py-4 px-8 print:hidden flex justify-between items-center bg-white shadow-sm sticky top-0 z-50">
        <div className="flex gap-4 items-center">
            <h1 className="font-headline text-xl">Carta de Tragos Personalizable</h1>
            <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                Guardar Cambios
            </Button>
        </div>
        <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleAddItem}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Trago</Button>
            <Link href={`/fiestas/nueva?fiestaId=${fiesta.id}`} passHref><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
            <Button onClick={handlePrint} size="sm"><PrinterIcon className="w-4 h-4 mr-2"/>Imprimir</Button>
        </div>
      </div>
      
      <div className="w-[297mm] h-[210mm] mx-auto my-4 bg-white shadow-lg print:shadow-none print:my-0 print:mx-auto flex gap-4 p-4 border-2 border-dashed print:border-none">
        <div className="w-1/2 h-full border border-gray-300 print:border-none">
            <MenuComponent fiesta={fiesta} carta={cartaTragos} logoUrl={logoUrl} openEditModal={handleOpenEditModal}/>
        </div>
         <div className="w-1/2 h-full border border-gray-300 print:border-none">
            <MenuComponent fiesta={fiesta} carta={cartaTragos} logoUrl={logoUrl} openEditModal={handleOpenEditModal}/>
        </div>
      </div>

       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
        @media print {
            body { -webkit-print-color-adjust: exact; color-adjust: exact; }
            @page { size: A4 landscape; margin: 0; }
        }
       `}</style>
    </div>
  );
}
