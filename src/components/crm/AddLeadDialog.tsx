
'use client';

import { useState, type FormEvent } from 'react';
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
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addCrmLead } from '@/app/actions/crm';
import type { CrmStage, NewCrmLeadData } from '@/types/crm';
import { Textarea } from '../ui/textarea';
import type { TipoEvento } from '@/types/presupuesto';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddLeadDialogProps {
  stages: CrmStage[];
  onLeadAdded: () => void; // Callback to refresh leads list
  defaultStageId?: string;
}

export function AddLeadDialog({ stages, onLeadAdded, defaultStageId }: AddLeadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<NewCrmLeadData>>({ name: '', email: '', phone: '', notes: '', partyType: '', venueName: '', guestCount: undefined });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const firstStageId = stages.length > 0 ? stages[0].id : '';

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', notes: '', partyType: '', venueName: '', guestCount: undefined });
  };

  const handleInputChange = (field: keyof NewCrmLeadData, value: string | number) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || (!formData.email?.trim() && !formData.phone?.trim())) {
      toast({ title: "Datos Requeridos", description: "Por favor, ingresa el nombre y un método de contacto (email o teléfono).", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const result = await addCrmLead({ 
        ...formData,
        currentStageId: defaultStageId || firstStageId,
      } as NewCrmLeadData);

      if (result.success) {
        toast({ title: "Prospecto Añadido", description: `El prospecto "${formData.name}" ha sido añadido.` });
        resetForm();
        setIsOpen(false);
        onLeadAdded();
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
          <div className="space-y-1">
            <Label htmlFor="lead-name">Nombre del Prospecto *</Label>
            <Input id="lead-name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Ej: Contacto de Empresa XYZ" required disabled={isSaving}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="lead-email">Email</Label>
              <Input id="lead-email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="email@ejemplo.com" disabled={isSaving}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="lead-phone">Teléfono</Label>
              <Input id="lead-phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="099 123 456" disabled={isSaving}/>
            </div>
          </div>
           <p className="text-xs text-muted-foreground -mt-2">Al menos uno de los dos campos de contacto (Email o Teléfono) es obligatorio.</p>
           
          <div className="space-y-1">
            <Label htmlFor="lead-party-type">Tipo de Fiesta (Opcional)</Label>
            <Select value={formData.partyType || ''} onValueChange={(value) => handleInputChange('partyType', value)}>
                <SelectTrigger id="lead-party-type"><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                <SelectContent>
                    {ALL_TIPOS_EVENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
            </Select>
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
