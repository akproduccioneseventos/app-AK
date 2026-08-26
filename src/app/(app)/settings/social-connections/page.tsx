'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Link as LinkIcon,
  Unlink,
  Save,
  Loader2,
  UploadCloud,
  Facebook,
  Instagram,
  Music,
  Youtube,
  AtSign,
  Twitter,
  Pin,
  Globe,
  Sparkles,
  Key,
  ShieldCheck,
  Zap,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { SocialConnection, SocialPlatformName } from '@/types/settings';
import {
  getSocialConnections,
  saveSocialLink,
  saveWhatsAppNumber,
  disconnectSocialPlatform,
  saveSocialCredentials,
  saveUnifiedGatewaySettings,
  testInstagramConnection,
} from '@/app/actions/social-connections';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import NextImage from 'next/image';

const platformDetails: Record<SocialPlatformName, { icon: React.ElementType; colorClass: string; placeholder: string; hasDirectApi: boolean }> = {
  Facebook: { icon: Facebook, colorClass: 'text-blue-600', placeholder: 'https://facebook.com/tu-pagina', hasDirectApi: true },
  Instagram: { icon: Instagram, colorClass: 'text-pink-500', placeholder: 'https://instagram.com/tu-usuario', hasDirectApi: true },
  TikTok: { icon: Music, colorClass: 'text-black dark:text-white', placeholder: 'https://tiktok.com/@tu-usuario', hasDirectApi: true },
  YouTube: { icon: Youtube, colorClass: 'text-red-600', placeholder: 'https://youtube.com/@tu-canal', hasDirectApi: true },
  Google: { icon: Globe, colorClass: 'text-blue-500', placeholder: 'https://business.google.com/...', hasDirectApi: true },
  Threads: { icon: AtSign, colorClass: 'text-slate-800 dark:text-slate-200', placeholder: 'https://threads.net/@tu-usuario', hasDirectApi: true },
  X: { icon: Twitter, colorClass: 'text-slate-800 dark:text-slate-200', placeholder: 'https://x.com/tu-usuario', hasDirectApi: true },
  Pinterest: { icon: Pin, colorClass: 'text-red-600', placeholder: 'https://pinterest.com/tu-usuario', hasDirectApi: true },
  WhatsApp: { icon: MessageSquare, colorClass: 'text-green-500', placeholder: '59899123456', hasDirectApi: false },
};

const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

