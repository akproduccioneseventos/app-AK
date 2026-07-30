
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
                <SelectItem value="Transferencia Bancaria">Transferencia Bancaria (Contado)</SelectItem>
                <SelectItem value="Efectivo">Efectivo (Contado)</SelectItem>
                <SelectItem value="MercadoPago (Cuotas +10%)">Mercado Pago / Tarjeta en Cuotas (+10% recargo)</SelectItem>
                <SelectItem value="Tarjeta">Tarjeta de Débito / Crédito 1 Pago</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {method === 'MercadoPago (Cuotas +10%)' && amount && parseFloat(amount) > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-amber-900">
                <span>Monto Base:</span>
                <span>$ {parseFloat(amount).toLocaleString('es-UY')}</span>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>Recargo Mercado Pago / Tarjeta (+10%):</span>
                <span>+$ {Math.round(parseFloat(amount) * 0.10).toLocaleString('es-UY')}</span>
              </div>
              <div className="flex justify-between font-extrabold text-amber-950 border-t border-amber-300/60 pt-1.5 text-sm">
                <span>Total a Cobrar:</span>
                <span>$ {Math.round(parseFloat(amount) * 1.10).toLocaleString('es-UY')}</span>
              </div>
              <div className="pt-1 text-[11px] text-amber-800 space-y-1">
                <p className="font-semibold text-amber-900">Desglose de Cuotas sugeridas:</p>
                <div className="grid grid-cols-2 gap-1 bg-white/70 p-2 rounded-lg border border-amber-200/80">
                  <p>• 1 pago: <strong>$ {Math.round(parseFloat(amount) * 1.10).toLocaleString('es-UY')}</strong></p>
                  <p>• 3 cuotas: <strong>$ {Math.round((parseFloat(amount) * 1.10) / 3).toLocaleString('es-UY')}/m</strong></p>
                  <p>• 6 cuotas: <strong>$ {Math.round((parseFloat(amount) * 1.10) / 6).toLocaleString('es-UY')}/m</strong></p>
                  <p>• 12 cuotas: <strong>$ {Math.round((parseFloat(amount) * 1.10) / 12).toLocaleString('es-UY')}/m</strong></p>
                </div>
              </div>
            </div>
          )}

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
