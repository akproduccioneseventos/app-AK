'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CrmLead } from '@/types/crm';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, GripVertical, Eye } from 'lucide-react';
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
}

export function CrmLeadCard({ lead, onDeleteLead, isDeleting }: CrmLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

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
    if (notes.includes('Generado desde el Simulador/Creador de Presupuestos') || notes.includes('Generado desde SIMULADOR DE PRESUPUESTO')) {
        return { type: 'badge', content: 'Presupuesto al Instante' };
    }
    return { type: 'text', content: notes };
  };

  const displayNotes = getDisplayNotes(lead.notes);

  return (
    <div ref={setNodeRef} style={style} className="mb-2 touch-none w-full">
      <Card className="shadow-sm hover:shadow-md transition-shadow bg-card w-full flex flex-col h-[180px]">
        <CardHeader 
          {...attributes} 
          {...listeners} 
          className="p-2 flex flex-row items-start gap-1 border-b cursor-grab"
          title="Mover prospecto"
        >
           <GripVertical className="w-5 h-5 text-muted-foreground/70 flex-shrink-0 mt-0.5" />
            <div className="flex-grow min-w-0">
               <p className="font-semibold text-sm break-words line-clamp-2" title={lead.name}>{lead.name}</p>
            </div>
        </CardHeader>
        <CardContent className="p-2 flex-grow min-h-0">
          {displayNotes && (
            <div className="mt-1">
            {displayNotes.type === 'badge' ? (
                <Badge variant="secondary" className="text-xs">{displayNotes.content}</Badge>
            ) : (
                <p className="text-xs text-muted-foreground break-words line-clamp-3">{displayNotes.content}</p>
            )}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-2 border-t flex justify-end items-center gap-1">
            <Link href={`/presupuestos/nuevo?leadName=${encodeURIComponent(lead.name)}`} passHref className="flex-grow">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 w-full">
                    <Eye className="w-4 h-4" />
                    Crear Presupuesto
                </Button>
            </Link>
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
