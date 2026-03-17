'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CrmLead } from '@/types/crm';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, GripVertical, FilePlus2, Users, Building2, Clock, ChevronLeft, ChevronRight, FileText, FileSignature, CheckCircle, Smartphone } from 'lucide-react';
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
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CrmLeadCardProps {
  lead: CrmLead;
  onDeleteLead: (leadId: string) => Promise<void>;
  isDeleting: boolean;
  isMobile?: boolean;
  onMove?: (direction: -1 | 1) => void;
  onHire?: () => void;
}

export function CrmLeadCard({ lead, onDeleteLead, isDeleting, isMobile, onMove, onHire }: CrmLeadCardProps) {
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
  
  const budgetSource = useMemo(() => {
    if (lead.budgetSource === 'simulator') {
      return { text: 'Simulador', className: 'bg-blue-100 text-blue-800' };
    }
    return { text: 'Manual', className: 'bg-gray-100 text-gray-700' };
  }, [lead.budgetSource]);

  const hasBudget = !!lead.presupuestoId;
  const isBudgetFacturado = lead.presupuestoEstado === 'Facturado';
  const isBudgetAceptado = lead.presupuestoEstado === 'Aceptado';

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
                    <Badge variant="outline" className={cn("text-[10px] h-4 px-1 font-bold", budgetSource.className)}>
                        {budgetSource.text}
                    </Badge>
                </div>
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
             <div className="flex items-center gap-2 font-bold text-amber-700 bg-amber-50 p-1 rounded">
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
        <CardFooter className="p-2 border-t flex flex-wrap justify-end gap-1 bg-muted/10">
            {isBudgetFacturado ? (
                 <Link href={`/invoices/${lead.invoiceId}`} passHref className="flex-grow">
                    <Button variant="secondary" size="sm" className="h-8 text-[10px] gap-1 w-full bg-green-100 text-green-700 border-green-200">
                        <FileSignature className="w-3 h-3"/> FACTURADO
                    </Button>
                </Link>
            ) : isBudgetAceptado ? (
                <div className="flex-grow flex gap-1">
                    <Link href={`/presupuestos/${lead.presupuestoId}/ver`} passHref className="flex-grow">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] w-full border-green-500 text-green-700">
                            ACEPTADO
                        </Button>
                    </Link>
                    <Link href={`/invoices/new?fromPresupuesto=${lead.presupuestoId}`} passHref>
                        <Button size="sm" className="h-8 px-2"><FilePlus2 className="w-3.5 h-3.5"/></Button>
                    </Link>
                </div>
            ) : hasBudget ? (
                <div className="flex-grow flex gap-1">
                    <Link href={`/presupuestos/${lead.presupuestoId}/ver`} passHref className="flex-grow">
                        <Button variant="outline" size="sm" className="h-8 text-[10px] w-full">VER PRESUPUESTO</Button>
                    </Link>
                    {onHire && <Button onClick={onHire} size="sm" className="h-8 bg-green-600 hover:bg-green-700 px-2"><CheckCircle className="w-4 h-4"/></Button>}
                </div>
            ) : (
                <Link href={`/presupuestos/nuevo/crear?leadId=${lead.id}&leadName=${encodeURIComponent(lead.name)}`} passHref className="flex-grow">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 w-full">
                        <FilePlus2 className="w-3 h-3" /> CREAR PRESUPUESTO
                    </Button>
                </Link>
            )}
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
    </div>
  );
}