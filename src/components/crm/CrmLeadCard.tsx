
'use client';

import type { CrmLead, CrmStage } from '@/types/crm';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Loader2, Trash2, UserCircle2 } from 'lucide-react';
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


interface CrmLeadCardProps {
  lead: CrmLead;
  stages: CrmStage[];
  onMoveLead: (leadId: string, newStageId: string) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  isMoving: boolean;
  isDeleting: boolean;
}

export function CrmLeadCard({ lead, stages, onMoveLead, onDeleteLead, isMoving, isDeleting }: CrmLeadCardProps) {
  const currentStageIndex = stages.findIndex(s => s.id === lead.currentStageId);
  const nextStage = currentStageIndex !== -1 && currentStageIndex < stages.length - 1
    ? stages[currentStageIndex + 1]
    : null;

  const handleMove = () => {
    if (nextStage) {
      onMoveLead(lead.id, nextStage.id);
    }
  };
  
  const handleDelete = () => {
    onDeleteLead(lead.id);
  };

  return (
    <Card className="mb-3 shadow-md hover:shadow-lg transition-shadow bg-card">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <UserCircle2 className="w-4 h-4 text-muted-foreground" />
          {lead.name}
        </CardTitle>
      </CardHeader>
      <CardFooter className="p-2 border-t flex justify-between items-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={isDeleting || isMoving} title="Eliminar Lead">
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                El lead "{lead.name}" será eliminado permanentemente.
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
        {nextStage ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMove}
            disabled={isMoving || isDeleting}
            className="text-xs h-7 px-2 py-1"
            title={`Mover a ${nextStage.name}`}
          >
            {isMoving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5 mr-1" />}
            Mover
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled className="text-xs h-7 px-2 py-1 text-green-600">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Completado
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
