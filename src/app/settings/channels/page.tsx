'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  MessageCircle,
  Instagram,
  Facebook,
  Music,
  ArrowLeft,
  Settings,
  Bot,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getChannelsConfig, toggleChannel, saveGlobalChannelSettings, getChannelStats } from '@/app/actions/channels';
import type { MultiChannelConfig, ChannelConfig, ChannelStats, ChannelType } from '@/types/channels';

const CHANNEL_META: Record<ChannelType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  cost: string;
  requirement: string;
  configPath: string;
}> = {
  whatsapp: {
    icon: MessageCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    cost: '~$0.05/mensaje (Twilio o Meta)',
    requirement: 'Número de teléfono + cuenta Twilio o Meta Business',
    configPath: '/settings/channels/whatsapp',
  },
  instagram: {
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    cost: 'Gratis (Meta Graph API)',
    requirement: 'Cuenta Business + Página de Facebook vinculada',
    configPath: '/settings/channels/instagram',
  },
  facebook: {
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    cost: 'Gratis (Messenger API)',
    requirement: 'Página de Facebook',
    configPath: '/settings/channels/facebook',
  },
  tiktok: {
    icon: Music,
    color: 'text-slate-800',
    bgColor: 'bg-slate-50 border-slate-200',
    cost: 'Gratis (TikTok Business API)',
    requirement: 'Cuenta Business + aprobación de TikTok',
    configPath: '/settings/channels/tiktok',
  },
};

function StatusBadge({ status }: { status: ChannelConfig['status'] }) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Activo
        </Badge>
      );
    case 'configured':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Configurado (inactivo)
        </Badge>
      );
    case 'error':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          ⚪ No configurado
        </Badge>
      );
  }
}

