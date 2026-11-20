'use client';

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import type { CrmLead, CrmMensaje, CrmMensajeCanal, CrmTimelineItem } from '@/types/crm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Calendar,
  FileText,
  FilePlus2,
  UserPlus,
  ArrowRightLeft,
  FileSignature,
  StickyNote,
  Edit3,
  Save,
  X,
  Loader2,
  Instagram,
  MessageSquare,
  Sparkles,
  History,
  HelpCircle,
  Check,
  UserX,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  confirmarProspectoDudoso,
  devolverCharlaAlAsistenteAction,
  recordWhatsAppOpened,
  updateCrmLeadField,
} from '@/app/actions/crm';
import { buildWhatsAppLink } from '@/lib/commercial/contact';
import { useToast } from '@/hooks/use-toast';

interface CrmLeadTimelineProps {
  lead: CrmLead;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdate?: (lead: CrmLead) => void;
}

function getTimelineIcon(type: CrmTimelineItem['type']) {
  switch (type) {
    case 'lead_created': return <UserPlus className="w-3.5 h-3.5" />;
    case 'stage_change': return <ArrowRightLeft className="w-3.5 h-3.5" />;
    case 'meeting_scheduled': return <Calendar className="w-3.5 h-3.5" />;
    case 'presupuesto_created': return <FilePlus2 className="w-3.5 h-3.5" />;
    case 'contract_uploaded': return <FileSignature className="w-3.5 h-3.5" />;
    case 'whatsapp_sent':
    case 'whatsapp_opened': return <MessageCircle className="w-3.5 h-3.5" />;
    case 'note_added': return <StickyNote className="w-3.5 h-3.5" />;
    default: return <FileText className="w-3.5 h-3.5" />;
  }
}

function getTimelineColor(type: CrmTimelineItem['type']) {
  switch (type) {
    case 'lead_created': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'stage_change': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'meeting_scheduled': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'presupuesto_created': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'contract_uploaded': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'whatsapp_sent': return 'bg-green-100 text-green-700 border-green-200';
    case 'whatsapp_opened': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'note_added': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-muted text-muted-foreground border-muted';
  }
}

