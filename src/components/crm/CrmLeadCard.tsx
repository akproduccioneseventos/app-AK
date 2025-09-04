
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CrmLead } from '@/types/crm';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, UserCircle2, GripVertical, History, FileText } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

// Helper to format date
const formatHistoryDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};


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
  
  const cardIsProcessing = isDeleting;

  return (
    <Card ref={setNodeRef} style={style} className="mb-3 shadow-md hover:shadow-lg transition-shadow bg-card touch-none">
      <CardHeader className="p-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <UserCircle2 className="w-4 h-4 text-muted-foreground" />
          {lead.name}
        </CardTitle>
        <div {...attributes} {...listeners} className="cursor-grab p-1" title="Mover prospecto">
            <GripVertical className="w-5 h-5 text-muted-foreground/70" />
        </div>
      </CardHeader>
      <CardFooter className="p-2 border-t flex justify-between items-center">
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/presupuestos/nuevo?leadName=${encodeURIComponent(lead.name)}`} passHref>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                    <FileText className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start"><p>Crear Presupuesto</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {lead.history && lead.history.length > 0 && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                    <History className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-xs">
                  <p className="font-bold mb-2">Historial de Etapas</p>
                  <ScrollArea className="h-auto max-h-40">
                    <ul className="space-y-1.5 text-xs">
                      {[...lead.history].reverse().map((item, index) => (
                        <li key={`${item.timestamp}-${index}`}>
                          <span className="font-semibold">{item.stageName}:</span> {formatHistoryDate(item.timestamp)}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={cardIsProcessing} title="Eliminar Prospecto">
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                El prospecto "{lead.name}" será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/> : null}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
