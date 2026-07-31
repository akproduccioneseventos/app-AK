'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Users, CheckCircle2, Clock, XCircle, MessageCircle, ExternalLink } from 'lucide-react';
import { getRsvpReminderPreview, generateWhatsAppRsvpLink } from '@/app/actions/rsvp-reminders.actions';
import { RsvpReminderMessage } from '@/lib/rsvp/rsvp-reminder-engine';
import { Invitado } from '@/types/fiesta';

interface RsvpReminderPanelProps {
  fiestaId: string;
}

export function RsvpReminderPanel({ fiestaId }: RsvpReminderPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ pendingGuests: Invitado[], messages: RsvpReminderMessage[], stats: { totalGuests: number, confirmados: number, rechazados: number, pendientes: number } } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getRsvpReminderPreview(fiestaId);
        setData(result);
      } catch (error) {
        // Silenciosamente ignorado en prod para evitar fuga de logs.
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fiestaId]);

  if (loading) {
    return <div>Cargando panel de recordatorios...</div>;
  }

  if (!data) {
    return <div>Error al cargar los datos.</div>;
  }

  const { totalGuests: totalInvitados, confirmados, pendientes, rechazados } = data.stats;

  return (
    <Card className="w-full shadow-lg border-emerald-100">
      <CardHeader className="bg-emerald-50/50">
        <CardTitle className="text-2xl text-emerald-800 flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          Recordatorios de Asistencia
        </CardTitle>
        <CardDescription className="text-emerald-600">
          Gestioná y enviá recordatorios a los invitados que aún no confirmaron.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-100">
            <Users className="h-5 w-5 text-slate-500 mb-2" />
            <span className="text-sm text-slate-500 font-medium">Total</span>
            <span className="text-2xl font-bold text-slate-700">{totalInvitados}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
            <span className="text-sm text-emerald-600 font-medium">Confirmados</span>
            <span className="text-2xl font-bold text-emerald-700">{confirmados}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-lg border border-amber-100">
            <Clock className="h-5 w-5 text-amber-500 mb-2" />
            <span className="text-sm text-amber-600 font-medium">Pendientes</span>
            <span className="text-2xl font-bold text-amber-700">{pendientes}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-rose-50 rounded-lg border border-rose-100">
            <XCircle className="h-5 w-5 text-rose-500 mb-2" />
            <span className="text-sm text-rose-600 font-medium">Rechazados</span>
            <span className="text-2xl font-bold text-rose-700">{rechazados}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Invitados Pendientes</h3>
          {data.messages.length === 0 ? (
            <p className="text-slate-500 italic">No hay invitados pendientes con número de contacto.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.messages.map((msg) => (
                <div key={msg.guestId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800">{msg.guestName}</p>
                    <p className="text-sm text-slate-500">{msg.phone}</p>
                    <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200">
                      Pendiente
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={async () => {
                      const link = await generateWhatsAppRsvpLink(msg.guestName, msg.phone, msg.message);
                      window.open(link, '_blank');
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Recordatorio
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-slate-50 border-t flex justify-end p-4">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <ExternalLink className="h-4 w-4 mr-2" />
          Enviar a Todos los Pendientes
        </Button>
      </CardFooter>
    </Card>
  );
}
