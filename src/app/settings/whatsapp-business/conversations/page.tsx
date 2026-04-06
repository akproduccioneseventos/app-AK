'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, MessageCircle, Loader2, Bot, Hand, User, Send,
  ExternalLink, RefreshCw, UserCheck, PhoneCall
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getWhatsAppConversations,
  getWhatsAppConversation,
  sendWhatsAppMessage,
  takeOverConversation,
  returnToBotConversation,
} from '@/app/actions/whatsapp';
import type { WhatsAppConversation, WhatsAppMessage } from '@/types/whatsapp';
import { cn } from '@/lib/utils';

function statusBadge(status: WhatsAppConversation['status']) {
  if (status === 'active') return <Badge className="bg-green-100 text-green-700 border-green-200">Activa</Badge>;
  if (status === 'waiting_human') return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Esperando humano</Badge>;
  return <Badge variant="secondary">Cerrada</Badge>;
}

function modeBadge(mode: WhatsAppConversation['mode']) {
  if (mode === 'bot') return <Badge variant="outline" className="text-xs"><Bot className="w-3 h-3 mr-1" />Bot</Badge>;
  return <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700"><Hand className="w-3 h-3 mr-1" />Humano</Badge>;
}

export default function WhatsAppConversationsPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selected, setSelected] = useState<WhatsAppConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await getWhatsAppConversations();
      setConversations(data);
      if (selected) {
        const refreshed = data.find(c => c.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [selected]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages.length]);

  const handleSelect = async (conv: WhatsAppConversation) => {
    const full = await getWhatsAppConversation(conv.id);
    setSelected(full ?? conv);
  };

  const handleSend = async () => {
    if (!selected || !message.trim()) return;
    setIsSending(true);
    try {
      const res = await sendWhatsAppMessage(selected.id, message.trim());
      if (res.success) {
        setMessage('');
        await load();
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleTakeOver = async () => {
    if (!selected) return;
    setIsActing(true);
    try {
      const res = await takeOverConversation(selected.id);
      if (res.success) {
        toast({ title: '✅ Conversación tomada', description: 'Ahora sos vos quien responde.' });
        await load();
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } finally {
      setIsActing(false);
    }
  };

  const handleReturnBot = async () => {
    if (!selected) return;
    setIsActing(true);
    try {
      const res = await returnToBotConversation(selected.id);
      if (res.success) {
        toast({ title: '🤖 Devuelta al bot', description: 'El bot retomó la conversación.' });
        await load();
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-xl">
            <MessageCircle className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Conversaciones WhatsApp</h1>
            <p className="text-sm text-muted-foreground">{conversations.length} conversaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setIsLoading(true); load(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Link href="/settings/whatsapp-business">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Configuración
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-semibold text-muted-foreground">No hay conversaciones todavía</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cuando llegue el primer mensaje de WhatsApp, aparecerá acá.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Conversations list */}
          <div className="md:col-span-1 space-y-2">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2 pr-2">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelect(conv)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      selected?.id === conv.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{conv.clientName}</p>
                      {statusBadge(conv.status)}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <PhoneCall className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">{conv.clientPhone}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      {modeBadge(conv.mode)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.updatedAt).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {conv.leadId && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Lead en CRM
                      </p>
                    )}
                    {conv.messages.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {conv.messages[conv.messages.length - 1]?.content}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat panel */}
          <div className="md:col-span-2">
            {!selected ? (
              <Card className="h-full flex items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Seleccioná una conversación para ver el chat</p>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex flex-col">
                {/* Chat header */}
                <CardHeader className="pb-3 border-b shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{selected.clientName}</CardTitle>
                        <CardDescription className="text-xs">{selected.clientPhone}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(selected.status)}
                      {modeBadge(selected.mode)}
                      {selected.leadId && (
                        <Link href={`/contabilidad/crm`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver lead CRM
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    {selected.mode === 'bot' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTakeOver}
                        disabled={isActing}
                        className="text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                      >
                        {isActing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Hand className="w-3.5 h-3.5 mr-1.5" />}
                        Tomar conversación
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReturnBot}
                        disabled={isActing}
                        className="text-green-700 border-green-300 hover:bg-green-50"
                      >
                        {isActing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Bot className="w-3.5 h-3.5 mr-1.5" />}
                        Devolver al bot
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {selected.messages.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">Sin mensajes</p>
                    ) : (
                      selected.messages.map(msg => (
                        <MessageBubble key={msg.id} msg={msg} />
                      ))
                    )}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t shrink-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Escribí un mensaje..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      disabled={isSending}
                    />
                    <Button onClick={handleSend} disabled={isSending || !message.trim()} size="icon">
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  {selected.mode === 'bot' && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      El bot está respondiendo. Hacé click en "Tomar conversación" para responder manualmente.
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: WhatsAppMessage }) {
  const isClient = msg.from === 'client';
  const isBot = msg.from === 'bot';

  return (
    <div className={cn('flex', isClient ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
          isClient
            ? 'bg-white border text-slate-800'
            : isBot
              ? 'bg-green-500 text-white'
              : 'bg-indigo-600 text-white'
        )}
      >
        {!isClient && (
          <p className="text-xs opacity-75 mb-0.5 flex items-center gap-1">
            {isBot ? <Bot className="w-3 h-3" /> : <Hand className="w-3 h-3" />}
            {isBot ? 'Bot' : 'Vos'}
          </p>
        )}
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className={cn('text-xs mt-1 opacity-60', isClient ? 'text-right' : '')}>
          {new Date(msg.timestamp).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
