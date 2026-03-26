
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Link as LinkIcon, Unlink, Save, Loader2, UploadCloud } from 'lucide-react';
import React, { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Instagram, Music } from 'lucide-react';
import type { SocialConnection, SocialPlatformName } from '@/types/settings';
import { getSocialConnections, saveSocialLink, saveWhatsAppNumber, disconnectSocialPlatform } from '@/app/actions/social-connections';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import NextImage from 'next/image';

const platformDetails: Record<SocialPlatformName, { icon: React.ElementType, colorClass: string, placeholder: string }> = {
  'Facebook': { icon: Facebook, colorClass: 'text-blue-600', placeholder: 'https://facebook.com/tu-usuario' },
  'Instagram': { icon: Instagram, colorClass: 'text-pink-500', placeholder: 'https://instagram.com/tu-usuario' },
  'TikTok': { icon: Music, colorClass: 'text-black dark:text-white', placeholder: 'https://tiktok.com/@tu-usuario' },
  'WhatsApp': { icon: MessageSquare, colorClass: 'text-green-500', placeholder: '59899123456' },
};

// Helper to convert a file to a data URI
const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
});


export default function SocialConnectionsPage() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [formState, setFormState] = useState<Record<string, Partial<SocialConnection>>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [processingPlatform, setProcessingPlatform] = useState<SocialPlatformName | null>(null);

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSocialConnections();
      setConnections(data);
      const initialFormState: Record<string, Partial<SocialConnection>> = {};
      (Object.keys(platformDetails) as SocialPlatformName[]).forEach(platform => {
          const conn = data.find(c => c.platform === platform);
          initialFormState[platform] = {
              profileUrl: conn?.platform === 'WhatsApp' ? conn?.phoneNumber : conn?.profileUrl,
              logoUrl: conn?.logoUrl
          };
      });
      setFormState(initialFormState);
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudieron cargar las conexiones sociales.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);
  
  const handleInputChange = (platform: SocialPlatformName, field: 'profileUrl' | 'logoUrl', value: string) => {
      setFormState(prev => ({
          ...prev,
          [platform]: {
              ...prev[platform],
              [field]: value
          }
      }));
  };

  const handleFileChange = async (platform: SocialPlatformName, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 1024 * 1024) { // 1MB limit for logos
            toast({ title: "Archivo muy grande", description: "El logo no debe pesar más de 1MB.", variant: "destructive" });
            return;
        }
        const dataUrl = await toDataURL(file);
        handleInputChange(platform, 'logoUrl', dataUrl);
    }
  };


  const handleSave = async (platform: SocialPlatformName) => {
    setProcessingPlatform(platform);
    const platformData = formState[platform];
    const urlOrPhone = platformData?.profileUrl || '';
    
    let result;
    if (platform === 'WhatsApp') {
        result = await saveWhatsAppNumber(urlOrPhone, platformData?.logoUrl);
    } else {
        result = await saveSocialLink(platform, urlOrPhone, platformData?.logoUrl);
    }

    if (result.success) {
        toast({ title: "¡Guardado!", description: `El enlace para ${platform} ha sido guardado.` });
        await loadConnections();
    } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setProcessingPlatform(null);
  }

  const handleDisconnect = async (platform: SocialPlatformName) => {
    setProcessingPlatform(platform);
    const result = await disconnectSocialPlatform(platform);
    if (result.success) {
      toast({ title: "Enlace Eliminado", variant: "destructive" });
      await loadConnections();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setProcessingPlatform(null);
  };
  
  const getConnectionForPlatform = (platform: SocialPlatformName) => connections.find(c => c.platform === platform);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <LinkIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Cuentas Sociales Vinculadas
            </h1>
        </div>
        <Link href="/settings">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
      </div>

       <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="font-headline text-xl">Gestionar Enlaces Sociales</CardTitle>
              <CardDescription>Guarda los enlaces a tus perfiles y sube un logo personalizado para cada uno. Estos se mostrarán en la invitación digital.</CardDescription>
          </CardHeader>
           <CardContent>
             {isLoading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
                <div className="space-y-6">
                  {(Object.keys(platformDetails) as SocialPlatformName[]).map(platform => {
                    const { icon: Icon, colorClass, placeholder } = platformDetails[platform];
                    const connection = getConnectionForPlatform(platform);
                    const isConnected = !!connection?.isConnected;
                    const isProcessing = processingPlatform === platform;
                    const platformData = formState[platform] || {};
                    return (
                       <Card key={platform} className="p-4 bg-muted/30">
                        <div className="flex items-start gap-4 mb-4">
                           <Icon className={`w-8 h-8 ${colorClass} flex-shrink-0 mt-1`}/>
                           <div className="w-full space-y-3">
                            <p className="font-semibold">{platform}</p>
                             <div className="space-y-1">
                                <Label htmlFor={`url-${platform}`} className="text-xs text-muted-foreground">{platform === 'WhatsApp' ? 'Número de Teléfono (con cód. país)' : 'URL del Perfil'}</Label>
                                <Input 
                                    id={`url-${platform}`} 
                                    placeholder={placeholder} 
                                    value={platformData.profileUrl || ''}
                                    onChange={e => handleInputChange(platform, 'profileUrl', e.target.value)}
                                    disabled={isProcessing}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor={`logo-${platform}`} className="text-xs text-muted-foreground">Logo Personalizado (Opcional)</Label>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 border rounded bg-background flex items-center justify-center">
                                        {platformData.logoUrl ? <NextImage src={platformData.logoUrl} alt={`${platform} logo`} width={32} height={32} className="object-contain"/> : <UploadCloud className="w-5 h-5 text-muted-foreground"/>}
                                    </div>
                                    <Input id={`logo-${platform}`} type="file" accept="image/png, image/svg+xml, image/jpeg" onChange={(e) => handleFileChange(platform, e)} disabled={isProcessing} className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                                </div>
                             </div>
                           </div>
                         </div>
                         <div className="flex justify-end gap-2">
                            {isConnected && (
                                <Button size="sm" variant="destructive" onClick={() => handleDisconnect(platform)} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Unlink className="w-4 h-4"/>}
                                </Button>
                            )}
                            <Button size="sm" className="flex-grow" onClick={() => handleSave(platform)} disabled={isProcessing || !formState[platform]?.profileUrl?.trim()}>
                                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                                {isConnected ? 'Actualizar' : 'Guardar'}
                            </Button>
                         </div>
                       </Card>
                    );
                  })}
                </div>
            )}
           </CardContent>
       </Card>
    </div>
  );
}
