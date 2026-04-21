'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, MessageCircle, Save, Loader2, Eye, EyeOff, AlertTriangle,
  Bot, Hand, Zap, Clock, Link as LinkIcon, Users, BarChart3, QrCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getWhatsAppConfig, saveWhatsAppConfig, getWhatsAppStats } from '@/app/actions/whatsapp';
import type { WhatsAppConfig, WhatsAppStats } from '@/types/whatsapp';
import { QRCodeSVG } from 'qrcode.react';

const DAYS = [
  { id: 'mon', label: 'Lun' },
  { id: 'tue', label: 'Mar' },
  { id: 'wed', label: 'Mié' },
  { id: 'thu', label: 'Jue' },
  { id: 'fri', label: 'Vie' },
  { id: 'sat', label: 'Sáb' },
  { id: 'sun', label: 'Dom' },
];

export default function WhatsAppBusinessPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cfg, st] = await Promise.all([getWhatsAppConfig(), getWhatsAppStats()]);
      setConfig(cfg);
      setStats(st);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar la configuración.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof WhatsAppConfig>(key: K, value: WhatsAppConfig[K]) =>
    setConfig(prev => prev ? { ...prev, [key]: value } : prev);

  const setMsg = (key: keyof WhatsAppConfig['messages'], value: string) =>
    setConfig(prev => prev ? { ...prev, messages: { ...prev.messages, [key]: value } } : prev);

  const setSched = (key: keyof WhatsAppConfig['schedule'], value: string | string[]) =>
    setConfig(prev => prev ? { ...prev, schedule: { ...prev.schedule, [key]: value } } : prev);

  const setInt = (key: keyof WhatsAppConfig['integrations'], value: boolean) =>
    setConfig(prev => prev ? { ...prev, integrations: { ...prev.integrations, [key]: value } } : prev);

  const toggleDay = (day: string) => {
    if (!config) return;
    const days = config.schedule.days.includes(day)
      ? config.schedule.days.filter(d => d !== day)
      : [...config.schedule.days, day];
    setSched('days', days);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveWhatsAppConfig(config);
      if (result.success) {
        toast({ title: '✅ Configuración guardada', description: 'Las opciones del bot de WhatsApp fueron actualizadas.' });
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo guardar.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error inesperado al guardar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook`
    : '/api/whatsapp/webhook';

  const missingApiKey = config.enabled && !config.apiKey.trim();
  const qrPhone = config.phoneNumber.replace(/\D/g, '');
  const whatsAppWebUrl = qrPhone ? `https://web.whatsapp.com/send?phone=${qrPhone}` : '';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-xl">
            <MessageCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">WhatsApp Business Bot</h1>
            <p className="text-muted-foreground text-sm">Atendé clientes automáticamente desde WhatsApp</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings/whatsapp-business/conversations">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Ver conversaciones
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" disabled={isSaving}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Conversaciones', value: stats.totalConversations, icon: MessageCircle },
            { label: 'Activas', value: stats.activeConversations, icon: Zap },
            { label: 'Leads generados', value: stats.leadsGenerated, icon: Users },
            { label: 'Tiempo respuesta', value: stats.avgResponseTime, icon: Clock },
          ].map(s => (
            <Card key={s.label} className="p-3">
              <div className="flex items-center gap-2">
                <s.icon className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Toggle ON/OFF */}
        <Card className="shadow-lg border-2 border-dashed border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-600" />
              Estado del Bot
              {config.enabled ? (
                <Badge className="bg-green-100 text-green-700 border-green-300 ml-2">Activo</Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">Inactivo</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <Label htmlFor="bot-enabled" className="flex flex-col gap-1 cursor-pointer">
                <span className="text-base font-semibold">
                  {config.enabled ? '🟢 Bot activado' : '⚫ Bot desactivado'}
                </span>
                <span className="font-normal text-muted-foreground text-sm">
                  {config.enabled
                    ? 'El bot está respondiendo mensajes de WhatsApp.'
                    : 'Cuando contrates un servicio de WhatsApp API (Twilio, Meta, etc.), configurá tu API key acá y activá el bot.'}
                </span>
              </Label>
              <Switch
                id="bot-enabled"
                checked={config.enabled}
                onCheckedChange={val => set('enabled', val)}
                disabled={isSaving}
              />
            </div>

            {missingApiKey && (
              <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>El bot está activado pero no tiene una API Key configurada. Agregá tu API key para que funcione.</span>
              </div>
            )}

            {!config.enabled && (
              <div className="mt-3 p-4 bg-slate-50 border rounded-lg text-sm text-slate-600">
                <p className="font-semibold mb-2">📋 Vista previa del flujo cuando esté activo:</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Cliente escribe a tu WhatsApp Business</li>
                  <li>El bot responde automáticamente según el modo configurado</li>
                  <li>Se crea un lead en el CRM automáticamente</li>
                  <li>Recibís una notificación si necesita atención humana</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection settings */}
        <Card className={`shadow-lg transition-opacity ${!config.enabled ? 'opacity-60' : ''}`}>
          <CardHeader>
            <CardTitle className="font-headline text-xl">Conexión y API</CardTitle>
            <CardDescription>Configurá tu número y las credenciales de tu proveedor de WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de WhatsApp Business</Label>
                <Input
                  id="phone"
                  placeholder="+598 99 999 999"
                  value={config.phoneNumber}
                  onChange={e => set('phoneNumber', e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Proveedor</Label>
                <Select
                  value={config.provider}
                  onValueChange={val => set('provider', val as WhatsAppConfig['provider'])}
                  disabled={isSaving}
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta">Meta (WhatsApp Business API)</SelectItem>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="baileys">Baileys (No oficial - Gratis)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apikey">API Key</Label>
              <div className="relative">
                <Input
                  id="apikey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Pegá tu API Key acá..."
                  value={config.apiKey}
                  onChange={e => set('apiKey', e.target.value)}
                  disabled={isSaving}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowApiKey(v => !v)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-token">Token de Verificación del Webhook</Label>
              <Input
                id="verify-token"
                placeholder="Tu token secreto para verificar el webhook..."
                value={config.verifyToken}
                onChange={e => set('verifyToken', e.target.value)}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Ingresá este mismo token en la configuración de webhooks de tu proveedor (Meta, Twilio, etc.).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook">URL del Webhook</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook"
                  readOnly
                  value={webhookUrl}
                  className="bg-muted font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(webhookUrl); toast({ title: 'Copiado', description: 'URL copiada al portapapeles.' }); }}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copiá esta URL y pegala en la configuración de webhooks de tu proveedor.
              </p>
            </div>
          </CardContent>
        </Card>

        {config.mode === 'semi-automatic' && (
          <Card className={`shadow-lg transition-opacity ${!config.enabled ? 'opacity-60' : ''}`}>
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <QrCode className="w-5 h-5" /> Acceso semi-automático con QR
              </CardTitle>
              <CardDescription>
                Escaneá este QR con WhatsApp Web para tomar rápidamente conversaciones en modo semi-automático.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {whatsAppWebUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="rounded-xl border bg-white p-3">
                    <QRCodeSVG value={whatsAppWebUrl} size={160} />
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>1) Abrí WhatsApp en tu teléfono.</p>
                    <p>2) Escaneá el código para abrir WhatsApp Web con el número configurado.</p>
                    <a
                      href={whatsAppWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-primary underline underline-offset-2"
                    >
                      Abrir también en nueva pestaña
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                  Ingresá primero un número de WhatsApp Business para generar el QR.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Operating mode */}
        <Card className={`shadow-lg transition-opacity ${!config.enabled ? 'opacity-60' : ''}`}>
          <CardHeader>
            <CardTitle className="font-headline text-xl">Modo de Operación</CardTitle>
            <CardDescription>Elegí cómo querés que el bot maneje las conversaciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={config.mode}
              onValueChange={val => set('mode', val as WhatsAppConfig['mode'])}
              disabled={isSaving}
              className="space-y-3"
            >
              {[
                {
                  value: 'automatic',
                  icon: <Zap className="w-5 h-5 text-primary shrink-0" />,
                  title: 'Automático',
                  desc: 'El bot responde todo. Solo te notifica cuando no sabe responder.',
                },
                {
                  value: 'semi-automatic',
                  icon: <Bot className="w-5 h-5 text-green-600 shrink-0" />,
                  title: 'Semi-automático (recomendado)',
                  desc: 'El bot responde preguntas frecuentes y consultas de precios. Te notifica para que tomes la conversación cuando el cliente quiere algo específico.',
                },
                {
                  value: 'manual',
                  icon: <Hand className="w-5 h-5 text-orange-500 shrink-0" />,
                  title: 'Manual',
                  desc: 'El bot solo registra el mensaje y te notifica. No responde nada automáticamente.',
                },
              ].map(opt => (
                <label
                  key={opt.value}
                  htmlFor={`mode-${opt.value}`}
                  className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    config.mode === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <RadioGroupItem value={opt.value} id={`mode-${opt.value}`} className="mt-1" />
                  {opt.icon}
                  <div>
                    <p className="font-semibold text-sm">{opt.title}</p>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Custom messages */}
        <Card className={`shadow-lg transition-opacity ${!config.enabled ? 'opacity-60' : ''}`}>
          <CardHeader>
            <CardTitle className="font-headline text-xl">Mensajes Personalizables</CardTitle>
            <CardDescription>Textos que el bot usa en distintas situaciones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { key: 'welcome' as const, label: 'Mensaje de Bienvenida', rows: 2 },
              { key: 'offHours' as const, label: 'Fuera de Horario', rows: 2 },
              { key: 'followUp' as const, label: 'Seguimiento Automático', rows: 2 },
              { key: 'farewell' as const, label: 'Despedida', rows: 2 },
            ].map(({ key, label, rows }) => (
              <div key={key} className="space-y-2">
                <Label className="font-semibold">{label}</Label>
                <Textarea
                  value={config.messages[key]}
                  onChange={e => setMsg(key, e.target.value)}
                  rows={rows}
                  disabled={isSaving}
                  className="resize-none"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className={`shadow-lg transition-opacity ${!config.enabled ? 'opacity-60' : ''}`}>
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <Clock className="w-5 h-5" /> Horario de Atención
            </CardTitle>
            <CardDescription>El bot responde mensajes solo en este horario. Fuera de él, envía el mensaje de fuera de horario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Días activos</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    disabled={isSaving}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors ${
                      config.schedule.days.includes(d.id)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Hora de inicio</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={config.schedule.startTime}
                  onChange={e => setSched('startTime', e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">Hora de cierre</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={config.schedule.endTime}
                  onChange={e => setSched('endTime', e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Integraciones</CardTitle>
            <CardDescription>Conectá el bot con los demás módulos de la app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: 'createCrmLead' as const,
                title: 'Crear lead en CRM automáticamente',
                desc: 'Cada nuevo contacto de WhatsApp se registra como prospecto en el CRM.',
              },
              {
                key: 'sendMarketingFollowUp' as const,
                title: 'Enviar seguimiento de Marketing',
                desc: 'Los leads sin respuesta reciben un mensaje de seguimiento automático.',
              },
              {
                key: 'logMessageHistory' as const,
                title: 'Registrar historial de mensajes',
                desc: 'Guardá todas las conversaciones para revisarlas después.',
              },
            ].map(({ key, title, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="font-semibold text-sm cursor-pointer">{title}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={config.integrations[key]}
                  onCheckedChange={val => setInt(key, val)}
                  disabled={isSaving}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
