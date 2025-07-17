
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Sparkles, PlusCircle, Trash2, Edit3, Image as ImageIcon, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AsistenteAkConfig, AsistentePasoOpcion } from '@/types/fiesta';
import { getAsistenteAkConfig, saveAsistenteAkConfig } from '@/app/actions/asistente-ak';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import NextImage from 'next/image';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function AsistenteAkConfigPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<AsistenteAkConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State for "Tipo de Fiesta"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<AsistentePasoOpcion> | null>(null);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedConfig = await getAsistenteAkConfig();
      setConfig(loadedConfig);
    } catch (err: any) {
      setError("No se pudo cargar la configuración del asistente.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const openModal = (item?: AsistentePasoOpcion) => {
    setCurrentItem(item ? { ...item } : { id: '', nombre: '', costoBase: 0, img: '' });
    setIsModalOpen(true);
  };

  const handleModalChange = (field: keyof AsistentePasoOpcion, value: string | number) => {
    setCurrentItem(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleModalSave = () => {
    if (!currentItem || !currentItem.nombre?.trim()) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }
    const finalItem: AsistentePasoOpcion = {
      id: currentItem.id || `tipo_${Date.now()}`,
      nombre: currentItem.nombre.trim(),
      costoBase: Number(currentItem.costoBase) || 0,
      img: currentItem.img || '',
      hint: currentItem.hint,
    };

    setConfig(prevConfig => {
      if (!prevConfig) return null;
      const pasoTipoFiesta = prevConfig.pasos.tipoFiesta;
      const itemExists = pasoTipoFiesta.opciones.some(opt => opt.id === finalItem.id);
      let nuevasOpciones;
      if (itemExists) {
        nuevasOpciones = pasoTipoFiesta.opciones.map(opt => opt.id === finalItem.id ? finalItem : opt);
      } else {
        nuevasOpciones = [...pasoTipoFiesta.opciones, finalItem];
      }
      return {
        ...prevConfig,
        pasos: {
          ...prevConfig.pasos,
          tipoFiesta: { ...pasoTipoFiesta, opciones: nuevasOpciones }
        }
      };
    });
    setIsModalOpen(false);
  };
  
  const handleDeleteItem = (itemId: string) => {
    setConfig(prevConfig => {
      if (!prevConfig) return null;
       const pasoTipoFiesta = prevConfig.pasos.tipoFiesta;
       return {
         ...prevConfig,
         pasos: {
           ...prevConfig.pasos,
           tipoFiesta: {
             ...pasoTipoFiesta,
             opciones: pasoTipoFiesta.opciones.filter(opt => opt.id !== itemId)
           }
         }
       }
    });
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveAsistenteAkConfig(config);
      if (result.success) {
        toast({ title: "¡Configuración Guardada!", description: "Los cambios en el asistente han sido guardados." });
        await loadConfig();
      } else {
        throw new Error(result.error || "No se pudo guardar la configuración.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !config) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="py-10 text-center text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p></div>;
  }

  const { tipoFiesta } = config.pasos;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Añadir'} Tipo de Fiesta</DialogTitle></DialogHeader>
            {currentItem && (
                <div className="space-y-3 py-2">
                    <div className="space-y-1"><Label htmlFor="item-nombre">Nombre *</Label><Input id="item-nombre" value={currentItem.nombre || ''} onChange={(e) => handleModalChange('nombre', e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="item-costo">Costo Base ($)</Label><Input id="item-costo" type="number" value={currentItem.costoBase || 0} onChange={(e) => handleModalChange('costoBase', Number(e.target.value))}/></div>
                    <div className="space-y-1"><Label htmlFor="item-img-url">URL Imagen</Label><Input id="item-img-url" value={currentItem.img || ''} onChange={(e) => handleModalChange('img', e.target.value)} placeholder="https://placehold.co/400x300.png"/></div>
                    {currentItem.img && <NextImage src={currentItem.img} alt="Preview" width={100} height={75} className="rounded border"/>}
                    <div className="space-y-1"><Label htmlFor="item-hint">Pista para IA de imágenes</Label><Input id="item-hint" value={currentItem.hint || ''} onChange={(e) => handleModalChange('hint', e.target.value)} placeholder="Ej: wedding couple"/></div>
                </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleModalSave}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Asistente AK</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/asistente-ak" passHref target="_blank">
              <Button variant="secondary"><Eye className="w-4 h-4 mr-2"/>Previsualizar</Button>
          </Link>
          <Link href="/settings" passHref>
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
          </Link>
        </div>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle className="font-headline text-xl">Configuración del Paso 1: Tipo de Fiesta</CardTitle>
              <CardDescription>{tipoFiesta.pregunta}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tipoFiesta.opciones.map(opt => (
                      <Card key={opt.id} className="overflow-hidden">
                          <CardContent className="p-0">
                               <div className="relative aspect-video bg-muted">
                                  <NextImage src={opt.img || 'https://placehold.co/400x300.png'} alt={opt.nombre} layout="fill" objectFit="cover" data-ai-hint={opt.hint || 'event type'}/>
                               </div>
                               <div className="p-3">
                                  <p className="font-semibold">{opt.nombre}</p>
                                  <p className="text-sm text-muted-foreground">Costo base: {formatCurrency(opt.costoBase)}</p>
                               </div>
                          </CardContent>
                          <CardFooter className="p-2 border-t flex justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openModal(opt)}><Edit3 className="w-4 h-4"/></Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteItem(opt.id)}><Trash2 className="w-4 h-4"/></Button>
                          </CardFooter>
                      </Card>
                  ))}
                  <Button variant="outline" className="h-full min-h-[150px] border-dashed flex-col gap-2" onClick={() => openModal()}>
                      <PlusCircle className="w-8 h-8 text-muted-foreground"/>
                      Añadir Opción
                  </Button>
              </div>
          </CardContent>
      </Card>

       <Card className="shadow-lg">
          <CardFooter className="p-4 border-t flex justify-end">
            <Button onClick={handleSaveConfig} disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
              Guardar toda la Configuración
            </Button>
          </CardFooter>
      </Card>
    </div>
  );
}
