'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2, PartyPopper, Calendar, MapPin, DollarSign, FileText, AlertCircle, Upload, Archive, FileSignature, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { confirmBookingWithContract } from '@/app/actions/crm';
import type { CrmLead } from '@/types/crm';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [archiveLead, setArchiveLead] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);
    if (file) {
      if (file.type !== 'application/pdf') {
        setFileError('Solo se aceptan archivos PDF.');
        setContractFile(null);
        event.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setFileError('El archivo no puede superar 10MB.');
        setContractFile(null);
        event.target.value = '';
        return;
      }
      setContractFile(file);
    } else {
      setContractFile(null);
    }
  };

  const handleConfirm = async () => {
    if (!lead.presupuestoId) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('leadId', lead.id);
      formData.append('presupuestoId', lead.presupuestoId);
      if (contractFile) {
        formData.append('contract', contractFile);
      }
      formData.append('archiveLead', archiveLead ? 'true' : 'false');

      const result = await confirmBookingWithContract(formData);
      if (result.success && result.fiestaId) {
        toast({
          title: "¡Contratación Exitosa!",
          description: contractFile
            ? "Se ha creado el cliente, vinculado el contrato y activado el evento automáticamente."
            : "Se ha creado el cliente y activado el evento. Podés generar el borrador del contrato desde el panel de gestión documental.",
        });
        setContractFile(null);
        setFileError(null);
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
      setContractFile(null);
      setFileError(null);
      setArchiveLead(false);
    }
    onOpenChange(open);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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

          {/* Info: automatic contract generation */}
          <Alert className="bg-emerald-50 border-emerald-200">
            <FileSignature className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 text-xs space-y-1">
              <p className="font-semibold">El sistema generará el borrador del contrato automáticamente.</p>
              <p>Una vez confirmado, podés ir a <strong>Gestión Documental → Borrador Contrato</strong> para revisar, editar e imprimir el contrato con todos los datos pre-completados.</p>
            </AlertDescription>
          </Alert>

          {/* Contract PDF Upload - OPTIONAL */}
          <div className="space-y-2">
            <Label htmlFor="contract-pdf" className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Contrato Firmado (PDF) — <span className="font-normal text-muted-foreground">opcional</span>
            </Label>
            <p className="text-[11px] text-muted-foreground">Si ya tenés el contrato firmado escaneado, podés adjuntarlo ahora como respaldo. De lo contrario, podés subirlo después.</p>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                contractFile ? 'border-green-400 bg-green-50' : fileError ? 'border-red-400 bg-red-50' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                id="contract-pdf"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
              />
              {contractFile ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">{contractFile.name}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Haz clic para adjuntar PDF (opcional)</p>
                </div>
              )}
            </div>
            {fileError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {fileError}
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700 space-y-1">
            <p>● Se creará automáticamente la ficha del cliente.</p>
            <p>● Se activará el panel de planificación del evento.</p>
            <p>● El presupuesto se marcará como aceptado.</p>
            <p>● El borrador del contrato quedará disponible para revisar y firmar.</p>
          </div>

          {/* Option: move lead to conversion stage */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-slate-500" />
              <div>
                <Label htmlFor="archive-lead-switch" className="text-sm font-semibold cursor-pointer">
                  Mover prospecto a "Firmó contrato"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Confirmar Contratación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
