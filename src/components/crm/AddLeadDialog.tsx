
'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCrmLead, checkDuplicatePhone } from '@/app/actions/crm';
import type { CrmLead, CrmStage, NewCrmLeadData } from '@/types/crm';
import { Textarea } from '../ui/textarea';
import type { TipoEvento } from '@/types/presupuesto';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '../date-picker-demo';

interface AddLeadDialogProps {
  stages: CrmStage[];
  onLeadAdded: () => void;
  defaultStageId?: string;
  /** Current leads list for assignee suggestions (optional) */
  currentUserName?: string;
}

export function AddLeadDialog({ stages, onLeadAdded, defaultStageId, currentUserName }: AddLeadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<NewCrmLeadData>>({ name: '', phone: '', notes: '', partyType: '', venueName: '', guestCount: undefined, followUpDate: undefined, assignedTo: currentUserName || '' });
  const [isSaving, setIsSaving] = useState(false);
  const [duplicateLead, setDuplicateLead] = useState<CrmLead | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const firstStageId = stages.length > 0 ? stages[0].id : '';

  const resetForm = () => {
    setFormData({ name: '', phone: '', notes: '', partyType: '', venueName: '', guestCount: undefined, followUpDate: undefined, assignedTo: currentUserName || '' });
    setDuplicateLead(null);
  };

  const handleInputChange = (field: keyof NewCrmLeadData, value: string | number | undefined | Date) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handlePhoneBlur = useCallback(async (phone: string) => {
    if (!phone || phone.trim().length < 6) {
      setDuplicateLead(null);
      return;
    }
    setIsCheckingDuplicate(true);
    try {
      const { duplicate } = await checkDuplicatePhone(phone.trim());
      setDuplicateLead(duplicate);
    } catch {
      // ignore
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim()) {
      toast({ title: "Datos Requeridos", description: "Por favor, ingresa el nombre y el teléfono de contacto.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const dataToSave: NewCrmLeadData = {
        ...formData,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : undefined
      } as NewCrmLeadData;

      const result = await addCrmLead({ 
        ...dataToSave,
        currentStageId: defaultStageId || firstStageId,
      });

      if (result.success) {
        toast({ title: "Prospecto Añadido", description: `El prospecto "${formData.name}" ha sido añadido.` });
        resetForm();
        setIsOpen(false);
        onLeadAdded();
      } else if (result.duplicate) {
        // Duplicate found server-side
        setDuplicateLead(result.duplicate);
        toast({ title: "Teléfono duplicado", description: result.error, variant: "destructive" });
      } else {
        throw new Error(result.error || "No se pudo añadir el prospecto.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="default">
          <PlusCircle className="w-5 h-5 mr-2" />
          Añadir Prospecto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Añadir Nuevo Prospecto</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo prospecto. Se añadirá a la primera etapa por defecto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-4">
          {duplicateLead && (
            <Alert variant="destructive" className="bg-orange-50 border-orange-300 text-orange-900">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="flex items-center justify-between gap-2 flex-wrap">
                <span>Ya existe un prospecto con este teléfono: <strong>{duplicateLead.name}</strong></span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-orange-400 text-orange-800 hover:bg-orange-100"
                  onClick={() => { setIsOpen(false); router.push('/contabilidad/crm'); }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" /> Ver en CRM
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="lead-name">Nombre del Prospecto *</Label>
              <Input id="lead-name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Ej: Contacto de Empresa XYZ" required disabled={isSaving}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="lead-phone">
                Teléfono *
                {isCheckingDuplicate && <span className="text-xs text-muted-foreground ml-1">(verificando...)</span>}
              </Label>
              <Input
                id="lead-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => { handleInputChange('phone', e.target.value); setDuplicateLead(null); }}
                onBlur={(e) => handlePhoneBlur(e.target.value)}
                placeholder="099 123 456"
                disabled={isSaving}
                required
                className={duplicateLead ? 'border-orange-400 focus-visible:ring-orange-400' : ''}
              />
            </div>
          </div>
           
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label htmlFor="lead-party-type">Tipo de Fiesta (Opcional)</Label>
                <Select value={formData.partyType || ''} onValueChange={(value) => handleInputChange('partyType', value)}>
                    <SelectTrigger id="lead-party-type"><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                    <SelectContent>
                        {ALL_TIPOS_EVENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="lead-follow-up">FECHA DEL EVENTO (opcional)</Label>
              <DatePickerDemo selectedDate={formData.followUpDate ? new Date(formData.followUpDate) : undefined} onDateChange={(date) => handleInputChange('followUpDate', date)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label htmlFor="lead-venue">Salón (Opcional)</Label>
                <Input id="lead-venue" value={formData.venueName} onChange={(e) => handleInputChange('venueName', e.target.value)} placeholder="Ej: Salón El Trébol" disabled={isSaving}/>
            </div>
            <div className="space-y-1">
                <Label htmlFor="lead-guests">Nº Invitados (Opcional)</Label>
                <Input id="lead-guests" type="number" value={formData.guestCount || ''} onChange={(e) => handleInputChange('guestCount', Number(e.target.value))} placeholder="Ej: 100" disabled={isSaving}/>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="lead-assigned">Asignado a (Opcional)</Label>
            <Input id="lead-assigned" value={formData.assignedTo || ''} onChange={(e) => handleInputChange('assignedTo', e.target.value)} placeholder="Ej: María García" disabled={isSaving}/>
          </div>
           <div className="space-y-1">
            <Label htmlFor="lead-notes">Notas (Opcional)</Label>
            <Textarea id="lead-notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Detalles de la consulta, fecha de primer contacto, etc." disabled={isSaving} rows={3}/>
          </div>
          <DialogFooter className="pt-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || !firstStageId}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Añadir prospecto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

