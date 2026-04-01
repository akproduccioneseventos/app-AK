
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Loader2, AlertTriangle, Clock, CalendarPlus, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardCalendar } from '@/components/dashboard-calendar';
import { getCrmLeads } from '@/app/actions/crm';
import { getWhatsAppTemplates, getCompanyInfo } from '@/app/actions/settings';
import { getSocialConnections } from '@/app/actions/social-connections';
import { useToast } from '@/hooks/use-toast';
import type { CrmLead } from '@/types/crm';
import type { WhatsAppTemplates } from '@/types/settings';
import { isSameDay, startOfToday, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScheduleNewMeetingDialog } from '@/components/crm/ScheduleNewMeetingDialog';
import { WhatsAppSendModal } from '@/components/whatsapp/WhatsAppSendModal';
import { renderTemplate, openWhatsApp } from '@/lib/whatsapp-templates';

export default function CrmAgendaPage() {
  const [allMeetings, setAllMeetings] = useState<CrmLead[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const isMountedRef = useRef(false);
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // WhatsApp state
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplates | null>(null);
  const [waPhone, setWaPhone] = useState('');
  const [companyName, setCompanyName] = useState('AK Producciones');
  const [waSendModalOpen, setWaSendModalOpen] = useState(false);
  const [waSendMessage, setWaSendMessage] = useState('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leads, templates, connections, company] = await Promise.all([
        getCrmLeads(),
        getWhatsAppTemplates(),
        getSocialConnections(),
        getCompanyInfo(),
      ]);
      if (!isMountedRef.current) return;
      const meetingsWithDate = leads.filter(lead => !!lead.followUpDate);
      setAllMeetings(meetingsWithDate.sort((a,b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()));
      setWaTemplates(templates);
      setCompanyName(company?.companyName ?? 'AK Producciones');
      const wp = connections.find(c => c.platform === 'WhatsApp' && c.isConnected);
      if (wp?.phoneNumber) setWaPhone(wp.phoneNumber);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setError("No se pudieron cargar las fechas de las reuniones.");
      toastRef.current({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []); // Stable - dependencies accessed via refs

  useEffect(() => {
    fetchMeetings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const meetingDates = useMemo(() => {
      return allMeetings.map(lead => new Date(lead.followUpDate!));
  }, [allMeetings]);

  const meetingsForSelectedDay = useMemo(() => {
    if (!selectedDate) {
      // Show today's and future meetings if no date is selected
      const today = startOfToday();
      return allMeetings.filter(m => new Date(m.followUpDate!) >= today);
    }
    return allMeetings.filter(m => isSameDay(new Date(m.followUpDate!), selectedDate));
  }, [allMeetings, selectedDate]);

  const handleSendWhatsApp = (meeting: CrmLead) => {
    if (!waTemplates?.enabled) return;
    const eventoFecha = meeting.followUpDate
      ? format(new Date(meeting.followUpDate), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
      : '';
    const rendered = renderTemplate(waTemplates.crmFollowUp, {
      clienteNombre: meeting.name,
      eventoFecha,
      empresaNombre: companyName,
    });
    if (waTemplates.mode === 'manual') {
      setWaSendMessage(rendered);
      setWaSendModalOpen(true);
    } else {
      openWhatsApp(meeting.phone ?? waPhone, rendered);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ScheduleNewMeetingDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onMeetingScheduled={fetchMeetings}
      />
      <WhatsAppSendModal
        open={waSendModalOpen}
        onOpenChange={setWaSendModalOpen}
        initialMessage={waSendMessage}
        phoneNumber={waPhone}
      />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Agenda de Reuniones con Prospectos
        </h1>
        <div className="flex gap-2">
            <Button onClick={() => setIsModalOpen(true)}><CalendarPlus className="w-4 h-4 mr-2"/>Agendar Nueva Reunión</Button>
            <Link href="/contabilidad/crm">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al CRM
              </Button>
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-lg">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full inline-block mb-2">
                    <CalendarDays className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-xl">Calendario de Reuniones</CardTitle>
                <CardDescription>Selecciona un día para ver las reuniones.</CardDescription>
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
                <DashboardCalendar 
                  occupiedDates={meetingDates} 
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
            )}
            </CardContent>
        </Card>
        <Card className="md:col-span-2 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">
                  Reuniones para: {selectedDate ? selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long'}) : 'Próximas Reuniones'}
                </CardTitle>
                <CardDescription>Listado de reuniones agendadas con clientes potenciales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {isLoading ? <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
                 meetingsForSelectedDay.length > 0 ? meetingsForSelectedDay.map(meeting => (
                    <div key={meeting.id} className="p-3 border rounded-md flex items-center justify-between bg-muted/50">
                        <div>
                            <p className="font-semibold">{meeting.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5"/>
                                {new Date(meeting.followUpDate!).toLocaleString('es-UY', { timeStyle: 'short' })} hs.
                            </p>
                        </div>
                        <div className="flex gap-2">
                          {waTemplates?.enabled && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                              onClick={() => handleSendWhatsApp(meeting)}
                              title="Enviar recordatorio por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4 mr-1.5" />
                              WhatsApp
                            </Button>
                          )}
                          <Link href={`/contabilidad/crm?leadId=${meeting.id}`}>
                             <Button variant="outline" size="sm">Ver en CRM</Button>
                          </Link>
                        </div>
                    </div>
                 )) : <p className="text-sm text-muted-foreground text-center py-6">No hay reuniones agendadas para este día.</p>
                }
            </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default function CrmAgendaPage() {
  const [allMeetings, setAllMeetings] = useState<CrmLead[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfToday());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const isMountedRef = useRef(false);
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const leads = await getCrmLeads();
      if (!isMountedRef.current) return;
      const meetingsWithDate = leads.filter(lead => !!lead.followUpDate);
      setAllMeetings(meetingsWithDate.sort((a,b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()));

    } catch (err: any) {
      if (!isMountedRef.current) return;
      setError("No se pudieron cargar las fechas de las reuniones.");
      toastRef.current({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []); // Stable - dependencies accessed via refs

  useEffect(() => {
    fetchMeetings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const meetingDates = useMemo(() => {
      return allMeetings.map(lead => new Date(lead.followUpDate!));
  }, [allMeetings]);

  const meetingsForSelectedDay = useMemo(() => {
    if (!selectedDate) {
      // Show today's and future meetings if no date is selected
      const today = startOfToday();
      return allMeetings.filter(m => new Date(m.followUpDate!) >= today);
    }
    return allMeetings.filter(m => isSameDay(new Date(m.followUpDate!), selectedDate));
  }, [allMeetings, selectedDate]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ScheduleNewMeetingDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onMeetingScheduled={fetchMeetings}
      />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Agenda de Reuniones con Prospectos
        </h1>
        <div className="flex gap-2">
            <Button onClick={() => setIsModalOpen(true)}><CalendarPlus className="w-4 h-4 mr-2"/>Agendar Nueva Reunión</Button>
            <Link href="/contabilidad/crm">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al CRM
              </Button>
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-lg">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-3 rounded-full inline-block mb-2">
                    <CalendarDays className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-xl">Calendario de Reuniones</CardTitle>
                <CardDescription>Selecciona un día para ver las reuniones.</CardDescription>
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
                <DashboardCalendar 
                  occupiedDates={meetingDates} 
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
            )}
            </CardContent>
        </Card>
        <Card className="md:col-span-2 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">
                  Reuniones para: {selectedDate ? selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long'}) : 'Próximas Reuniones'}
                </CardTitle>
                <CardDescription>Listado de reuniones agendadas con clientes potenciales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {isLoading ? <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
                 meetingsForSelectedDay.length > 0 ? meetingsForSelectedDay.map(meeting => (
                    <div key={meeting.id} className="p-3 border rounded-md flex items-center justify-between bg-muted/50">
                        <div>
                            <p className="font-semibold">{meeting.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5"/>
                                {new Date(meeting.followUpDate!).toLocaleString('es-UY', { timeStyle: 'short' })} hs.
                            </p>
                        </div>
                        <Link href={`/contabilidad/crm?leadId=${meeting.id}`}>
                           <Button variant="outline" size="sm">Ver en CRM</Button>
                        </Link>
                    </div>
                 )) : <p className="text-sm text-muted-foreground text-center py-6">No hay reuniones agendadas para este día.</p>
                }
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
