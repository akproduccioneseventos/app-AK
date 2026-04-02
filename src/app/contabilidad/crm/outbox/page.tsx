'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MessageCircle, Loader2, Send, Calendar, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getScheduledMessages, markMessageAsSent, rescheduleMessage, cancelScheduledMessage } from '@/app/actions/scheduled-messages';
import type { ScheduledMessage } from '@/types/whatsapp-automation';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function OutboxPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; messageId: string; newDate: string }>({
    open: false,
    messageId: '',
    newDate: '',
  });

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getScheduledMessages();
      setMessages(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los mensajes.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async (msg: ScheduledMessage) => {
    const phone = msg.targetPhone?.replace(/\D/g, '') ?? '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg.messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(msg.messageText)}`;
    window.open(url, '_blank');
    const result = await markMessageAsSent(msg.id, 'usuario');
    if (result.success) {
      toast({ title: 'Marcado como enviado', description: `Mensaje para ${msg.targetName} marcado como enviado.` });
      fetchMessages();
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog.newDate) return;
    const result = await rescheduleMessage(rescheduleDialog.messageId, new Date(rescheduleDialog.newDate).toISOString());
    if (result.success) {
      toast({ title: 'Reprogramado', description: 'El mensaje fue reprogramado.' });
      setRescheduleDialog({ open: false, messageId: '', newDate: '' });
      fetchMessages();
    }
  };

  const handleCancel = async (messageId: string) => {
    const result = await cancelScheduledMessage(messageId);
    if (result.success) {
      toast({ title: 'Cancelado', description: 'El mensaje fue cancelado.' });
      fetchMessages();
    }
  };

  const pendingMessages = messages.filter(m => m.status === 'pendiente' || m.status === 'reprogramado');
  const overdueMessages = pendingMessages.filter(m => isPast(new Date(m.scheduledAt)) && !isToday(new Date(m.scheduledAt)));
  const todayMessages = pendingMessages.filter(m => isToday(new Date(m.scheduledAt)));
  const futureMessages = pendingMessages.filter(m => isFuture(new Date(m.scheduledAt)) && !isToday(new Date(m.scheduledAt)));
  const sentMessages = messages.filter(m => m.status === 'enviado').slice(-20);

  const MessageCard = ({ msg }: { msg: ScheduledMessage }) => (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{msg.targetName}</p>
          {msg.targetPhone && <p className="text-sm text-muted-foreground">{msg.targetPhone}</p>}
        </div>
        <Badge variant={msg.status === 'enviado' ? 'default' : isPast(new Date(msg.scheduledAt)) ? 'destructive' : 'secondary'}>
          {msg.status === 'enviado' ? 'Enviado' : msg.status === 'cancelado' ? 'Cancelado' : isPast(new Date(msg.scheduledAt)) ? 'Atrasado' : 'Pendiente'}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        <p><span className="font-medium">Tipo:</span> {msg.templateType}</p>
        <p><span className="font-medium">Programado:</span> {format(new Date(msg.scheduledAt), "d MMM yyyy HH:mm", { locale: es })}</p>
        {msg.sentAt && <p><span className="font-medium">Enviado:</span> {format(new Date(msg.sentAt), "d MMM yyyy HH:mm", { locale: es })} por {msg.sentBy}</p>}
      </div>
      <p className="text-sm bg-muted/50 rounded p-2 line-clamp-2">{msg.messageText}</p>
      {(msg.fiestaId || msg.leadId) && (
        <Link
          href={msg.fiestaId ? `/fiestas/nueva?fiestaId=${msg.fiestaId}` : `/contabilidad/crm?leadId=${msg.leadId}`}
          className="text-xs text-primary underline"
        >
          Ver {msg.fiestaId ? 'fiesta' : 'prospecto'} →
        </Link>
      )}
      {msg.status !== 'enviado' && msg.status !== 'cancelado' && (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleSend(msg)}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Enviar por WhatsApp
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRescheduleDialog({ open: true, messageId: msg.id, newDate: '' })}>
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Reprogramar
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleCancel(msg.id)}>
            <X className="w-3.5 h-3.5 mr-1.5" />
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Cola de Mensajes WhatsApp</h1>
            <p className="text-muted-foreground text-sm">Mensajes programados para enviar</p>
          </div>
        </div>
        <Link href="/contabilidad/crm/agenda">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Agenda
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          {overdueMessages.length > 0 && (
            <Card className="border-destructive shadow-lg">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Mensajes Atrasados ({overdueMessages.length})
                </CardTitle>
                <CardDescription>Estos mensajes debían enviarse en días anteriores.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overdueMessages.map(m => <MessageCard key={m.id} msg={m} />)}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                Para Hoy ({todayMessages.length})
              </CardTitle>
              <CardDescription>Mensajes a enviar hoy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayMessages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No hay mensajes para hoy.</p>
              ) : (
                todayMessages.map(m => <MessageCard key={m.id} msg={m} />)
              )}
            </CardContent>
          </Card>

          {futureMessages.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Próximos ({futureMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {futureMessages.map(m => <MessageCard key={m.id} msg={m} />)}
              </CardContent>
            </Card>
          )}

          {sentMessages.length > 0 && (
            <Card className="shadow-lg opacity-75">
              <CardHeader>
                <CardTitle className="text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Enviados Recientes ({sentMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sentMessages.map(m => <MessageCard key={m.id} msg={m} />)}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={rescheduleDialog.open} onOpenChange={(open) => setRescheduleDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar Mensaje</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nueva fecha y hora</Label>
            <Input
              type="datetime-local"
              value={rescheduleDialog.newDate}
              onChange={e => setRescheduleDialog(d => ({ ...d, newDate: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialog({ open: false, messageId: '', newDate: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleReschedule}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
