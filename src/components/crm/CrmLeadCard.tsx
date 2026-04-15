'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CrmLead } from '@/types/crm';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, GripVertical, FilePlus2, Users, Building2, Clock, ChevronLeft, ChevronRight, FileText, FileSignature, CheckCircle, Smartphone, MessageCircle, History, AlertTriangle, Bell, Edit3, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { memo, useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { recordWhatsAppContact, updateCrmLeadField } from '@/app/actions/crm';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CrmLeadTimeline } from './CrmLeadTimeline';

const INACTIVITY_DAYS = 7;

interface CrmLeadCardProps {
  lead: CrmLead;
  onDeleteLead: (leadId: string) => Promise<void>;
  isDeleting: boolean;
  isMobile?: boolean;
  onMove?: (direction: -1 | 1) => void;
  onHire?: () => void;
}

export const CrmLeadCard = memo(function CrmLeadCard({ lead, onDeleteLead, isDeleting, isMobile, onMove, onHire }: CrmLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, disabled: isMobile });

  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(lead.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const { toast } = useToast();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const budgetSource = useMemo(() => {
    if (lead.budgetSource === 'simulator') {
      return { text: 'Simulador', className: 'bg-blue-100 text-blue-800' };
    }
    return { text: 'Manual', className: 'bg-gray-100 text-gray-700' };
  }, [lead.budgetSource]);

  const hasBudget = !!lead.presupuestoId;
  const isBudgetFacturado = lead.presupuestoEstado === 'Facturado';
  const isBudgetAceptado = lead.presupuestoEstado === 'Aceptado';

  // Reminder badges
  const { isInactive, isMeetingTomorrow, isMeetingToday } = useMemo(() => {
    const now = new Date();
    const lastActivity = new Date(lead.lastContactedAt || lead.updatedAt || lead.createdAt);
    const diffDays = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    const inactive = diffDays >= INACTIVITY_DAYS;

    let meetingTomorrow = false;
    let meetingToday = false;
    if (lead.followUpDate) {
      const meeting = new Date(lead.followUpDate);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      meetingTomorrow =
        meeting.getFullYear() === tomorrow.getFullYear() &&
        meeting.getMonth() === tomorrow.getMonth() &&
        meeting.getDate() === tomorrow.getDate();
      meetingToday = meeting.toDateString() === now.toDateString();
    }

    return { isInactive: inactive, isMeetingTomorrow: meetingTomorrow, isMeetingToday: meetingToday };
  }, [lead.lastContactedAt, lead.updatedAt, lead.createdAt, lead.followUpDate]);

  // WhatsApp handler: open wa.me link and record contact
  const handleWhatsApp = useCallback(async () => {
    if (!lead.phone) return;
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const message = isMeetingTomorrow
      ? `Hola ${lead.name.split(' ')[0]}, te recuerdo que mañana tenemos nuestra reunión agendada. ¡Nos vemos pronto!`
      : `Hola ${lead.name.split(' ')[0]}, te escribo desde AK Producciones para hacer un seguimiento. ¿Cómo podemos ayudarte?`;
    
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Record contact in background
    try {
      await recordWhatsAppContact(lead.id, message);
    } catch {
      // non-blocking
    }
    toast({ description: `WhatsApp abierto para ${lead.name}. Contacto registrado.` });
  }, [lead.phone, lead.name, lead.id, isMeetingTomorrow, toast]);

  const handleSaveNotes = useCallback(async () => {
    setIsSavingNotes(true);
    try {
      const result = await updateCrmLeadField(lead.id, { notes: notesValue });
      if (result.success) {
        toast({ description: 'Notas actualizadas.' });
        setIsEditingNotes(false);
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudieron guardar las notas.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSavingNotes(false);
    }
  }, [lead.id, notesValue, toast]);

  return (
    <div ref={setNodeRef} style={style} className="mb-2 touch-none">
      <Card className="shadow-sm hover:shadow-md transition-shadow bg-card flex flex-col h-auto overflow-hidden">
        <CardHeader 
          {...attributes} 
          {...listeners} 
          className="p-2 flex flex-row items-center gap-2 border-b cursor-grab flex-shrink-0 bg-muted/20"
        >
           {!isMobile && <GripVertical className="w-4 h-4 text-muted-foreground/50" />}
            <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm truncate" title={lead.name}>{lead.name}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isInactive && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-orange-50 text-orange-700 border-orange-300" title={`Sin actividad hace +${INACTIVITY_DAYS} días`}>
                          <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Sin actividad
                        </Badge>
                      )}
                      {isMeetingToday && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-red-50 text-red-700 border-red-300" title="Reunión hoy">
                          <Bell className="w-2.5 h-2.5 mr-0.5" />HOY
                        </Badge>
                      )}
                      {isMeetingTomorrow && !isMeetingToday && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-300" title="Reunión mañana">
                          <Bell className="w-2.5 h-2.5 mr-0.5" />Mañana
                        </Badge>
                      )}
                      <Badge variant="outline" className={cn("text-[10px] h-4 px-1 font-bold", budgetSource.className)}>
                          {budgetSource.text}
                      </Badge>
                    </div>
                </div>
                {lead.assignedTo && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">👤 {lead.assignedTo}</p>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-3 flex-grow min-h-0 text-xs text-muted-foreground space-y-2">
          {lead.phone && (
              <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-primary/60"/>
                  <span className="font-medium text-foreground">{lead.phone}</span>
              </div>
          )}
          {lead.followUpDate && (
             <div className={cn("flex items-center gap-2 font-bold p-1 rounded", isMeetingToday ? "text-red-700 bg-red-50" : isMeetingTomorrow ? "text-blue-700 bg-blue-50" : "text-amber-700 bg-amber-50")}>
                <Clock className="w-3.5 h-3.5"/>
                <span className="truncate">Cita: {new Date(lead.followUpDate).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}hs</span>
            </div>
          )}
          {lead.partyType && (
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5"/>
              <span className="truncate">{lead.partyType} {lead.venueName && `en ${lead.venueName}`}</span>
            </div>
          )}
          {lead.guestCount && (
             <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5"/>
              <span>~{lead.guestCount} invitados</span>
            </div>
          )}
        </CardContent>
        {isEditingNotes && (
          <div className="px-3 pb-2 space-y-1 border-t pt-2">
            <Textarea
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              rows={3}
              className="text-xs"
              placeholder="Agregar notas..."
              disabled={isSavingNotes}
            />
            <div className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => { setIsEditingNotes(false); setNotesValue(lead.notes || ''); }}
                disabled={isSavingNotes}
              >
                <X className="w-3 h-3 mr-1" />Cancelar
              </Button>
              <Button
                size="sm"
                className="h-6 text-xs"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
              >
                {isSavingNotes ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}Guardar
              </Button>
            </div>
          </div>
        )}
        <CardFooter className="p-2 border-t flex flex-wrap justify-end gap-1 bg-muted/10">
            {isBudgetFacturado ? (
                 <Link href={`/invoices/${lead.invoiceId}`} className="flex-grow">
                    <Button variant="secondary" size="sm" className="h-8 text-[10px] gap-1 w-full bg-green-100 text-green-700 border-green-200">
                        <FileSignature className="w-3 h-3"/> FACTURADO
                    </Button>
                </Link>
            ) : isBudgetAceptado ? (
                <div className="flex-grow flex gap-1">
                    <Link href={`/presupuestos/${lead.presupuestoId}/ver`} className="flex-grow">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] w-full border-green-500 text-green-700">
                            ACEPTADO
                        </Button>
                    </Link>
                    <Link href={`/invoices/new?fromPresupuesto=${lead.presupuestoId}`}>
                        <Button size="sm" className="h-8 px-2"><FilePlus2 className="w-3.5 h-3.5"/></Button>
                    </Link>
                </div>
            ) : hasBudget ? (
                <div className="flex-grow flex gap-1">
                    <Link href={`/presupuestos/${lead.presupuestoId}/ver`} className="flex-grow">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] w-full">VER PRESUPUESTO</Button>
                    </Link>
                    {onHire && <Button onClick={onHire} size="sm" className="h-8 bg-green-600 hover:bg-green-700 px-2"><CheckCircle className="w-4 h-4"/></Button>}
                </div>
            ) : (
                <Link href={`/presupuestos/nuevo/crear?leadId=${lead.id}&leadName=${encodeURIComponent(lead.name)}`} className="flex-grow">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 w-full">
                        <FilePlus2 className="w-3 h-3" /> CREAR PRESUPUESTO
                    </Button>
                </Link>
            )}
            {/* WhatsApp button */}
            {lead.phone && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:bg-green-50"
                onClick={handleWhatsApp}
                title="Abrir WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </Button>
            )}
            {/* Edit notes button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted/50"
              onClick={() => { setNotesValue(lead.notes || ''); setIsEditingNotes(v => !v); }}
              title="Editar notas"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            {/* Timeline button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted/50"
              onClick={() => setIsTimelineOpen(true)}
              title="Ver historial"
            >
              <History className="w-3.5 h-3.5" />
            </Button>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3"/>}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>¿Eliminar Prospecto?</AlertDialogTitle><AlertDialogDescription>Se borrará permanentemente a "{lead.name}".</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteLead(lead.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
        </CardFooter>
      </Card>

      <CrmLeadTimeline lead={lead} isOpen={isTimelineOpen} onOpenChange={setIsTimelineOpen} />
    </div>
  );
});
