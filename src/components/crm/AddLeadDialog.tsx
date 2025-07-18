
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
import type { CrmStage } from '@/types/crm';
import { Textarea } from '../ui/textarea';

interface AddLeadDialogProps {
  stages: CrmStage[];
  onLeadAdded: () => void; // Callback to refresh leads list
  defaultStageId?: string;
}

export function AddLeadDialog({ stages, onLeadAdded, defaultStageId }: AddLeadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const firstStageId = stages.length > 0 ? stages[0].id : '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!leadName.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa un nombre para el prospecto.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const result = await addCrmLead({ 
        name: leadName, 
        currentStageId: defaultStageId || firstStageId,
        email: leadEmail,
        phone: leadPhone,
        notes: leadNotes
      });
      if (result.success) {
        toast({ title: "Prospecto Añadido", description: `El prospecto "${leadName}" ha sido añadido.` });
        setLeadName('');
        setLeadEmail('');
        setLeadPhone('');
        setLeadNotes('');
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <PlusCircle className="w-5 h-5 mr-2" />
          Añadir Prospecto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Añadir Nuevo Prospecto</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo prospecto. Se añadirá a la primera etapa por defecto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="lead-name">Nombre del Prospecto *</Label>
            <Input id="lead-name" value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Ej: Contacto de Empresa XYZ" required disabled={isSaving}/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="lead-email">Email (Opcional)</Label>
            <Input id="lead-email" type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="email@ejemplo.com" disabled={isSaving}/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="lead-phone">Teléfono (Opcional)</Label>
            <Input id="lead-phone" type="tel" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} placeholder="099 123 456" disabled={isSaving}/>
          </div>
           <div className="space-y-1">
            <Label htmlFor="lead-notes">Notas (Opcional)</Label>
            <Textarea id="lead-notes" value={leadNotes} onChange={(e) => setLeadNotes(e.target.value)} placeholder="Detalles de la consulta, fecha de primer contacto, etc." disabled={isSaving} rows={3}/>
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
