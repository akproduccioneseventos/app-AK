'use client';

import { memo, useState, useCallback } from 'react';
import type { CrmLead, CrmTimelineItem } from '@/types/crm';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateCrmLeadField } from '@/app/actions/crm';
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
    case 'whatsapp_sent': return <MessageCircle className="w-3.5 h-3.5" />;
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

export const CrmLeadTimeline = memo(function CrmLeadTimeline({ lead, isOpen, onOpenChange, onLeadUpdate }: CrmLeadTimelineProps) {
  const items = buildTimeline(lead);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(lead.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const { toast } = useToast();

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Historial: {lead.name}
          </DialogTitle>
          <DialogDescription>
            Actividad registrada en este prospecto.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-2">
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
