
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
import { Banknote, Loader2, ReceiptText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerBookingDeposit } from '@/app/actions/invoices';
import { DatePickerDemo } from '../date-picker-demo';
import {
  calculateMercadoPagoCuotas,
  isMercadoPagoInstallmentCount,
  MERCADO_PAGO_INSTALLMENT_COUNTS,
  MERCADO_PAGO_INSTALLMENTS_METHOD,
  type MercadoPagoInstallmentCount,
} from '@/lib/payments/mercadopago-calculator';

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
  const [method, setMethod] = useState('Transferencia Bancaria');
  const [installments, setInstallments] = useState<MercadoPagoInstallmentCount>(12);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const parsedAmount = Number.parseFloat(amount);
  const financing = calculateMercadoPagoCuotas(parsedAmount);
  const selectedFinancing = financing.options.find(
    (option) => option.installments === installments,
  );

  const handleSave = async () => {
    if (!amount || !date) return;
    setIsSaving(true);
    try {
      const result = await registerBookingDeposit({
        fiestaId,
        amount: parseFloat(amount),
        method,
        installments: method === MERCADO_PAGO_INSTALLMENTS_METHOD ? installments : undefined,
        date: date.toISOString(),
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
                <SelectItem value={MERCADO_PAGO_INSTALLMENTS_METHOD}>Mercado Pago / Tarjeta en Cuotas (+10% recargo)</SelectItem>
                <SelectItem value="Tarjeta">Tarjeta de Débito / Crédito 1 Pago</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {method === MERCADO_PAGO_INSTALLMENTS_METHOD && (
            <div className="space-y-2">
              <Label>Cantidad de Cuotas</Label>
              <Select
                value={String(installments)}
                onValueChange={(value) => {
                  if (isMercadoPagoInstallmentCount(value)) {
                    setInstallments(Number(value) as MercadoPagoInstallmentCount);
                  }
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MERCADO_PAGO_INSTALLMENT_COUNTS.map((count) => (
                    <SelectItem key={count} value={String(count)}>
                      {count === 1 ? '1 pago' : `${count} cuotas`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {method === MERCADO_PAGO_INSTALLMENTS_METHOD && parsedAmount > 0 && selectedFinancing && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-amber-900">
                <span>Monto Base:</span>
                <span>$ {financing.baseAmount.toLocaleString('es-UY')}</span>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>Recargo Mercado Pago / Tarjeta (+10%):</span>
                <span>+$ {financing.surchargeAmount.toLocaleString('es-UY')}</span>
              </div>
              <div className="flex justify-between font-extrabold text-amber-950 border-t border-amber-300/60 pt-1.5 text-sm">
                <span>Total a Cobrar:</span>
                <span>$ {financing.totalWithSurcharge.toLocaleString('es-UY')}</span>
              </div>
              <div className="pt-1 text-[11px] text-amber-800 space-y-1">
                <p className="font-semibold text-amber-900">Plan seleccionado:</p>
                <div className="bg-white/70 p-2 rounded-lg border border-amber-200/80">
                  <p><strong>{selectedFinancing.label}</strong></p>
                  <p className="mt-1">
                    Total exacto: <strong>$ {selectedFinancing.installmentAmounts
                      .reduce((sum, installmentAmount) => sum + installmentAmount, 0)
                      .toLocaleString('es-UY')}</strong>
                  </p>
                </div>
                <p className="text-[10px] text-amber-900 italic pt-1">
                  ℹ️ <strong>Nota de Transparencia</strong>: El monto del servicio para AK es $ {financing.baseAmount.toLocaleString('es-UY')}. El 10% adicional cubre la comisión y financiación de Mercado Pago. AK recibe el importe neto.
                </p>
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