function buildTimeline(lead: CrmLead): CrmTimelineItem[] {
  const items: CrmTimelineItem[] = [];

  // Seed from explicit timeline array
  if (lead.timeline?.length) {
    items.push(...lead.timeline);
  }

  // Derive from history if present
  if (lead.history?.length) {
    for (const h of lead.history) {
      if (!items.some(i => i.type === 'stage_change' && i.meta?.stageId === h.stageId && i.timestamp === h.timestamp)) {
        items.push({
          id: `hist_${h.stageId}_${h.timestamp}`,
          type: 'stage_change',
          timestamp: h.timestamp,
          description: `Movido a etapa: ${h.stageName}`,
          meta: { stageId: h.stageId },
        });
      }
    }
  }

  // Derive creation event if not present
  if (!items.some(i => i.type === 'lead_created')) {
    items.push({
      id: `created_${lead.id}`,
      type: 'lead_created',
      timestamp: lead.createdAt,
      description: 'Prospecto creado',
    });
  }

  // Derive meeting from followUpDate if not already in timeline with this specific date
  if (lead.followUpDate && !items.some(i => i.type === 'meeting_scheduled' && i.meta?.date === lead.followUpDate)) {
    items.push({
      id: `meeting_${lead.id}`,
      type: 'meeting_scheduled',
      timestamp: lead.followUpDate,
      description: `Cita/Reunión agendada: ${new Date(lead.followUpDate).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}hs`,
      meta: { date: lead.followUpDate },
    });
  }

  // Derive presupuesto event
  if (lead.presupuestoId && !items.some(i => i.type === 'presupuesto_created')) {
    items.push({
      id: `pres_${lead.presupuestoId}`,
      type: 'presupuesto_created',
      timestamp: lead.updatedAt,
      description: `Presupuesto vinculado${lead.presupuestoEstado ? ` (${lead.presupuestoEstado})` : ''}`,
    });
  }

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function getChannelMeta(canal: CrmMensajeCanal): { label: string; icon: React.ReactNode; badgeClass: string } {
  switch (canal) {
    case 'whatsapp':
      return {
        label: 'WhatsApp',
        icon: <MessageCircle className="w-3.5 h-3.5 text-green-600" />,
        badgeClass: 'bg-green-50 text-green-700 border-green-200',
      };
    case 'instagram_dm':
      return {
        label: 'Instagram DM',
        icon: <Instagram className="w-3.5 h-3.5 text-pink-600" />,
        badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
      };
    case 'messenger':
      return {
        label: 'Messenger',
        icon: <MessageSquare className="w-3.5 h-3.5 text-blue-600" />,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'instagram_comentario':
      return {
        label: 'Comentario IG',
        icon: <Instagram className="w-3.5 h-3.5 text-fuchsia-600" />,
        badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      };
    case 'facebook_comentario':
      return {
        label: 'Comentario FB',
        icon: <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />,
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    case 'simulador':
      return {
        label: 'Simulador',
        icon: <Sparkles className="w-3.5 h-3.5 text-amber-600" />,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'rescatado':
      return {
        label: 'Rescatado',
        icon: <History className="w-3.5 h-3.5 text-slate-600" />,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      };
  }
}

export const CrmLeadTimeline = memo(function CrmLeadTimeline({ lead, isOpen, onOpenChange, onLeadUpdate }: CrmLeadTimelineProps) {
  const items = buildTimeline(lead);
  const conversacionOrdenada = useMemo<CrmMensaje[]>(() => {
    const lista = Array.isArray(lead.conversacion) ? [...lead.conversacion] : [];
    return lista.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [lead.conversacion]);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(lead.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isResolvingDudoso, setIsResolvingDudoso] = useState(false);
  const [dudosoLocal, setDudosoLocal] = useState(Boolean(lead.esProspectoDudoso));
  const [atiendeLocal, setAtiendeLocal] = useState<'asistente' | 'persona' | undefined>(lead.atiende);
  const [isDevolviendoAsistente, setIsDevolviendoAsistente] = useState(false);
  const [draftReply, setDraftReply] = useState(lead.borradorRespuesta || '');
  const { toast } = useToast();

  useEffect(() => {
    setDudosoLocal(Boolean(lead.esProspectoDudoso));
  }, [lead.esProspectoDudoso]);

  useEffect(() => {
    setAtiendeLocal(lead.atiende);
  }, [lead.atiende]);

  useEffect(() => {
    setDraftReply(lead.borradorRespuesta || '');
  }, [lead.borradorRespuesta]);

  const handleDevolverAlAsistente = useCallback(async () => {
    setIsDevolviendoAsistente(true);
    try {
      const res = await devolverCharlaAlAsistenteAction(lead.id);
      if (res.success && res.lead) {
        setAtiendeLocal('asistente');
        toast({ description: 'La charla volvió al asistente virtual.' });
        if (onLeadUpdate) onLeadUpdate(res.lead);
      } else {
        toast({ title: 'Error', description: res.error || 'No se pudo devolver la charla.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Error inesperado.', variant: 'destructive' });
    } finally {
      setIsDevolviendoAsistente(false);
    }
  }, [lead.id, onLeadUpdate, toast]);

  const handleOpenWhatsAppDraft = useCallback(async () => {
    const textToSend = draftReply.trim() || lead.borradorRespuesta || '';
    if (!lead.phone || !textToSend) return;
    const url = buildWhatsAppLink(lead.phone, textToSend);
    window.open(url, '_blank', 'noopener,noreferrer');
    try {
      const res = await recordWhatsAppOpened(lead.id, textToSend);
      if (res?.success && res.lead && onLeadUpdate) {
        onLeadUpdate(res.lead);
      }
      toast({ description: 'Se abrió WhatsApp con el borrador preparado (no se envió solo).' });
    } catch {
      toast({ description: 'Se abrió WhatsApp con el borrador.' });
    }
  }, [draftReply, lead.borradorRespuesta, lead.id, lead.phone, onLeadUpdate, toast]);

  const handleResolverDudoso = useCallback(async (esProspecto: boolean) => {
    setIsResolvingDudoso(true);
    try {
      const res = await confirmarProspectoDudoso(lead.id, esProspecto);
      if (res.success) {
        if (esProspecto) {
          setDudosoLocal(false);
          toast({ description: `${lead.name} confirmado como prospecto.` });
          if (onLeadUpdate && res.lead) onLeadUpdate(res.lead);
        } else {
          toast({ description: `${lead.name} eliminado del CRM y agregado a Números personales.` });
          onOpenChange(false);
        }
      } else {
        toast({ title: 'Error', description: res.error || 'No se pudo actualizar.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Error inesperado.', variant: 'destructive' });
    } finally {
      setIsResolvingDudoso(false);
    }
  }, [lead.id, lead.name, onLeadUpdate, onOpenChange, toast]);

  // Sync notesValue when lead.notes changes externally and editor is not active
  useEffect(() => {
    if (!isEditingNotes) {
      setNotesValue(lead.notes || '');
    }
  }, [lead.notes, isEditingNotes]);

  const handleSaveNotes = useCallback(async () => {
    setIsSavingNotes(true);
    try {
      const result = await updateCrmLeadField(lead.id, { notes: notesValue });
      if (result.success) {
        toast({ description: 'Notas actualizadas.' });
        setIsEditingNotes(false);
        if (onLeadUpdate && result.lead) {
          onLeadUpdate(result.lead);
        }
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudieron guardar las notas.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSavingNotes(false);
    }
  }, [lead.id, notesValue, toast, onLeadUpdate]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center justify-between gap-2 pr-6">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Historial: {lead.name}
            </span>
            {atiendeLocal === 'persona' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDevolverAlAsistente}
                disabled={isDevolviendoAsistente}
                className="h-8 text-xs gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                {isDevolviendoAsistente ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                Devolverle la charla al asistente
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            Actividad y conversación unificada de este prospecto.
          </DialogDescription>
        </DialogHeader>

        {dudosoLocal && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>¿Es prospecto? (WhatsApp de desconocido con duda)</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                disabled={isResolvingDudoso}
                onClick={() => handleResolverDudoso(true)}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Es prospecto
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs text-destructive border-destructive/40"
                disabled={isResolvingDudoso}
                onClick={() => handleResolverDudoso(false)}
              >
                <UserX className="w-3.5 h-3.5 mr-1" />
                Es personal
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue={conversacionOrdenada.length > 0 ? 'conversacion' : 'historial'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="historial">Historial</TabsTrigger>
            <TabsTrigger value="conversacion" className="gap-1.5">
              Conversación
              {conversacionOrdenada.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {conversacionOrdenada.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historial">
            <ScrollArea className="max-h-[55vh] pr-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin actividad registrada.</p>
              ) : (
                <ol className="relative border-l border-muted ml-3 space-y-4 py-2">
                  {items.map(item => (
                    <li key={item.id} className="ml-4">
                      <span className={cn(
                        'absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full border',
                        getTimelineColor(item.type)
                      )}>
                        {getTimelineIcon(item.type)}
                      </span>
                      <div className="ml-1">
                        <p className="text-sm font-medium text-foreground">{item.description}</p>
                        <time className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString('es-ES', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </time>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="conversacion">
            <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
              <ScrollArea className="max-h-[55vh] pr-2">
                {conversacionOrdenada.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Todavía no hay mensajes registrados en la conversación.
                  </p>
                ) : (
                  <div className="space-y-3 py-2">
                    {conversacionOrdenada.map((msg) => {
                      const metaCanal = getChannelMeta(msg.canal);
                      const esSistema = msg.direccion === 'sistema';
                      const esSaliente = msg.direccion === 'saliente';
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex flex-col gap-1',
                            esSistema ? 'items-center' : esSaliente ? 'items-end' : 'items-start',
                          )}
                        >
                          <div
                            className={cn(
                              'rounded-lg border p-2.5 text-sm max-w-[90%] space-y-1',
                              esSistema
                                ? 'bg-amber-50/70 border-amber-200 text-amber-950 text-xs w-full'
                                : esSaliente
                                  ? 'bg-primary/10 border-primary/20'
                                  : 'bg-card border-border',
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <Badge variant="outline" className={cn('h-5 px-1.5 text-[10px] gap-1', metaCanal.badgeClass)}>
                                {metaCanal.icon}
                                <span>{metaCanal.label}</span>
                              </Badge>
                              {msg.autor && !esSistema && (
                                <span className="text-[11px] font-medium text-muted-foreground">{msg.autor}</span>
                              )}
                              {msg.respondidoPor && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                                  {msg.respondidoPor === 'asistente' ? 'Asistente' : 'Persona'}
                                </Badge>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap break-words text-foreground">{msg.texto}</p>
                            <time className="block text-[10px] text-muted-foreground">
                              {new Date(msg.fecha).toLocaleString('es-UY', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </time>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 space-y-2.5 h-fit">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Análisis y Borrador IA
                  </p>
                  {lead.leadTemperature && (
                    <Badge variant="outline" className="text-[10px]">
                      {lead.leadTemperature}
                    </Badge>
                  )}
                </div>
                {lead.resumenIA && (
                  <p className="text-xs text-slate-700">{lead.resumenIA}</p>
                )}
                {lead.nextAction && (
                  <p className="text-xs font-medium text-indigo-800">
                    Próximo paso: {lead.nextAction}
                  </p>
                )}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-semibold text-slate-600">
                    Borrador de respuesta preparada (nunca se envía solo)
                  </p>
                  <Textarea
                    value={draftReply}
                    onChange={(e) => setDraftReply(e.target.value)}
                    rows={4}
                    className="text-xs bg-white"
                    placeholder="Cuando entre un mensaje nuevo, acá aparece el borrador listo para abrir en WhatsApp..."
                  />
                  {lead.phone && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOpenWhatsAppDraft}
                      disabled={!draftReply.trim()}
                      className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Abrir en WhatsApp
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        {lead.notes && !isEditingNotes && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setNotesValue(lead.notes || ''); setIsEditingNotes(true); }}
              >
                <Edit3 className="w-3 h-3 mr-1" />Editar notas
              </Button>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{lead.notes}</p>
          </div>
        )}
        {!lead.notes && !isEditingNotes && (
          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setNotesValue(''); setIsEditingNotes(true); }}
            >
              <Edit3 className="w-3 h-3 mr-1" />Agregar notas
            </Button>
          </div>
        )}
        {isEditingNotes && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas</p>
            <Textarea
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              rows={4}
              className="text-sm"
              placeholder="Agregar notas..."
              disabled={isSavingNotes}
            />
            <div className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => { setIsEditingNotes(false); setNotesValue(lead.notes || ''); }}
                disabled={isSavingNotes}
              >
                <X className="w-3 h-3 mr-1" />Cancelar
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
              >
                {isSavingNotes ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}Guardar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
