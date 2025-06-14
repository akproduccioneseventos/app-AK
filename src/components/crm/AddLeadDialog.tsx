
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

interface AddLeadDialogProps {
  stages: CrmStage[];
  onLeadAdded: () => void; // Callback to refresh leads list
  defaultStageId?: string;
}

export function AddLeadDialog({ stages, onLeadAdded, defaultStageId }: AddLeadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const firstStageId = stages.length > 0 ? stages[0].id : '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!leadName.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa un nombre para el lead.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const result = await addCrmLead({ name: leadName, currentStageId: defaultStageId || firstStageId });
      if (result.success) {
        toast({ title: "Lead Añadido", description: `El lead "${leadName}" ha sido añadido.` });
        setLeadName('');
        setIsOpen(false);
        onLeadAdded();
      } else {
        throw new Error(result.error || "No se pudo añadir el lead.");
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
          Nuevo Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Añadir Nuevo Lead</DialogTitle>
          <DialogDescription>
            Ingresa el nombre del nuevo lead. Se añadirá a la primera etapa por defecto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="lead-name">Nombre del Lead</Label>
            <Input
              id="lead-name"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="Ej: Contacto de Empresa XYZ"
              required
              disabled={isSaving}
            />
          </div>
          <DialogFooter className="pt-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || !firstStageId}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Añadir Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
