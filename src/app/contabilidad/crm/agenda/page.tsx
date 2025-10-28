
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Loader2, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { DashboardCalendar } from '@/components/dashboard-calendar';
import { getCrmLeads } from '@/app/actions/crm';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead } from '@/types/crm';

export default function CrmAgendaPage() {
  const [meetingDates, setMeetingDates] = useState<Date[]>([]);
  const [meetings, setMeetings] = useState<CrmLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const leads = await getCrmLeads();
      const meetingsWithDate = leads.filter(lead => !!lead.followUpDate);
      const dates = meetingsWithDate.map(lead => new Date(lead.followUpDate!));
      
      setMeetings(meetingsWithDate.sort((a,b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()));
      setMeetingDates(dates);

    } catch (err: any) {
      setError("No se pudieron cargar las fechas de las reuniones.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Agenda de Reuniones con Prospectos
        </h1>
        <Link href="/contabilidad/crm" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al CRM
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-lg">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full inline-block mb-2">
                    <CalendarDays className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-xl">Calendario de Reuniones</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
             {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center text-destructive">
                    <AlertTriangle className="mx-auto w-8 h-8 mb-2"/>
                    <p>{error}</p>
                </div>
            ) : (
                <DashboardCalendar occupiedDates={meetingDates} />
            )}
            </CardContent>
        </Card>
        <Card className="md:col-span-2 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Próximas Reuniones</CardTitle>
                <CardDescription>Listado de reuniones agendadas con clientes potenciales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {isLoading ? <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
                 meetings.length > 0 ? meetings.map(meeting => (
                    <div key={meeting.id} className="p-3 border rounded-md flex items-center justify-between bg-muted/50">
                        <div>
                            <p className="font-semibold">{meeting.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5"/>
                                {new Date(meeting.followUpDate!).toLocaleString('es-UY', { dateStyle: 'long', timeStyle: 'short' })} hs.
                            </p>
                        </div>
                        <Link href={`/contabilidad/crm?leadId=${meeting.id}`} passHref>
                           <Button variant="outline" size="sm">Ver en CRM</Button>
                        </Link>
                    </div>
                 )) : <p className="text-sm text-muted-foreground text-center py-6">No hay reuniones agendadas.</p>
                }
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
