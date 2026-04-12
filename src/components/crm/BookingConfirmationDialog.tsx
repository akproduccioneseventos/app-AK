'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2, PartyPopper, Calendar, MapPin, DollarSign, Archive, Printer, ArrowLeft, ArrowRight, FileText, User, Phone, CreditCard, Home, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { confirmBookingWithContract } from '@/app/actions/crm';
import type { CrmLead } from '@/types/crm';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [archiveLead, setArchiveLead] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);

  // Client data fields
  const [phone, setPhone] = useState(lead.phone || '');
  const [ci, setCi] = useState('');
  const [address, setAddress] = useState('');
  const [companyName, setCompanyName] = useState((lead as any).companyName || '');
  const [taxId, setTaxId] = useState((lead as any).taxId || '');

  const { toast } = useToast();

  const canProceedStep1 = ci.trim() !== '' && address.trim() !== '';

  const handleConfirm = async () => {
    if (!lead.presupuestoId) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('leadId', lead.id);
      formData.append('presupuestoId', lead.presupuestoId);
      formData.append('archiveLead', archiveLead ? 'true' : 'false');
      formData.append('phone', phone);
      formData.append('ci', ci);
      formData.append('address', address);
      if (companyName) formData.append('companyName', companyName);
      if (taxId) formData.append('taxId', taxId);

      const result = await confirmBookingWithContract(formData);
      if (result.success && result.fiestaId) {
        toast({
          title: "¡Contratación Exitosa!",
          description: "Se ha creado el cliente y activado el evento automáticamente.",
        });
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

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep(1);
      setArchiveLead(false);
      setContractSigned(false);
      setCi('');
      setAddress('');
      setPhone(lead.phone || '');
      setCompanyName((lead as any).companyName || '');
      setTaxId((lead as any).taxId || '');
    }
    onOpenChange(open);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  const stepLabels = ['Verificar Datos', 'Imprimir Documentos', 'Confirmar Conversión'];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto bg-green-100 p-3 rounded-full mb-2">
            <PartyPopper className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-center font-headline text-2xl">Confirmar Contratación</DialogTitle>
          <DialogDescription className="text-center">
            Estás a punto de formalizar el evento para {lead.name}.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {stepLabels.map((label, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                step === idx + 1
                  ? 'bg-primary text-white'
                  : step > idx + 1
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-400'
              }`}>
                <span>{idx + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {idx < stepLabels.length - 1 && (
                <div className={`w-6 h-0.5 ${step > idx + 1 ? 'bg-green-300' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Event summary */}
        <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
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

        {/* STEP 1: Verificar Datos */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              {/* Nombre - read only */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <User className="w-3.5 h-3.5" /> Nombre
                </Label>
                <Input value={lead.name} readOnly className="bg-slate-50 text-slate-600" />
              </div>

              {/* Teléfono */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <Phone className="w-3.5 h-3.5" /> Teléfono
                </Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej: 092908638" />
              </div>

              {/* CI - required */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <CreditCard className="w-3.5 h-3.5" /> Cédula de Identidad
                  <span className="text-red-500 text-xs">*</span>
                </Label>
                <Input value={ci} onChange={e => setCi(e.target.value)} placeholder="Ej: 4.728.038-6" className={!ci.trim() ? 'border-amber-300 focus:border-amber-500' : ''} />
                {!ci.trim() && <p className="text-[11px] text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Requerido para el contrato</p>}
              </div>

              {/* Domicilio - required */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <Home className="w-3.5 h-3.5" /> Domicilio
                  <span className="text-red-500 text-xs">*</span>
                </Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ej: Atahualpa Nro. 1301" className={!address.trim() ? 'border-amber-300 focus:border-amber-500' : ''} />
                {!address.trim() && <p className="text-[11px] text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Requerido para el contrato</p>}
              </div>

              {/* RUT / Empresa - optional */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Empresa</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">RUT</Label>
                  <Input value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="Opcional" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Imprimir Documentos */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <a
                href={`/presupuestos/${lead.presupuestoId}/recibo-contrato`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Printer className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">🖨️ Imprimir Contrato</p>
                  <p className="text-xs text-muted-foreground">Recibo + contrato con datos pre-completados</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </a>

              <a
                href={`/presupuestos/${lead.presupuestoId}/ver`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">🖨️ Imprimir Presupuesto</p>
                  <p className="text-xs text-muted-foreground">Vista detallada del presupuesto</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </a>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 text-center">
              Imprimí los documentos, hacé firmar al cliente, y después confirmá la conversión.
            </div>
          </div>
        )}

        {/* STEP 3: Confirmar Conversión */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            {/* Contract signed checkbox */}
            <div className="flex items-start gap-3 p-4 border-2 rounded-xl bg-emerald-50/50 border-emerald-200">
              <Checkbox
                id="contract-signed"
                checked={contractSigned}
                onCheckedChange={(checked) => setContractSigned(checked === true)}
                disabled={isProcessing}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="contract-signed" className="text-sm font-bold cursor-pointer">
                  ✅ El contrato ya fue firmado por el cliente
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">Confirmá que el cliente firmó el contrato impreso.</p>
              </div>
            </div>

            {/* Archive lead toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-slate-500" />
                <div>
                  <Label htmlFor="archive-lead-switch" className="text-sm font-semibold cursor-pointer">
                    Mover prospecto a &quot;Firmó contrato&quot;
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Por defecto el lead permanece activo en el CRM.</p>
                </div>
              </div>
              <Switch
                id="archive-lead-switch"
                checked={archiveLead}
                onCheckedChange={setArchiveLead}
                disabled={isProcessing}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700 space-y-1">
              <p>● Se creará automáticamente la ficha del cliente.</p>
              <p>● Se activará el panel de planificación del evento.</p>
              <p>● El presupuesto se marcará como aceptado.</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex !justify-between gap-2">
          {step === 1 && (
            <>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={isProcessing}>Cancelar</Button>
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="rounded-xl">
                Siguiente <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={isProcessing} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
              </Button>
              <Button onClick={() => setStep(3)} className="rounded-xl">
                Siguiente <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)} disabled={isProcessing} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
              </Button>
              <Button onClick={handleConfirm} disabled={isProcessing || !contractSigned} className="bg-green-600 hover:bg-green-700 rounded-xl">
                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Convertir a Cliente
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