export default function ChannelsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<MultiChannelConfig | null>(null);
  const [stats, setStats] = useState<ChannelStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState<ChannelType | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cfg, st] = await Promise.all([
        getChannelsConfig(),
        getChannelStats(),
      ]);
      setConfig(cfg);
      setStats(st);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar la configuración.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (channelId: ChannelType, newValue: boolean) => {
    const ch = config?.channels.find(c => c.id === channelId);
    if (newValue && !ch?.apiKey && !ch?.accessToken) {
      toast({
        title: 'Configurá el canal primero',
        description: `Antes de activar ${ch?.name}, configurá las credenciales del canal.`,
        variant: 'destructive',
      });
      return;
    }
    setToggling(channelId);
    try {
      const res = await toggleChannel(channelId, newValue);
      if (res.success) {
        setConfig(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            channels: prev.channels.map(c =>
              c.id === channelId
                ? { ...c, enabled: newValue, status: newValue ? 'active' : 'configured' }
                : c
            ),
          };
        });
        toast({
          title: newValue ? `${ch?.name} activado ✅` : `${ch?.name} desactivado`,
          description: newValue
            ? 'El bot ya está atendiendo mensajes en este canal.'
            : 'El canal fue desactivado correctamente.',
        });
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } finally {
      setToggling(null);
    }
  };

  const handleGlobalModeChange = async (mode: 'automatic' | 'semi-automatic' | 'manual') => {
    if (!config) return;
    setConfig(prev => prev ? { ...prev, globalMode: mode } : prev);
    await saveGlobalChannelSettings({ globalMode: mode });
  };

  const handleSharedScheduleToggle = async (value: boolean) => {
    if (!config) return;
    setConfig(prev => prev ? { ...prev, sharedSchedule: value } : prev);
    await saveGlobalChannelSettings({ sharedSchedule: value });
  };

  const handleGlobalIntegrationToggle = async (
    key: keyof MultiChannelConfig['globalIntegrations'],
    value: boolean
  ) => {
    if (!config) return;
    const updated = { ...config.globalIntegrations, [key]: value };
    setConfig(prev => prev ? { ...prev, globalIntegrations: updated } : prev);
    await saveGlobalChannelSettings({ globalIntegrations: updated });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground animate-pulse">Cargando canales...</div>
      </div>
    );
  }

  const totalActive = config?.channels.filter(c => c.enabled).length ?? 0;
  const totalConversations = stats.reduce((sum, s) => sum + s.totalConversations, 0);
  const totalLeads = stats.reduce((sum, s) => sum + s.leadsGenerated, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            Canales de Comunicación
          </h1>
          <p className="text-muted-foreground mt-1">
            Conectá tus redes sociales para atender clientes automáticamente con IA
          </p>
        </div>
      </div>

      {/* Summary stats */}
      {totalConversations > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">{totalActive}</div>
            <div className="text-sm text-muted-foreground">Canales activos</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">{totalConversations}</div>
            <div className="text-sm text-muted-foreground">Conversaciones</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">{totalLeads}</div>
            <div className="text-sm text-muted-foreground">Leads generados</div>
          </Card>
        </div>
      )}

      {/* Channel cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Canales disponibles</h2>
        <div className="space-y-3">
          {config?.channels.map(channel => {
            const meta = CHANNEL_META[channel.id];
            const Icon = meta.icon;
            const channelStats = stats.find(s => s.channel === channel.id);
            return (
              <Card key={channel.id} className={`border ${channel.enabled ? meta.bgColor : 'border-border'} transition-colors`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${channel.enabled ? 'bg-white shadow-sm' : 'bg-muted'}`}>
                      <Icon className={`w-5 h-5 ${channel.enabled ? meta.color : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{channel.name}</h3>
                        <StatusBadge status={channel.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        💰 {meta.cost}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        📋 {meta.requirement}
                      </p>
                      {channelStats && channelStats.totalConversations > 0 && (
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {channelStats.totalConversations} conversaciones
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {channelStats.leadsGenerated} leads
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={val => handleToggle(channel.id, val)}
                        disabled={toggling === channel.id}
                      />
                      <Link href={meta.configPath}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Settings className="w-3.5 h-3.5" />
                          Configurar
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Unified conversations link */}
      {totalConversations > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Panel unificado de conversaciones</p>
                <p className="text-xs text-muted-foreground">
                  Ves todos los chats de todos los canales en un solo lugar
                </p>
              </div>
            </div>
            <Link href="/settings/channels/conversations">
              <Button size="sm" className="gap-1">
                <BarChart3 className="w-4 h-4" />
                Ver conversaciones
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Shared configuration */}
      <div>
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Configuración compartida
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Estas opciones se aplican a todos los canales activos salvo que cada uno tenga su propio override.
        </p>
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* AI engine */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <Label>Motor IA</Label>
              </div>
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Asistente AK (Gemini)
              </Badge>
            </div>

            <Separator />

            {/* Global mode */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>Modo global</Label>
                <p className="text-xs text-muted-foreground">Define cómo responde el bot en todos los canales</p>
              </div>
              <Select
                value={config?.globalMode ?? 'semi-automatic'}
                onValueChange={val => handleGlobalModeChange(val as 'automatic' | 'semi-automatic' | 'manual')}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">🤖 Automático</SelectItem>
                  <SelectItem value="semi-automatic">👥 Semi-automático</SelectItem>
                  <SelectItem value="manual">✋ Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Integrations */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Integraciones</Label>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">CRM: crear leads automáticos</p>
                  <p className="text-xs text-muted-foreground">Cada nuevo chat genera un lead en el CRM</p>
                </div>
                <Switch
                  checked={config?.globalIntegrations.createCrmLead ?? true}
                  onCheckedChange={val => handleGlobalIntegrationToggle('createCrmLead', val)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Marketing: seguimiento automático</p>
                  <p className="text-xs text-muted-foreground">Envía mensajes de seguimiento a leads inactivos</p>
                </div>
                <Switch
                  checked={config?.globalIntegrations.sendMarketingFollowUp ?? true}
                  onCheckedChange={val => handleGlobalIntegrationToggle('sendMarketingFollowUp', val)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Historial: guardar mensajes</p>
                  <p className="text-xs text-muted-foreground">Registra el historial de conversaciones</p>
                </div>
                <Switch
                  checked={config?.globalIntegrations.logMessageHistory ?? true}
                  onCheckedChange={val => handleGlobalIntegrationToggle('logMessageHistory', val)}
                />
              </div>
            </div>

            <Separator />

            {/* Shared schedule */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Label>Horario compartido</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {config?.globalSchedule
                    ? `Lun-Vie ${config.globalSchedule.startTime}–${config.globalSchedule.endTime} hs`
                    : 'Lun-Vie 09:00–18:00 hs'}
                </p>
              </div>
              <Switch
                checked={config?.sharedSchedule ?? true}
                onCheckedChange={handleSharedScheduleToggle}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
