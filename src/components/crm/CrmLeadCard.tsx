
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CrmLead } from '@/types/crm';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, UserCircle2, GripVertical, History, FileText, MoreVertical } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <CardHeader className="p-3 flex flex-row items-center justify-between gap-2">
        <div {...attributes} {...listeners} className="cursor-grab p-1 flex-shrink-0" title="Mover prospecto">
            <GripVertical className="w-5 h-5 text-muted-foreground/70" />
        </div>
        <div className="flex-grow min-w-0">
            <CardTitle className="text-sm font-medium truncate" title={lead.name}>
            {lead.name}
            </CardTitle>
        </div>
        <div className="flex-shrink-0 flex items-center gap-0.5">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/presupuestos/nuevo?leadName=${encodeURIComponent(lead.name)}`}>
                        <FileText className="mr-2 h-4 w-4"/> Crear Presupuesto
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem disabled>
                      Ver Historial (Próximamente)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
      </CardHeader>
        {lead.notes && (
            <CardFooter className="p-3 pt-0 border-t">
                <p className="text-xs text-muted-foreground italic truncate">{lead.notes}</p>
            </CardFooter>
        )}
    </Card>
  );
}
