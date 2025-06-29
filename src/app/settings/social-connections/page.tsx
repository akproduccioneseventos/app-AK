
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, AlertTriangle, Link as LinkIcon, Unlink, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SocialConnection, SocialPlatformName } from '@/types/settings';
import { getSocialConnections, connectSocialPlatform, disconnectSocialPlatform } from '@/app/actions/social-connections';
import { Facebook, Instagram, Music } from 'lucide-react'; // TikTok icon replacement

interface ConnectionCardProps {
  platform: SocialPlatformName;
  connection?: SocialConnection;
  onConnect: (platform: SocialPlatformName) => Promise<void>;
  onDisconnect: (platform: SocialPlatformName) => Promise<void>;
  isProcessing: boolean;
}

const platformDetails: Record<SocialPlatformName, { icon: React.ElementType, colorClass: string }> = {
  'Facebook': { icon: Facebook, colorClass: 'text-blue-600' },
  'Instagram': { icon: Instagram, colorClass: 'text-pink-500' },
  'TikTok': { icon: Music, colorClass: 'text-black dark:text-white' },
};

const ConnectionCard: React.FC<ConnectionCardProps> = ({ platform, connection, onConnect, onDisconnect, isProcessing }) => {
  const { icon: Icon, colorClass } = platformDetails[platform];
  const isConnected = connection?.isConnected;
  
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Icon className={`w-10 h-10 ${colorClass}`} />
        <div>
          <CardTitle className="font-headline text-xl">{platform}</CardTitle>
          <CardDescription>
            {isConnected ? `Conectado como ${connection.username}` : 'No conectado'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardFooter>
        {isConnected ? (
          <Button variant="destructive" className="w-full" onClick={() => onDisconnect(platform)} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Unlink className="w-4 h-4 mr-2"/>}
            Desconectar
          </Button>
        ) : (
          <Button className="w-full" onClick={() => onConnect(platform)} disabled={isProcessing}>
             {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <LogIn className="w-4 h-4 mr-2"/>}
            Conectar Cuenta
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default function SocialConnectionsPage() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlatform, setProcessingPlatform] = useState<SocialPlatformName | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSocialConnections();
      setConnections(data);
    } catch (err: any) {
      setError("No se pudieron cargar las conexiones.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);
  
  const handleConnect = async (platform: SocialPlatformName) => {
    setProcessingPlatform(platform);
    toast({title: `Simulando conexión con ${platform}...`, description: "En una app real, se abriría una ventana de inicio de sesión."});
    
    // Simulate API delay for OAuth
    await new Promise(resolve => setTimeout(resolve, 2000));

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
  
  const getConnectionForPlatform = (platform: SocialPlatformName) => connections.find(c => c.platform === platform);


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LinkIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Cuentas Sociales Vinculadas</h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline" disabled={!!processingPlatform}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
            <CardTitle>Gestionar Conexiones</CardTitle>
            <CardDescription>Conecta tus cuentas de redes sociales para habilitar la publicación automática desde la plataforma. Se requerirán permisos de administrador.</CardDescription>
        </CardHeader>
        <CardContent>
             {isLoading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : error ? (
                <div className="text-destructive p-4 text-center"><AlertTriangle className="mx-auto w-8 h-8 mb-2"/>{error}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(['Facebook', 'Instagram', 'TikTok'] as SocialPlatformName[]).map(platform => (
                        <ConnectionCard
                            key={platform}
                            platform={platform}
                            connection={getConnectionForPlatform(platform)}
                            onConnect={handleConnect}
                            onDisconnect={handleDisconnect}
                            isProcessing={processingPlatform === platform}
                        />
                    ))}
                </div>
            )}
        </CardContent>
         <CardFooter>
            <p className="text-xs text-muted-foreground">La conexión es una simulación. En una aplicación real, se utilizaría un flujo OAuth seguro.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
