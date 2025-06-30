
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Link as LinkIcon, Unlink, LogIn, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Instagram, Music } from 'lucide-react';
import type { SocialConnection, SocialPlatformName } from '@/types/settings';
import { getSocialConnections, connectSocialPlatform, disconnectSocialPlatform, saveWhatsAppNumber } from '@/app/actions/social-connections';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const platformDetails: Record<SocialPlatformName, { icon: React.ElementType, colorClass: string }> = {
  'Facebook': { icon: Facebook, colorClass: 'text-blue-600' },
  'Instagram': { icon: Instagram, colorClass: 'text-pink-500' },
  'TikTok': { icon: Music, colorClass: 'text-black dark:text-white' },
  'WhatsApp': { icon: MessageSquare, colorClass: 'text-green-500' },
};

export default function SocialConnectionsPage() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlatform, setProcessingPlatform] = useState<SocialPlatformName | null>(null);
  const [whatsAppNumber, setWhatsAppNumber] = useState('');

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSocialConnections();
      setConnections(data);
      const waConnection = data.find(c => c.platform === 'WhatsApp');
      setWhatsAppNumber(waConnection?.phoneNumber || '');
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudieron cargar las conexiones sociales.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);
  
  const handleConnect = async (platform: SocialPlatformName) => {
    setProcessingPlatform(platform);
    toast({title: `Simulando conexión con ${platform}...`});
    await new Promise(resolve => setTimeout(resolve, 1500));
    const result = await connectSocialPlatform(platform);
    if(result.success) {
        toast({title: "¡Conexión Exitosa!", description: `Se ha vinculado la cuenta de ${platform}.`});
        await loadConnections();
    } else {
        toast({title: "Error de Conexión", description: result.error, variant: "destructive"});
    }
    setProcessingPlatform(null);
  };
  
  const handleDisconnect = async (platform: SocialPlatformName) => {
    setProcessingPlatform(platform);
    const result = await disconnectSocialPlatform(platform);
    if(result.success) {
        toast({title: "Cuenta Desconectada", description: `Se ha desvinculado la cuenta de ${platform}.`, variant: "destructive"});
        await loadConnections();
    } else {
        toast({title: "Error", description: result.error, variant: "destructive"});
    }
    setProcessingPlatform(null);
  };

  const handleSaveWhatsApp = async () => {
    setProcessingPlatform('WhatsApp');
    const result = await saveWhatsAppNumber(whatsAppNumber);
    if(result.success) {
        toast({title: "Número de WhatsApp Guardado"});
        await loadConnections();
    } else {
        toast({title: "Error", description: result.error, variant: "destructive"});
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
              <CardTitle className="font-headline text-xl">Conectar Plataformas</CardTitle>
              <CardDescription>Conecta tus redes para la publicación automática o vincula tu WhatsApp para compartir mensajes y presupuestos fácilmente.</CardDescription>
          </CardHeader>
           <CardContent>
             {isLoading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['Facebook', 'Instagram', 'TikTok'] as SocialPlatformName[]).map(platform => {
                    const { icon: Icon, colorClass } = platformDetails[platform];
                    const connection = getConnectionForPlatform(platform);
                    const isConnected = connection?.isConnected;
                    return (
                       <Card key={platform} className="p-4 flex flex-col justify-between">
                         <div className="flex items-center gap-3">
                           <Icon className={`w-8 h-8 ${colorClass}`}/>
                           <div><p className="font-semibold">{platform}</p><p className="text-xs text-muted-foreground">{isConnected ? `Conectado como ${connection.username}` : 'No conectado'}</p></div>
                         </div>
                          <Button variant={isConnected ? 'destructive' : 'default'} className="w-full mt-3" onClick={() => isConnected ? handleDisconnect(platform) : handleConnect(platform)} disabled={processingPlatform === platform}>
                            {processingPlatform === platform ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : isConnected ? <Unlink className="w-4 h-4 mr-2"/> : <LogIn className="w-4 h-4 mr-2"/>}
                            {isConnected ? 'Desconectar' : 'Conectar'}
                          </Button>
                       </Card>
                    );
                  })}
                  <Card className="p-4 flex flex-col justify-between md:col-span-2">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="w-8 h-8 text-green-500"/>
                        <div><p className="font-semibold">WhatsApp</p><p className="text-xs text-muted-foreground">{getConnectionForPlatform('WhatsApp')?.isConnected ? `Número: ${whatsAppNumber}` : 'Vincula tu número para compartir.'}</p></div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-number" className="sr-only">Número de WhatsApp</Label>
                        <Input id="whatsapp-number" placeholder="Ej: 59899123456" value={whatsAppNumber} onChange={(e) => setWhatsAppNumber(e.target.value)} disabled={processingPlatform === 'WhatsApp'}/>
                         <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSaveWhatsApp} disabled={processingPlatform === 'WhatsApp' || !whatsAppNumber.trim()}>
                           {processingPlatform === 'WhatsApp' ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <LinkIcon className="w-4 h-4 mr-2"/>}
                           {getConnectionForPlatform('WhatsApp')?.isConnected ? 'Actualizar Número' : 'Guardar Número'}
                         </Button>
                      </div>
                  </Card>
                </div>
            )}
           </CardContent>
       </Card>
    </div>
  );
}
