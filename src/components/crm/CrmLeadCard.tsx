
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CrmLead } from '@/types/crm';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, GripVertical, Edit, Eye } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface CrmLeadCardProps {
  lead: CrmLead;
  onDeleteLead: (leadId: string) => Promise<void>;
  isDeleting: boolean;
}

export function CrmLeadCard({ lead, onDeleteLead, isDeleting }: CrmLeadCardProps) {
  const { toast } = useToast();
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

  const handleEdit = () => {
    toast({
      title: "Función no implementada",
      description: "La edición de prospectos se añadirá en una futura actualización.",
    });
  };

  const getDisplayNotes = (notes: string | undefined): { type: 'badge' | 'text', content: string } | null => {
    if (!notes) return null;
    if (notes.includes('Generado desde Mi Presupuesto al Instante') || notes.includes('Generado desde Armado Rápido')) {
        return { type: 'badge', content: 'Presupuesto al Instante' };
    }
    return { type: 'text', content: notes };
  };

  const displayNotes = getDisplayNotes(lead.notes);

  return (
    <Card ref={setNodeRef} style={style} className="mb-2 shadow-sm hover:shadow-md transition-shadow bg-card touch-none w-full flex flex-col">
        <CardHeader className="p-2 flex flex-row items-start gap-2">
            <div {...attributes} {...listeners} className="cursor-grab pt-1 flex-shrink-0" title="Mover prospecto">
                <GripVertical className="w-5 h-5 text-muted-foreground/70" />
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-sm break-words" title={lead.name}>{lead.name}</p>
            </div>
        </CardHeader>
        <CardContent className="px-3 pb-2 flex-grow min-h-[40px]">
          {displayNotes && (
            displayNotes.type === 'badge' ? (
              <Badge variant="secondary">{displayNotes.content}</Badge>
            ) : (
              <p className="text-xs text-muted-foreground break-words">{displayNotes.content}</p>
            )
          )}
        </CardContent>
        <CardFooter className="p-2 border-t flex justify-end gap-1">
             <Link href={`/presupuestos/nuevo?leadName=${encodeURIComponent(lead.name)}`} passHref>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Crear Presupuesto">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                </Button>
            </Link>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" title="Eliminar Prospecto" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>El prospecto "{lead.name}" será eliminado permanentemente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                        Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
  );
}