export default function SocialConnectionsPage() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [formState, setFormState] = useState<Record<string, Partial<SocialConnection>>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [unifiedWebhook, setUnifiedWebhook] = useState('');
  const [unifiedApiKey, setUnifiedApiKey] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [processingPlatform, setProcessingPlatform] = useState<SocialPlatformName | 'Unified' | null>(null);

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSocialConnections();
      setConnections(data);

      const initialFormState: Record<string, Partial<SocialConnection>> = {};
      (Object.keys(platformDetails) as SocialPlatformName[]).forEach((platform) => {
        const conn = data.find((c) => c.platform === platform);
        initialFormState[platform] = {
          profileUrl: conn?.platform === 'WhatsApp' ? conn?.phoneNumber : conn?.profileUrl,
          logoUrl: conn?.logoUrl,
          pageId: conn?.pageId,
          pageAccessToken: conn?.pageAccessToken,
          instagramAccountId: conn?.instagramAccountId,
          accessToken: conn?.accessToken,
          apiKey: conn?.apiKey,
          channelId: conn?.channelId,
          locationId: conn?.locationId,
          boardId: conn?.boardId,
        };
      });
      setFormState(initialFormState);

      const uConn = data.find((c) => c.webhookUrl);
      if (uConn?.webhookUrl) {
        setUnifiedWebhook(uConn.webhookUrl);
        setUnifiedApiKey(uConn.apiKey || '');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: 'No se pudieron cargar las conexiones sociales.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleInputChange = (platform: SocialPlatformName, field: keyof SocialConnection, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  const handleFileChange = async (platform: SocialPlatformName, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({ title: 'Archivo muy grande', description: 'El logo no debe pesar más de 1MB.', variant: 'destructive' });
        return;
      }
      const dataUrl = await toDataURL(file);
      handleInputChange(platform, 'logoUrl', dataUrl);
    }
  };

  const handleSave = async (platform: SocialPlatformName) => {
    setProcessingPlatform(platform);
    const platformData = formState[platform] || {};
    const urlOrPhone = platformData?.profileUrl || '';

    try {
      let result;
      if (platform === 'WhatsApp') {
        result = await saveWhatsAppNumber(urlOrPhone, platformData?.logoUrl);
      } else {
        result = await saveSocialCredentials(platform, {
          profileUrl: urlOrPhone,
          logoUrl: platformData.logoUrl,
          pageId: platformData.pageId,
          pageAccessToken: platformData.pageAccessToken,
          instagramAccountId: platformData.instagramAccountId,
          accessToken: platformData.accessToken,
          apiKey: platformData.apiKey,
          channelId: platformData.channelId,
          locationId: platformData.locationId,
          boardId: platformData.boardId,
        });
      }

      if (result.success) {
        toast({ title: '¡Guardado!', description: `Configuración para ${platform} actualizada correctamente.` });
        await loadConnections();
      } else {
        throw new Error(result.error || 'No se pudo guardar la configuración.');
      }
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingPlatform(null);
    }
  };

  const handleSaveUnified = async () => {
    setProcessingPlatform('Unified');
    try {
      const res = await saveUnifiedGatewaySettings({
        webhookUrl: unifiedWebhook,
        apiKey: unifiedApiKey,
      });
      if (res.success) {
        toast({ title: '¡Pasarela Guardada!', description: 'El webhook unificado quedó listo.' });
        await loadConnections();
      } else {
        throw new Error(res.error || 'No se pudo guardar la pasarela.');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingPlatform(null);
    }
  };

  const handleDisconnect = async (platform: SocialPlatformName) => {
    setProcessingPlatform(platform);
    const result = await disconnectSocialPlatform(platform);
    if (result.success) {
      toast({ title: 'Enlace Eliminado', variant: 'destructive' });
      await loadConnections();
    } else {
      toast({ title: 'Error', description: result.error, variant: "destructive" });
    }
    setProcessingPlatform(null);
  };

  const handleTestInstagram = async () => {
    setProcessingPlatform('Instagram');
    try {
      const res = await testInstagramConnection();
      if (res.success) {
        toast({
          title: '¡Instagram Conectado!',
          description: res.message,
        });
      } else {
        toast({
          title: 'Atención con Instagram',
          description: res.message,
          variant: 'destructive',
        });
      }
      await loadConnections();
    } catch (err: any) {
      toast({
        title: 'Error de prueba',
        description: err.message || 'No se pudo contactar a Meta.',
        variant: 'destructive',
      });
    } finally {
      setProcessingPlatform(null);
    }
  };

  const getConnectionForPlatform = (platform: SocialPlatformName) => connections.find((c) => c.platform === platform);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LinkIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Publicación en Redes Sociales
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Conexión directa a APIs oficiales ($0/mes) y modo asistido de 1 Toque.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link>
        </Button>
      </div>

      {/* Guía en Criollo sobre el Funcionamiento Real */}
      <Card className="rounded-[1.5rem] border-purple-200 bg-gradient-to-br from-purple-900/10 via-purple-900/5 to-transparent shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600 text-white">Guía en Criollo</Badge>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Estado real y transparente
            </span>
          </div>
          <CardTitle className="text-lg font-black text-slate-900">
            ¿Cómo funciona la difusión en tu negocio?
          </CardTitle>
          <CardDescription className="text-slate-600 font-medium">
            Cada canal tiene su funcionamiento específico sin promesas falsas:
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 text-xs text-slate-700">
          <div className="p-3.5 rounded-xl bg-white border border-purple-100 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>1. Modo 1 Toque (Listo para copiar)</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Para TikTok, Pinterest, X y canales sin API: la app te copia el texto y descarga el material para que abras la red y toques publicar en 2 segundos.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-purple-100 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Key className="w-4 h-4 text-purple-600" />
              <span>2. Meta Graph API (Instagram y Facebook)</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Si cargás el Token de Meta y el Account ID, y la prueba da exitosa, la app sincroniza fotos y reels directo con tu cuenta comercial.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-emerald-100 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>3. WhatsApp (Siempre con tu control)</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              WhatsApp es tu contacto humano: la app prepara los textos con contexto pero <strong>siempre los enviás vos</strong> desde tu número. Nunca envía solo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pasarela Unificada / Webhook (Camino B) */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Pasarela Unificada / Webhook Externo (Opcional - Camino B)
          </CardTitle>
          <CardDescription className="text-xs">
            Si algún día usás n8n, Make, Upload-Post o Postiz, pegás la URL del Webhook acá y tu app le manda todos los posteos automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Webhook URL</Label>
              <Input
                placeholder="https://n8n.tudominio.com/webhook/social-post"
                value={unifiedWebhook}
                onChange={(e) => setUnifiedWebhook(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">API Key / Token (Opcional)</Label>
              <Input
                placeholder="ak_secret_..."
                value={unifiedApiKey}
                onChange={(e) => setUnifiedApiKey(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSaveUnified}
              disabled={processingPlatform === 'Unified' || !unifiedWebhook.trim()}
            >
              {processingPlatform === 'Unified' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar Pasarela
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listado de Redes */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Gestionar Redes y Credenciales</CardTitle>
          <CardDescription>
            Ingresá los enlaces de tu negocio y las claves oficiales de publicación gratuita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {(Object.keys(platformDetails) as SocialPlatformName[]).map((platform) => {
                const { icon: Icon, colorClass, placeholder, hasDirectApi } = platformDetails[platform];
                const connection = getConnectionForPlatform(platform);
                const isConnected = !!connection?.isConnected;
                const isProcessing = processingPlatform === platform;
                const platformData = formState[platform] || {};
                const isApiOpen = !!showApiKeys[platform];

                return (
                  <Card key={platform} className="p-4 bg-muted/20 border-slate-100 space-y-3">
                    <div className="flex items-start gap-4">
                      <Icon className={`w-8 h-8 ${colorClass} flex-shrink-0 mt-1`} />
                      <div className="w-full space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{platform}</p>
                            {hasDirectApi && (
                              <Badge variant="outline" className="text-[10px] py-0 border-emerald-300 text-emerald-700 bg-emerald-50">
                                API Directa $0
                              </Badge>
                            )}
                          </div>
                          {hasDirectApi && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 text-purple-700 hover:text-purple-900 font-bold"
                              onClick={() => setShowApiKeys((prev) => ({ ...prev, [platform]: !prev[platform] }))}
                            >
                              {isApiOpen ? 'Ocultar Claves API' : '⚡ Configurar API Automática'}
                            </Button>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`url-${platform}`} className="text-xs text-muted-foreground">
                            {platform === 'WhatsApp' ? 'Número de Teléfono (con código de país)' : 'URL del Perfil o Canal'}
                          </Label>
                          <Input
                            id={`url-${platform}`}
                            placeholder={placeholder}
                            value={platformData.profileUrl || ''}
                            onChange={(e) => handleInputChange(platform, 'profileUrl', e.target.value)}
                            disabled={isProcessing}
                            className="text-xs"
                          />
                        </div>

                        {/* Campos de API Directa */}
                        {isApiOpen && hasDirectApi && (
                          <div className="space-y-3 p-3 rounded-lg bg-white border border-purple-100 text-xs">
                            <p className="font-bold text-purple-900 text-xs">Credenciales Oficiales de Desarrollador ($0)</p>

                            {platform === 'Facebook' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[11px] text-muted-foreground">Page ID de Facebook</Label>
                                  <Input
                                    value={platformData.pageId || ''}
                                    onChange={(e) => handleInputChange(platform, 'pageId', e.target.value)}
                                    placeholder="1234567890..."
                                    className="text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[11px] text-muted-foreground">Page Access Token</Label>
                                  <Input
                                    type="password"
                                    value={platformData.pageAccessToken || ''}
                                    onChange={(e) => handleInputChange(platform, 'pageAccessToken', e.target.value)}
                                    placeholder="EAA..."
                                    className="text-xs"
                                  />
                                </div>
                              </div>
                            )}

                            {platform === 'Instagram' && (
                              <div className="space-y-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-[11px] text-muted-foreground">Instagram Account ID</Label>
                                    <Input
                                      value={platformData.instagramAccountId || ''}
                                      onChange={(e) => handleInputChange(platform, 'instagramAccountId', e.target.value)}
                                      placeholder="178414..."
                                      className="text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-[11px] text-muted-foreground">Access Token de Meta</Label>
                                    <Input
                                      type="password"
                                      value={platformData.pageAccessToken || ''}
                                      onChange={(e) => handleInputChange(platform, 'pageAccessToken', e.target.value)}
                                      placeholder="EAA..."
                                      className="text-xs"
                                    />
                                  </div>
                                </div>

                                {connection?.lastTestedAt && (
                                  <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                                    connection.testStatus === 'success'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}>
                                    {connection.testStatus === 'success' ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    )}
                                    <div className="space-y-0.5">
                                      <p className="font-semibold">
                                        {connection.testStatus === 'success' ? 'Meta Graph API Verificada' : 'Estado de Conexión'}
                                      </p>
                                      <p className="text-[11px] opacity-90">{connection.testMessage}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end pt-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={handleTestInstagram}
                                    disabled={processingPlatform === 'Instagram'}
                                    className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                                  >
                                    {processingPlatform === 'Instagram' ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                    ) : (
                                      <Zap className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                                    )}
                                    Probar Conexión con Instagram
                                  </Button>
                                </div>
                              </div>
                            )}

                            {platform === 'TikTok' && (
                              <div>
                                <Label className="text-[11px] text-muted-foreground">TikTok Access Token (Direct Post Scope)</Label>
                                <Input
                                  type="password"
                                  value={platformData.accessToken || ''}
                                  onChange={(e) => handleInputChange(platform, 'accessToken', e.target.value)}
                                  placeholder="act.example_token..."
                                  className="text-xs"
                                />
                              </div>
                            )}

                            {platform === 'YouTube' && (
                              <div>
                                <Label className="text-[11px] text-muted-foreground">Google OAuth Access Token / API Key</Label>
                                <Input
                                  type="password"
                                  value={platformData.accessToken || ''}
                                  onChange={(e) => handleInputChange(platform, 'accessToken', e.target.value)}
                                  placeholder="ya29.a0..."
                                  className="text-xs"
                                />
                              </div>
                            )}

                            {platform === 'Google' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[11px] text-muted-foreground">Location ID de Google Maps</Label>
                                  <Input
                                    value={platformData.locationId || ''}
                                    onChange={(e) => handleInputChange(platform, 'locationId', e.target.value)}
                                    placeholder="locations/1234..."
                                    className="text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[11px] text-muted-foreground">Google Access Token</Label>
                                  <Input
                                    type="password"
                                    value={platformData.accessToken || ''}
                                    onChange={(e) => handleInputChange(platform, 'accessToken', e.target.value)}
                                    placeholder="ya29.a0..."
                                    className="text-xs"
                                  />
                                </div>
                              </div>
                            )}

                            {platform === 'Pinterest' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[11px] text-muted-foreground">Board ID del Tablero</Label>
                                  <Input
                                    value={platformData.boardId || ''}
                                    onChange={(e) => handleInputChange(platform, 'boardId', e.target.value)}
                                    placeholder="123456..."
                                    className="text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[11px] text-muted-foreground">Pinterest Access Token</Label>
                                  <Input
                                    type="password"
                                    value={platformData.accessToken || ''}
                                    onChange={(e) => handleInputChange(platform, 'accessToken', e.target.value)}
                                    placeholder="pina_..."
                                    className="text-xs"
                                  />
                                </div>
                              </div>
                            )}

                            {platform === 'Threads' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[11px] text-muted-foreground">Threads User ID</Label>
                                  <Input
                                    value={platformData.pageId || ''}
                                    onChange={(e) => handleInputChange(platform, 'pageId', e.target.value)}
                                    placeholder="12345..."
                                    className="text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[11px] text-muted-foreground">Threads Access Token</Label>
                                  <Input
                                    type="password"
                                    value={platformData.accessToken || ''}
                                    onChange={(e) => handleInputChange(platform, 'accessToken', e.target.value)}
                                    placeholder="THQ..."
                                    className="text-xs"
                                  />
                                </div>
                              </div>
                            )}

                            {platform === 'X' && (
                              <div>
                                <Label className="text-[11px] text-muted-foreground">X Bearer Token / Access Token</Label>
                                <Input
                                  type="password"
                                  value={platformData.accessToken || platformData.apiKey || ''}
                                  onChange={(e) => handleInputChange(platform, 'accessToken', e.target.value)}
                                  placeholder="AAAA..."
                                  className="text-xs"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                      {isConnected && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDisconnect(platform)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleSave(platform)}
                        disabled={isProcessing || !formState[platform]?.profileUrl?.trim()}
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
