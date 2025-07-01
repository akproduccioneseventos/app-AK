
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Link as LinkIcon, Unlink, Save, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Instagram, Music } from 'lucide-react';
import type { SocialConnection, SocialPlatformName } from '@/types/settings';
import { getSocialConnections, saveSocialLink, saveWhatsAppNumber, disconnectSocialPlatform } from '@/app/actions/social-connections';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const platformDetails: Record<SocialPlatformName, { icon: React.ElementType, colorClass: string, placeholder: string }> = {
  'Facebook': { icon: Facebook, colorClass: 'text-blue-600', placeholder: 'https://facebook.com/tu-usuario' },
  'Instagram': { icon: Instagram, colorClass: 'text-pink-500', placeholder: 'https://instagram.com/tu-usuario' },
  'TikTok': { icon: Music, colorClass: 'text-black dark:text-white', placeholder: 'https://tiktok.com/@tu-usuario' },
  'WhatsApp': { icon: MessageSquare, colorClass: 'text-green-500', placeholder: '59899123456' },
};

export default function SocialConnectionsPage() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlatform, setProcessingPlatform] = useState<SocialPlatformName | null>(null);

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSocialConnections();
      setConnections(data);
      const initialUrls: Record<string, string> = {};
      data.forEach(conn => {
        if (conn.platform === 'WhatsApp') {
            initialUrls[conn.platform] = conn.phoneNumber || '';
        } else {
            initialUrls[conn.platform] = conn.profileUrl || '';
        }
      });
      setUrls(initialUrls);
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudieron cargar las conexiones sociales.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);
  
  const handleSave = async (platform: SocialPlatformName) => {
    setProcessingPlatform(platform);
    const urlOrPhone = urls[platform] || '';
    let result;
    if (platform === 'WhatsApp') {
        result = await saveWhatsAppNumber(urlOrPhone);
    } else {
        result = await saveSocialLink(platform, urlOrPhone);
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
      setUrls(prev => ({...prev, [platform]: ''})); // Clear URL in UI
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
        <Link href="/settings" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
      </div>

       <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="font-headline text-xl">Gestionar Enlaces Sociales</CardTitle>
              <CardDescription>Guarda los enlaces a tus perfiles de redes sociales. Estos se mostrarán en tu página pública de evento.</CardDescription>
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
                    return (
                       <Card key={platform} className="p-4 flex flex-col justify-between bg-muted/30">
                         <div className="flex items-start gap-3 mb-3">
                           <Icon className={`w-8 h-8 ${colorClass}`}/>
                           <div className="w-full">
                            <p className="font-semibold">{platform}</p>
                            <div className="space-y-2 mt-1">
                                <Label htmlFor={`url-${platform}`} className="sr-only">URL de {platform}</Label>
                                <Input 
                                    id={`url-${platform}`} 
                                    placeholder={placeholder} 
                                    value={urls[platform] || ''}
                                    onChange={e => setUrls(prev => ({...prev, [platform]: e.target.value}))}
                                    disabled={isProcessing}
                                />
                            </div>
                           </div>
                         </div>
                         <div className="flex justify-end gap-2">
                            {isConnected && (
                                <Button size="sm" variant="destructive" onClick={() => handleDisconnect(platform)} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Unlink className="w-4 h-4"/>}
                                </Button>
                            )}
                            <Button size="sm" className="flex-grow" onClick={() => handleSave(platform)} disabled={isProcessing || !urls[platform]?.trim()}>
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
