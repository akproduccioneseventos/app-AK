
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banknote, Loader2, Save, ReceiptText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerBookingDeposit } from '@/app/actions/invoices';
import { DatePickerDemo } from '../date-picker-demo';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fiestaId: string;
  onCompleted: () => void;
}

export function RegisterDepositDialog({ isOpen, onOpenChange, fiestaId, onCompleted }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [amount, setAmount] = useState('20000');
  const [method, setMethod] = useState('Transferencia');
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleSave = async () => {
    if (!amount || !date) return;
    setIsSaving(true);
    try {
      const result = await registerBookingDeposit({
        fiestaId,
        amount: parseFloat(amount),
        method,
        date: date.toISOString()
      });

      if (result.success) {
        toast({ title: "Seña Registrada", description: "Se ha generado el recibo y actualizado el saldo." });
        onCompleted();
      } else throw new Error(result.error);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-2">
            <Banknote className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center font-headline">Registrar Seña de Reserva</DialogTitle>
          <DialogDescription className="text-center">
            Ingresa el pago inicial para generar el recibo automático.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dep-amount">Monto de la Seña (UYU)</Label>
            <Input id="dep-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Forma de Pago</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
                <SelectItem value="Tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha del Pago</Label>
            <DatePickerDemo selectedDate={date} onDateChange={setDate} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Omitir por ahora</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ReceiptText className="w-4 h-4 mr-2" />}
            Generar Recibo y Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
