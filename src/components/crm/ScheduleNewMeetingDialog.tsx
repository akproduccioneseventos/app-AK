
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
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
import { CalendarPlus, Loader2, Search } from 'lucide-react';
import { DatePickerDemo } from '../date-picker-demo';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead } from '@/types/crm';
import { getCrmLeads, scheduleCrmMeeting } from '@/app/actions/crm';
import { ScrollArea } from '../ui/scroll-area';

interface ScheduleNewMeetingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMeetingScheduled: () => void;
}

export function ScheduleNewMeetingDialog({ isOpen, onOpenChange, onMeetingScheduled }: ScheduleNewMeetingDialogProps) {
  const [allLeads, setAllLeads] = useState<CrmLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<CrmLead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(new Date());
  const [meetingTime, setMeetingTime] = useState<string>('10:00');
  const [meetingTitle, setMeetingTitle] = useState('Reunión de seguimiento');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const resetForm = useCallback(() => {
    setSelectedLeadId('');
    setSearchTerm('');
    setMeetingDate(new Date());
    setMeetingTime('10:00');
    setMeetingTitle('Reunión de seguimiento');
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      const loadLeads = async () => {
        setIsLoading(true);
        try {
          const leads = await getCrmLeads();
          setAllLeads(leads);
          setFilteredLeads(leads);
        } catch (err) {
          toast({ title: "Error", description: "No se pudieron cargar los prospectos." });
        } finally {
          setIsLoading(false);
        }
      };
      loadLeads();
    }
  }, [isOpen, resetForm, toast]);

  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    setFilteredLeads(allLeads.filter(lead => lead.name.toLowerCase().includes(lowercasedTerm)));
  }, [searchTerm, allLeads]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !meetingDate || !meetingTime || !meetingTitle.trim()) {
      toast({ title: "Datos incompletos", description: "Selecciona un prospecto, fecha, hora y título.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    
    const finalDateTime = new Date(meetingDate);
    const [hours, minutes] = meetingTime.split(':').map(Number);
    finalDateTime.setHours(hours, minutes, 0, 0);

    try {
        const result = await scheduleCrmMeeting(selectedLeadId, finalDateTime.toISOString(), meetingTitle.trim());
        if(result.success) {
            toast({ title: "Reunión Agendada", description: `Se agendó una reunión con ${result.lead?.name}.`});
            onMeetingScheduled();
            onOpenChange(false);
        } else {
            throw new Error(result.error || "No se pudo agendar la reunión.");
        }
    } catch(err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-primary" />
            Agendar Nueva Reunión con Prospecto
          </DialogTitle>
          <DialogDescription>
            Selecciona un prospecto y la fecha para la nueva reunión.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
                <Label>1. Seleccionar Prospecto *</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar prospecto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8"/>
                </div>
                <ScrollArea className="h-40 border rounded-md">
                    {isLoading ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin"/></div> :
                     <div className="p-1">
                        {filteredLeads.map(lead => (
                            <Button
                                key={lead.id}
                                type="button"
                                variant={selectedLeadId === lead.id ? 'default' : 'ghost'}
                                className="w-full justify-start text-left"
                                onClick={() => setSelectedLeadId(lead.id)}
                            >
                                {lead.name}
                            </Button>
                        ))}
                     </div>
                    }
                </ScrollArea>
            </div>
             <div className="space-y-1">
                <Label htmlFor="meeting-title">2. Título de la Reunión *</Label>
                <Input id="meeting-title" value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} required/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label htmlFor="meeting-date">3. Fecha *</Label>
                    <DatePickerDemo selectedDate={meetingDate} onDateChange={setMeetingDate} />
                 </div>
                 <div className="space-y-1">
                    <Label htmlFor="meeting-time">4. Hora *</Label>
                    <Input id="meeting-time" type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} required/>
                 </div>
            </div>
             <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving || !selectedLeadId}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                    Agendar y Guardar
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
