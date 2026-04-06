'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Instagram, Save, Loader2, TestTube2, Info, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getChannelsConfig, saveChannelConfig, testChannelConnection } from '@/app/actions/channels';
import type { ChannelConfig } from '@/types/channels';

export default function InstagramChannelPage() {
  const { toast } = useToast();
  const [channel, setChannel] = useState<ChannelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const config = await getChannelsConfig();
      const ch = config.channels.find(c => c.id === 'instagram');
      if (ch) setChannel(ch);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar la configuración.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    if (!channel) return;
    setIsSaving(true);
    try {
      const res = await saveChannelConfig('instagram', channel);
      if (res.success) {
        toast({ title: '✅ Guardado', description: 'Configuración de Instagram guardada correctamente.' });
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const res = await testChannelConnection('instagram');
      toast({
        title: res.success ? '✅ Prueba exitosa' : '❌ Prueba fallida',
        description: res.message,
        variant: res.success ? 'default' : 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/channels/instagram/webhook`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Copiado', description: 'URL del webhook copiada al portapapeles.' });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!channel) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/settings/channels">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Instagram className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline">Instagram DM Bot</h1>
            <p className="text-sm text-muted-foreground">Respondé mensajes directos de Instagram con IA</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <Card className="border-pink-200 bg-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Estado del canal</p>
              <p className="text-sm text-muted-foreground">
                {channel.enabled ? 'El bot está activo y atendiendo DMs' : 'El bot está desactivado'}
              </p>
            </div>
            <Switch
              checked={channel.enabled}
              onCheckedChange={val => setChannel(c => c ? { ...c, enabled: val } : c)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Setup instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            📸 Cómo configurar Instagram DM Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
            <li>Asegurate de tener una cuenta de <strong>Instagram Business</strong></li>
            <li>Conectá tu Instagram a una <strong>Página de Facebook</strong></li>
            <li>Andá a <strong>developers.facebook.com</strong> y creá una app</li>
            <li>Habilitá el producto <strong>&quot;Instagram API&quot;</strong></li>
            <li>En &quot;Webhooks&quot;, pegá la URL del webhook que te mostramos abajo</li>
            <li>Generá un <strong>token de acceso de página</strong> con permisos de mensajes</li>
            <li>Pegá el token acá abajo y activá el toggle ✅</li>
          </ol>
          <Separator className="my-2" />
          <p className="text-green-700 font-medium">💰 Costo: Gratis (Meta Graph API)</p>
        </CardContent>
      </Card>

      {/* Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credenciales de API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Access Token de la Página</Label>
            <Input
              className="mt-1"
              type="password"
              placeholder="Tu token de acceso de página de Facebook/Instagram"
              value={channel.accessToken ?? ''}
              onChange={e => setChannel(c => c ? { ...c, accessToken: e.target.value } : c)}
            />
          </div>
          <div>
            <Label>Instagram Business Account ID / Page ID</Label>
            <Input
              className="mt-1"
              placeholder="ID de tu cuenta de Instagram Business"
              value={channel.pageId ?? ''}
              onChange={e => setChannel(c => c ? { ...c, pageId: e.target.value } : c)}
            />
          </div>
          <div>
            <Label>App Secret (opcional, para verificar firmas)</Label>
            <Input
              className="mt-1"
              type="password"
              placeholder="App Secret de tu app de Facebook"
              value={channel.apiSecret ?? ''}
              onChange={e => setChannel(c => c ? { ...c, apiSecret: e.target.value } : c)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook URL</CardTitle>
          <CardDescription>Pegá esta URL en tu app de Facebook Developers → Webhooks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted p-2 rounded">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/channels/instagram/webhook` : '/api/channels/instagram/webhook'}
            </code>
            <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div>
            <Label>Token de verificación del webhook</Label>
            <Input
              className="mt-1"
              placeholder="Token secreto para verificar el webhook"
              value={channel.webhookVerifyToken ?? ''}
              onChange={e => setChannel(c => c ? { ...c, webhookVerifyToken: e.target.value } : c)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mode */}
      <Card>
        <CardHeader><CardTitle className="text-base">Modo de atención</CardTitle></CardHeader>
        <CardContent>
          <Select
            value={channel.mode}
            onValueChange={val => setChannel(c => c ? { ...c, mode: val as ChannelConfig['mode'] } : c)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="automatic">🤖 Automático — bot responde todo</SelectItem>
              <SelectItem value="semi-automatic">👥 Semi-automático — bot + vos</SelectItem>
              <SelectItem value="manual">✋ Manual — solo notifica</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader><CardTitle className="text-base">Mensajes personalizables</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {(['welcome', 'offHours', 'followUp', 'farewell'] as const).map(key => (
            <div key={key}>
              <Label>{key === 'welcome' ? 'Bienvenida' : key === 'offHours' ? 'Fuera de horario' : key === 'followUp' ? 'Seguimiento' : 'Despedida'}</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={channel.messages[key]}
                onChange={e => setChannel(c => c ? { ...c, messages: { ...c.messages, [key]: e.target.value } } : c)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar configuración
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={isTesting}>
          {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube2 className="w-4 h-4 mr-2" />}
          Probar conexión
        </Button>
      </div>
    </div>
  );
}
