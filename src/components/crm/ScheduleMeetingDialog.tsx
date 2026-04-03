
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
} from "@/components/ui/dialog";
import { CalendarDays, Loader2 } from 'lucide-react';
import { DatePickerDemo } from '../date-picker-demo';
import { useToast } from '@/hooks/use-toast';

interface ScheduleMeetingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  leadName: string;
  meetingType: 'Entrevista' | 'Firma de Contrato';
  onSubmit: (meetingDate: string) => Promise<void>;
  onClose: () => void;
}

export function ScheduleMeetingDialog({ isOpen, onOpenChange, leadName, meetingType, onSubmit, onClose }: ScheduleMeetingDialogProps) {
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(new Date());
  const [meetingTime, setMeetingTime] = useState<string>('10:00');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!meetingDate || !meetingTime) {
      toast({ title: "Datos incompletos", description: "Por favor, selecciona fecha y hora.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    
    const finalDateTime = new Date(meetingDate);
    const [hours, minutes] = meetingTime.split(':').map(Number);
    finalDateTime.setHours(hours, minutes, 0, 0);

    try {
      await onSubmit(finalDateTime.toISOString());
    } catch (error: any) {
      toast({ title: "Error al Agendar", description: error.message || "Ocurrió un error inesperado.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if(!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Agendar {meetingType}
          </DialogTitle>
          <DialogDescription>
            Establece la fecha y hora para la {meetingType.toLowerCase()} con <span className="font-semibold">{leadName}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label htmlFor="meeting-date">Fecha</Label>
                    <DatePickerDemo selectedDate={meetingDate} onDateChange={setMeetingDate} />
                 </div>
                 <div className="space-y-1">
                    <Label htmlFor="meeting-time">Hora</Label>
                    <Input id="meeting-time" type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} required/>
                 </div>
            </div>
             <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                    Agendar y Mover
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
