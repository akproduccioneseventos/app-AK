
'use client';

import { useState, type FormEvent, useEffect } from 'react';
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
  DialogClose,
} from "@/components/ui/dialog";
import { FileSignature, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead } from '@/types/crm';

interface ConvertToClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  lead: CrmLead;
  onSubmit: (formData: FormData) => Promise<boolean>; // Returns true on success
  onClose?: () => void;
}

export function ConvertToClientDialog({ isOpen, onOpenChange, lead, onSubmit, onClose }: ConvertToClientDialogProps) {
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [clientEmail, setClientEmail] = useState(lead.email || '');
  const [clientPhone, setClientPhone] = useState(lead.phone || '');
  // Add other client fields as needed: companyName, taxId, street
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Reset form when lead changes or dialog reopens
    if (isOpen) {
      setClientEmail(lead.email || '');
      setClientPhone(lead.phone || '');
      setContractFile(null);
    }
  }, [isOpen, lead]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setContractFile(file);
    } else if (file) {
      toast({ title: "Archivo Inválido", description: "Por favor, selecciona un archivo PDF.", variant: "destructive" });
      setContractFile(null);
      event.target.value = ""; // Clear the input
    } else {
      setContractFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contractFile) {
      toast({ title: "Contrato Requerido", description: "Por favor, carga el contrato en formato PDF.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const formData = new FormData();
    formData.append('contract', contractFile);
    formData.append('email', clientEmail);
    formData.append('phone', clientPhone);
    // Append other client fields from state to formData here

    const success = await onSubmit(formData);
    if (success) {
      onOpenChange(false); // Close dialog on successful submission
      if (onClose) onClose();
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if(!open && onClose) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-primary" /> Convertir Prospecto a Cliente
          </DialogTitle>
          <DialogDescription>
            Convierte a <span className="font-semibold">{lead.name}</span> en cliente. Se requiere el contrato firmado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="p-3 border rounded-md bg-muted/50">
            <p className="text-sm font-medium">Prospecto: {lead.name}</p>
            {/* Display other lead info if available */}
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="client-email">Email del Cliente (Opcional)</Label>
            <Input 
              id="client-email" 
              type="email"
              value={clientEmail} 
              onChange={(e) => setClientEmail(e.target.value)} 
              placeholder="cliente@ejemplo.com"
              disabled={isSaving} 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="client-phone">Teléfono del Cliente (Opcional)</Label>
            <Input 
              id="client-phone" 
              type="tel"
              value={clientPhone} 
              onChange={(e) => setClientPhone(e.target.value)} 
              placeholder="09..."
              disabled={isSaving} 
            />
          </div>
          {/* Add more fields for companyName, taxId, street if needed */}

          <div className="space-y-1">
            <Label htmlFor="contract-file" className="flex items-center gap-1">
              <FileText className="w-4 h-4" /> Contrato Firmado (PDF) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contract-file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required
              disabled={isSaving}
              className="file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {contractFile && <p className="text-xs text-muted-foreground">Archivo seleccionado: {contractFile.name}</p>}
          </div>

          <DialogFooter className="pt-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving} onClick={onClose}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || !contractFile}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
              {isSaving ? 'Convirtiendo...' : 'Confirmar y Convertir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
