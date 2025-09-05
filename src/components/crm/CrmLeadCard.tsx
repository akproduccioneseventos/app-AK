
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CrmLead } from '@/types/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, GripVertical, Edit } from 'lucide-react';
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

  // Placeholder for edit functionality
  const handleEdit = () => {
    toast({
      title: "Función no implementada",
      description: "La edición de prospectos se añadirá en una futura actualización.",
    });
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-2 shadow-sm hover:shadow-md transition-shadow bg-card touch-none w-full">
        <div className="p-2.5 flex items-start gap-2">
            <div {...attributes} {...listeners} className="cursor-grab pt-1 flex-shrink-0" title="Mover prospecto">
                <GripVertical className="w-5 h-5 text-muted-foreground/70" />
            </div>

            <div className="flex-grow min-w-0">
                <p className="font-semibold text-sm break-words" title={lead.name}>{lead.name}</p>
                {lead.notes && <p className="text-xs text-muted-foreground mt-1 break-words line-clamp-2" title={lead.notes}>{lead.notes}</p>}
            </div>

            <div className="flex flex-col gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEdit} title="Editar Prospecto (Próximamente)">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" title="Eliminar Prospecto">
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
            </div>
        </div>
    </Card>
  );
}
