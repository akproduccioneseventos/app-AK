
'use client';

import React, { useState, type FormEvent, useEffect, useCallback, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Link as LinkIcon, Share2, ClipboardCopy, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { updatePortalSettings } from '@/app/actions/fiesta/portal.actions';
import type { EventWebPageSettings } from '@/types/fiesta';
import { Separator } from '@/components/ui/separator';

export default function InvitacionDigitalPage() {
  const { toast } = useToast();
  const [webSettings, setWebSettings] = useState<EventWebPageSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [publicLink, setPublicLink] = useState('');
  
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const fiesta = await getFiestaActual();
      const settings = fiesta.webPageSettings || { pageTitle: '', heroSubtitle: '', welcomeMessage: '' };
      setWebSettings(settings);
      setImagePreview(settings.coverImageUrl || null);
      if (typeof window !== 'undefined') {
        setPublicLink(`${window.location.origin}/evento/actual?fiestaId=${fiesta.id}`);
      }
    } catch(e: any) {
        toast({ title: "Error", description: "No se pudo cargar la configuración de la invitación.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleInputChange = (field: keyof EventWebPageSettings, value: string) => {
    setWebSettings(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const fiesta = await getFiestaActual();
    if (!webSettings || !fiesta) return;
    setIsSaving(true);
    try {
        let finalSettings = {...webSettings};

        if (imageFile) {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            await new Promise<void>((resolve, reject) => {
                reader.onloadend = () => {
                    finalSettings.coverImageUrl = reader.result as string;
                    resolve();
                };
                reader.onerror = reject;
            });
        }
      
      const currentPortalSettings = fiesta.clientPortalSettings || {};
      // We pass both settings objects to the action
      const result = await updatePortalSettings(fiesta.id, currentPortalSettings, finalSettings);
      if (result.success) {
        toast({ title: "¡Guardado!", description: "La configuración de la invitación digital se ha actualizado." });
      } else {
        throw new Error(result.error || "Error desconocido al guardar.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicLink);
    toast({ title: "Enlace Copiado", description: "El enlace a la invitación ha sido copiado." });
  };
  
  const shareOnWhatsApp = () => {
    const message = `¡Estás invitado! 🎉\n\nHemos preparado una invitación digital para nuestro evento. Puedes ver todos los detalles aquí:\n\n${publicLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <PartyPopper className="w-8 h-8 text-primary"/>
            Diseño de Invitación Digital
        </h1>
        <Link href="/fiestas/nueva/invitados" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Invitados</Button></Link>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Enlace para Compartir</CardTitle>
          <CardDescription>Usa este enlace único para enviar las invitaciones a tus contactos. Cada invitado que lo reciba podrá confirmar su asistencia y ver los detalles del evento.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
              <Input id="link" value={publicLink} readOnly />
              <Button type="button" size="sm" onClick={copyToClipboard} variant="outline" disabled={!publicLink}><ClipboardCopy className="w-4 h-4 mr-2"/>Copiar</Button>
              <Button type="button" size="sm" onClick={shareOnWhatsApp} disabled={!publicLink} className="bg-green-500 hover:bg-green-600 text-white"><Share2 className="w-4 h-4 mr-2"/>WhatsApp</Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin"/></div> : (
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader><CardTitle>Contenido de la Invitación</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="pageTitle">Título Principal</Label>
                    <Input id="pageTitle" value={webSettings?.pageTitle || ''} onChange={(e) => handleInputChange('pageTitle', e.target.value)} />
                  </div>
                   <div className="space-y-1">
                    <Label htmlFor="heroSubtitle">Subtítulo</Label>
                    <Input id="heroSubtitle" value={webSettings?.heroSubtitle || ''} onChange={(e) => handleInputChange('heroSubtitle', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label>
                    <Textarea id="welcomeMessage" value={webSettings?.welcomeMessage || ''} onChange={(e) => handleInputChange('welcomeMessage', e.target.value)} rows={3}/>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Imagen de Fondo</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="coverImage">Subir nueva imagen</Label>
                    <Input id="coverImage" type="file" accept="image/*" onChange={handleFileChange} />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-semibold text-center">Vista Previa</h3>
               <Card className="w-full max-w-sm mx-auto shadow-md aspect-[9/16] relative overflow-hidden">
                {imagePreview ? (
                  <NextImage src={imagePreview} alt="Fondo" layout="fill" objectFit="cover" className="brightness-75"/>
                ) : <div className="bg-muted w-full h-full"></div>}
                <div className="absolute inset-0 flex flex-col justify-between p-6 text-white text-center bg-gradient-to-t from-black/60 to-transparent">
                  <div>
                     <p className="text-lg font-light leading-tight">{webSettings?.welcomeMessage || '¡Estás invitado!'}</p>
                  </div>
                  <div className="space-y-2">
                     <h1 className="text-3xl font-bold font-headline">{webSettings?.pageTitle || 'Nuestro Evento'}</h1>
                     <p className="font-light text-lg">{webSettings?.heroSubtitle || 'Una noche para recordar'}</p>
                     <Separator className="my-3 bg-white/50"/>
                     <p className="text-sm">Sábado, 15 de Noviembre de 2025</p>
                  </div>
                   <div className="space-y-2">
                        <Button size="sm" className="w-full bg-white/30 backdrop-blur-sm text-white hover:bg-white/50">Confirmar Asistencia</Button>
                        <Button size="sm" variant="ghost" className="w-full text-white/80 hover:text-white hover:bg-white/20">Ver Lista de Regalos</Button>
                   </div>
                </div>
               </Card>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2"/>}
              Guardar Diseño
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
