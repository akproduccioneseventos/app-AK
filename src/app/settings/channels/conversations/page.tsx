'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  MessageCircle,
  Instagram,
  Facebook,
  Music,
  MessageSquare,
  Bot,
  User,
  RefreshCw,
  Loader2,
  CheckCheck,
  UserCheck,
  BotOff,
  X,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getChannelConversations,
  takeOverConversation,
  returnToBotConversation,
  closeConversation,
} from '@/app/actions/channels';
import type { ChannelConversation, ChannelType } from '@/types/channels';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const CHANNEL_ICONS: Record<ChannelType, React.ElementType> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music,
};

const CHANNEL_COLORS: Record<ChannelType, string> = {
  whatsapp: 'text-green-600 bg-green-100',
  instagram: 'text-pink-600 bg-pink-100',
  facebook: 'text-blue-600 bg-blue-100',
  tiktok: 'text-slate-800 bg-slate-100',
};

const CHANNEL_NAMES: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};

function ConversationStatusBadge({ status }: { status: ChannelConversation['status'] }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-700">Activa</Badge>;
    case 'waiting_human':
      return <Badge className="bg-amber-100 text-amber-700">Esperando humano</Badge>;
    case 'closed':
      return <Badge variant="secondary">Cerrada</Badge>;
  }
}

export default function ChannelConversationsPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [selected, setSelected] = useState<ChannelConversation | null>(null);
  const [filterChannel, setFilterChannel] = useState<ChannelType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'waiting_human' | 'closed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getChannelConversations();
      setConversations(data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las conversaciones.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const filteredConversations = conversations.filter(c => {
    if (filterChannel !== 'all' && c.channel !== filterChannel) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const handleTakeOver = async (convId: string) => {
    setActionLoading(true);
    try {
      const res = await takeOverConversation(convId);
      if (res.success) {
        toast({ title: '✅ Tomaste la conversación', description: 'Ahora vas a responder vos.' });
        await loadConversations();
        setSelected(prev => prev?.id === convId ? { ...prev, mode: 'human', status: 'waiting_human' } : prev);
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnToBot = async (convId: string) => {
    setActionLoading(true);
    try {
      const res = await returnToBotConversation(convId);
      if (res.success) {
        toast({ title: '✅ Conversación devuelta al bot', description: 'El bot retoma la atención.' });
        await loadConversations();
        setSelected(prev => prev?.id === convId ? { ...prev, mode: 'bot', status: 'active' } : prev);
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async (convId: string) => {
    setActionLoading(true);
    try {
      const res = await closeConversation(convId);
      if (res.success) {
        toast({ title: '✅ Conversación cerrada' });
        await loadConversations();
        if (selected?.id === convId) setSelected(null);
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/settings/channels">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Conversaciones Unificadas
          </h1>
          <p className="text-sm text-muted-foreground">Todos los canales en un solo lugar</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadConversations} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterChannel} onValueChange={val => setFilterChannel(val as ChannelType | 'all')}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los canales</SelectItem>
              <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
              <SelectItem value="instagram">📸 Instagram</SelectItem>
              <SelectItem value="facebook">📘 Facebook</SelectItem>
              <SelectItem value="tiktok">🎵 TikTok</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={filterStatus} onValueChange={val => setFilterStatus(val as typeof filterStatus)}>
          <SelectTrigger className="w-44 h-8">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="waiting_human">Esperando humano</SelectItem>
            <SelectItem value="closed">Cerradas</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="h-8 px-3 flex items-center">
          {filteredConversations.length} conversación{filteredConversations.length !== 1 ? 'es' : ''}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No hay conversaciones</h3>
            <p className="text-sm text-muted-foreground">
              Cuando los clientes te escriban por algún canal habilitado, las conversaciones aparecerán acá.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Conversation list */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {filteredConversations.map(conv => {
                    const Icon = CHANNEL_ICONS[conv.channel];
                    const colorClass = CHANNEL_COLORS[conv.channel];
                    const lastMsg = conv.messages[conv.messages.length - 1];
                    return (
                      <button
                        key={conv.id}
                        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${selected?.id === conv.id ? 'bg-muted' : ''}`}
                        onClick={() => setSelected(conv)}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`p-1.5 rounded-full shrink-0 ${colorClass}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-medium text-sm truncate">{conv.clientName}</p>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: es })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {CHANNEL_NAMES[conv.channel]} · {lastMsg?.content?.substring(0, 40)}...
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <ConversationStatusBadge status={conv.status} />
                              {conv.mode === 'bot' ? (
                                <Badge variant="outline" className="text-xs py-0">
                                  <Bot className="w-3 h-3 mr-1" />Bot
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs py-0">
                                  <User className="w-3 h-3 mr-1" />Humano
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Conversation detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card className="h-full">
                <CardHeader className="py-3 px-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = CHANNEL_ICONS[selected.channel];
                        return <Icon className={`w-4 h-4 ${CHANNEL_COLORS[selected.channel].split(' ')[0]}`} />;
                      })()}
                      <div>
                        <p className="font-semibold text-sm">{selected.clientName}</p>
                        <p className="text-xs text-muted-foreground">{CHANNEL_NAMES[selected.channel]} · {selected.clientId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ConversationStatusBadge status={selected.status} />
                      {selected.leadId && (
                        <Link href={`/crm?lead=${selected.leadId}`}>
                          <Button variant="outline" size="sm">Ver lead CRM</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <ScrollArea className="h-[350px] px-4 py-3">
                  <div className="space-y-3">
                    {selected.messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.from === 'client' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.from === 'client'
                              ? 'bg-muted'
                              : msg.from === 'bot'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {msg.from !== 'client' && (
                            <p className="text-xs opacity-70 mb-1 flex items-center gap-1">
                              {msg.from === 'bot' ? <><Bot className="w-3 h-3" /> Bot</> : <><User className="w-3 h-3" /> Vos</>}
                            </p>
                          )}
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-60 mt-1 text-right">
                            {new Date(msg.timestamp).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
                            {msg.read && msg.from !== 'client' && <CheckCheck className="inline w-3 h-3 ml-1" />}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator />
                <CardContent className="p-3">
                  <div className="flex gap-2 flex-wrap">
                    {selected.mode === 'bot' && selected.status !== 'closed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTakeOver(selected.id)}
                        disabled={actionLoading}
                      >
                        <UserCheck className="w-4 h-4 mr-1.5" />
                        Tomar conversación
                      </Button>
                    )}
                    {selected.mode === 'human' && selected.status !== 'closed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReturnToBot(selected.id)}
                        disabled={actionLoading}
                      >
                        <BotOff className="w-4 h-4 mr-1.5" />
                        Devolver al bot
                      </Button>
                    )}
                    {selected.status !== 'closed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleClose(selected.id)}
                        disabled={actionLoading}
                      >
                        <X className="w-4 h-4 mr-1.5" />
                        Cerrar conversación
                      </Button>
                    )}
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Seleccioná una conversación para verla</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
