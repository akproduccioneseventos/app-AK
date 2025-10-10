
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, PartyPopper, Calendar, MapPin, Music, Check, Users, MessageSquare, Send, CheckCircle, Gift, Clock, QrCode, Facebook, Instagram, Camera, Link as LinkIcon, ArrowLeft, Save, Globe, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, EventWebPageSettings, ColorPalette, Invitado, GiftItem } from '@/types/fiesta';
import { getFiestaActual, updatePortalSettingsFiestaActual as updateWebSettings } from '@/app/actions/fiesta-actual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { defaultWebPageSettings } from '@/lib/fiesta-defaults';
import { merge, cloneDeep } from 'lodash';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';


function InvitacionDigitalPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [settings, setSettings] = useState<EventWebPageSettings>(defaultWebPageSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const data = await getFiestaActual();
      setFiesta(data);
      const mergedSettings = merge(cloneDeep(defaultWebPageSettings), data.webPageSettings || {});
      setSettings(mergedSettings);
      setCoverImagePreview(mergedSettings.coverImageUrl || null);
    } catch (e) {
      toast({ title: "Error", description: "No se pudo cargar la configuración de la invitación." });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSettingsChange = (field: keyof EventWebPageSettings, value: string | boolean) => {
    setSettings(prev => ({...prev, [field]: value}));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!fiesta) return;
    setIsSaving(true);
    let finalSettings = { ...settings };
    
    try {
      if (coverImageFile) {
        const result = await uploadPublicPageAsset(fiesta.id, coverImageFile);
        if (result.success && result.url) {
          finalSettings.coverImageUrl = result.url;
        } else {
          throw new Error(result.error || 'No se pudo subir la imagen.');
        }
      }
      
      // We are only saving webPageSettings here.
      const currentPortalSettings = fiesta.clientPortalSettings || {};
      const result = await updateWebSettings(fiesta.id, currentPortalSettings, finalSettings);
      
      if (result.success) {
        toast({ title: "¡Diseño Guardado!", description: "El diseño de la invitación ha sido actualizado." });
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
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Fecha por confirmar";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Fecha inválida";
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return "Fecha inválida"; }
  };

  if (isLoading || !fiesta) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  }
  
  const heroTextStyle = settings.coverImageUrl ? 'text-white' : 'text-primary-foreground';
  const primaryColor = fiesta.decoracion?.paletaColores?.primary || '#EF4444';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-primary"/>
            Diseño de Invitación Digital
        </h1>
        <Link href={`/fiestas/nueva/invitados?fiestaId=${fiestaId}`} passHref>
          <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver a Invitados</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Panel */}
        <div className="lg:col-span-2">
            <form onSubmit={handleSave}>
              <Card>
                <CardHeader><CardTitle>Personalizar Invitación</CardTitle><CardDescription>Ajusta los textos e imágenes que aparecerán en la invitación.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pageTitle">Título Principal (Ej: "Nuestra Boda", "Mis 15 Años")</Label>
                    <Input id="pageTitle" value={settings.pageTitle} onChange={(e) => handleSettingsChange('pageTitle', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitle">Subtítulo (Ej: Nombres de la pareja, nombre de la quinceañera)</Label>
                    <Input id="heroSubtitle" value={settings.heroSubtitle} onChange={(e) => handleSettingsChange('heroSubtitle', e.target.value)} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="cover-image">Imagen Principal / de Fondo</Label>
                    <Input id="cover-image" type="file" accept="image/*" onChange={handleFileChange}/>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    Guardar Diseño
                  </Button>
                </CardFooter>
              </Card>
            </form>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold mb-2 text-center text-muted-foreground">Vista Previa</h3>
          <Card className="shadow-lg w-full max-w-sm mx-auto aspect-[9/16] flex flex-col" style={{ backgroundColor: primaryColor }}>
             <div className="relative w-full h-full flex flex-col justify-center items-center text-center p-4">
                {coverImagePreview && <NextImage src={coverImagePreview} layout="fill" objectFit="cover" alt="Fondo" className="z-0 opacity-80"/>}
                 <div className="absolute inset-0 bg-black/40 z-10"></div>
                 <div className="relative z-20 flex flex-col items-center">
                    <PartyPopper className={`w-12 h-12 mb-3 ${heroTextStyle}`} />
                     <h1 className={`text-3xl font-bold font-headline ${heroTextStyle}`}>{settings.pageTitle || fiesta.configuracion.nombreEvento}</h1>
                     {settings.heroSubtitle && <p className={`text-md mt-1 ${heroTextStyle}`}>{settings.heroSubtitle}</p>}
                     <p className={`text-sm mt-2 ${heroTextStyle}`}>
                         <Calendar className="inline-block w-4 h-4 mr-1.5 align-middle" />
                         {formatDate(fiesta.configuracion.fechaEvento)}
                     </p>
                 </div>
                 <div className="relative z-20 mt-8 w-full px-4 space-y-2">
                     <Button className="w-full" variant="secondary" size="sm">Confirmar Asistencia</Button>
                     <Button className="w-full" variant="outline" size="sm">Ver Lista de Regalos</Button>
                 </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


export default function InvitacionDigitalPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <InvitacionDigitalPageContent />
        </Suspense>
    )
}
