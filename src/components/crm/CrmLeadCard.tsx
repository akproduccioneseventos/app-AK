
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CrmLead } from '@/types/crm';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, GripVertical, FilePlus2, Users, Building2, CalendarDays, Clock, ChevronLeft, ChevronRight, FileText, FileSignature } from 'lucide-react';
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

interface CrmLeadCardProps {
  lead: CrmLead;
  onDeleteLead: (leadId: string) => Promise<void>;
  isDeleting: boolean;
  isMobile?: boolean;
  onMove?: (direction: -1 | 1) => void;
}

export function CrmLeadCard({ lead, onDeleteLead, isDeleting, isMobile, onMove }: CrmLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, disabled: isMobile });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const handleDelete = () => {
    onDeleteLead(lead.id);
  };
  
  const getDisplayNotes = (notes: string | undefined): { type: 'badge' | 'text', content: string } | null => {
    if (!notes) return null;
    const notesLower = notes.toLowerCase();
    
    if (notesLower.includes('reunión de entrevista:') || notesLower.includes('reunión de firma de contrato:')) {
        const meetingLine = notes.split('\n')[0];
        return { type: 'text', content: meetingLine };
    }
    
    const nonStructuralNotes = notes.split('\n---')[0].trim();
    if (!nonStructuralNotes) return null;
    
    const structuralKeywords = ['invitados:', 'costo estimado:', 'servicios incluidos:', 'presupuesto id:'];
    if (structuralKeywords.some(kw => nonStructuralNotes.toLowerCase().includes(kw))) {
      return null;
    }
    
    return { type: 'text', content: nonStructuralNotes };
  };

  const displayNotes = getDisplayNotes(lead.notes);
  const hasBudget = !!lead.presupuestoId;
  const isBudgetFacturado = lead.presupuestoEstado === 'Facturado' && !!lead.invoiceId;


  return (
    <div ref={setNodeRef} style={style} className="mb-2 touch-none">
      <Card className="shadow-sm hover:shadow-md transition-shadow bg-card flex flex-col h-auto">
        <CardHeader 
          {...attributes} 
          {...listeners} 
          className="p-2 flex flex-row items-start gap-1 border-b cursor-grab flex-shrink-0"
          title="Mover prospecto"
        >
           {!isMobile && <GripVertical className="w-5 h-5 text-muted-foreground/70 flex-shrink-0 mt-0.5" />}
            <div className="flex-grow min-w-0">
               <p className="font-semibold text-sm break-words line-clamp-2" title={lead.name}>{lead.name}</p>
            </div>
        </CardHeader>
        <CardContent className="p-2 flex-grow min-h-0 text-xs text-muted-foreground space-y-1.5">
          {lead.followUpDate && (
             <div className="flex items-center gap-1.5 font-medium text-amber-700">
                <Clock className="w-3.5 h-3.5 flex-shrink-0"/>
                <span className="truncate">Cita: {new Date(lead.followUpDate).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}hs</span>
            </div>
          )}
          {lead.partyType && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0"/>
              <span className="truncate">{lead.partyType} {lead.venueName && `en ${lead.venueName}`}</span>
            </div>
          )}
          {lead.guestCount !== undefined && (
             <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 flex-shrink-0"/>
              <span className="truncate">Aprox. {lead.guestCount} invitados</span>
            </div>
          )}
          {displayNotes && displayNotes.type === 'text' && (
            <p className="break-words line-clamp-2 italic text-blue-600">"{displayNotes.content}"</p>
          )}
        </CardContent>
        <CardFooter className="p-2 border-t flex justify-end items-center gap-1 flex-shrink-0">
            {isMobile && onMove && (
              <div className="flex gap-1 mr-auto">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onMove(-1)}><ChevronLeft className="w-4 h-4"/></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onMove(1)}><ChevronRight className="w-4 h-4"/></Button>
              </div>
            )}
            {isBudgetFacturado ? (
                 <Link href={`/invoices/${lead.invoiceId}`} passHref className="flex-grow">
                    <Button variant="secondary" size="sm" className="h-8 text-xs gap-1.5 w-full bg-green-100 text-green-700 hover:bg-green-200">
                        <FileSignature className="w-4 h-4"/> Ver Factura
                    </Button>
                </Link>
            ) : hasBudget ? (
                <Link href={`/presupuestos/${lead.presupuestoId}/ver`} passHref className="flex-grow">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-full">
                        <FileText className="w-4 h-4"/> Ver Presupuesto
                    </Button>
                </Link>
            ) : (
                <Link href={`/presupuestos/nuevo/crear?leadId=${lead.id}&leadName=${encodeURIComponent(lead.name)}`} passHref className="flex-grow">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-full">
                        <FilePlus2 className="w-4 h-4" /> Crear Presupuesto
                    </Button>
                </Link>
            )}
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-8 w-8 flex-shrink-0" title="Eliminar Prospecto" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>El prospecto "{lead.name}" será eliminado permanentemente.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}Eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}

