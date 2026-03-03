
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2, PartyPopper, Calendar, MapPin, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { confirmBooking } from '@/app/actions/crm';
import type { CrmLead } from '@/types/crm';
import { Separator } from '@/components/ui/separator';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CrmLead;
  presupuesto: {
    total: number;
    fecha: string;
    salon: string;
  };
  onConfirmed: (fiestaId: string) => void;
}

export function BookingConfirmationDialog({ isOpen, onOpenChange, lead, presupuesto, onConfirmed }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!lead.presupuestoId) return;
    setIsProcessing(true);
    try {
      const result = await confirmBooking(lead.id, lead.presupuestoId);
      if (result.success && result.fiestaId) {
        toast({ title: "¡Contratación Exitosa!", description: "Se ha creado el cliente y el evento automáticamente." });
        onConfirmed(result.fiestaId);
      } else {
        throw new Error(result.error || "Ocurrió un error al procesar la contratación.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-green-100 p-3 rounded-full mb-2">
            <PartyPopper className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-center font-headline text-2xl">Confirmar Contratación</DialogTitle>
          <DialogDescription className="text-center">
            Estás a punto de formalizar el evento para {lead.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm"><strong>Fecha:</strong> {formatDate(presupuesto.fecha)}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm"><strong>Salón:</strong> {presupuesto.salon}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Total Presupuesto:</span>
              </div>
              <span className="text-lg font-bold text-primary">{formatCurrency(presupuesto.total)}</span>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700 space-y-1">
            <p>● Se creará automáticamente la ficha del cliente.</p>
            <p>● Se activará el panel de planificación del evento.</p>
            <p>● El presupuesto se marcará como aceptado.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Confirmar Contratación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
