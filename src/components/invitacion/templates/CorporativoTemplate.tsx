'use client';

import React, { useState } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { CountdownTimer } from '@/components/countdown-timer';
import { EventLocationMap } from '@/components/invitacion/EventLocationMap';
import { AddToCalendarButton } from '@/components/invitacion/AddToCalendarButton';
import { Building2, MapPin, Calendar, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface TemplateProps {
  fiesta: FiestaEnPlanificacion;
  invitacionData: InvitacionDigitalData;
  socialConnections?: SocialConnection[];
  isPreview?: boolean;
  onSectionClick?: (sectionId: string) => void;
  onUpdate?: (newData: Partial<InvitacionDigitalData>) => void;
  onRsvpSubmit?: (submission: any) => Promise<boolean>;
  selectedSectionId?: string | null;
}

export const CorporativoTemplate: React.FC<TemplateProps> = ({
  fiesta,
  invitacionData,
  onRsvpSubmit,
}) => {
  const { toast } = useToast();
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpCompany, setRsvpCompany] = useState('');
  const [rsvpCount, setRsvpCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventoNombre = invitacionData.cabecera?.protagonista1 || fiesta.configuracion?.nombreEvento || 'Evento Corporativo';
  const fechaEvento = fiesta.configuracion?.fechaEvento || '';
  const lugar = invitacionData.detallesEvento?.celebracion?.nombreLugar || fiesta.configuracion?.nombreLugar || 'Centro de Convenciones';
  const direccion = invitacionData.detallesEvento?.celebracion?.direccionLugar || fiesta.configuracion?.direccionLugar || '';
  const itinerarioItems = (fiesta.programa || []).map((c) => ({
    hora: c.hora || '',
    titulo: c.titulo || '',
    descripcion: c.descripcion || '',
  }));
  const dressCodeTexto = invitacionData.dressCode?.texto?.text || invitacionData.dressCode?.tipo || 'Business Casual / Formal';

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setIsSubmitting(true);
    try {
      if (onRsvpSubmit) {
        await onRsvpSubmit({
          nombre: `${rsvpName}${rsvpCompany ? ` (${rsvpCompany})` : ''}`,
          asistencia: true,
          adultos: rsvpCount,
        });
      }
      toast({ title: 'Acreditación confirmada', description: 'Su asistencia ha sido registrada exitosamente.' });
      setIsRsvpOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo procesar la acreditación.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* ── HERO CORPORATIVO ── */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center border-b border-slate-800">
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-md bg-blue-900/40 border border-blue-700/50 text-blue-400 text-xs font-semibold uppercase tracking-widest">
              <Building2 className="w-3.5 h-3.5" /> Evento Institucional
            </span>
          </motion.div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
            {eventoNombre}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            Lo invitamos a participar de este encuentro profesional y compartir una jornada de networking y celebración.
          </p>

          {fechaEvento && (
            <div className="pt-2">
              <div className="inline-block p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <CountdownTimer targetDate={fechaEvento} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              onClick={() => setIsRsvpOpen(true)}
              className="h-12 px-8 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider"
            >
              <UserCheck className="w-4 h-4 mr-2" /> Acreditación / RSVP
            </Button>
            <AddToCalendarButton
              eventName={eventoNombre}
              startDate={fechaEvento || new Date().toISOString()}
              location={lugar}
              primaryColor="#2563eb"
            />
          </div>
        </div>
      </section>

      {/* ── DETALLES & AGENDA ── */}
      <section className="py-16 px-4 max-w-3xl mx-auto space-y-12">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fecha del Evento</h3>
            <p className="text-base text-white font-semibold">{fechaEvento || 'A definir'}</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sede</h3>
            <p className="text-base text-white font-semibold">{lugar}</p>
            {direccion && <p className="text-xs text-slate-400">{direccion}</p>}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-700/60">
          <EventLocationMap venueName={lugar} address={direccion} primaryColor="#2563eb" />
        </div>

        {itinerarioItems.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-wider text-center text-white">Programa / Agenda</h2>
            <div className="space-y-2">
              {itinerarioItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <span className="text-xs font-mono font-bold text-blue-400 px-2.5 py-1 rounded bg-blue-950/60 border border-blue-800/40">
                    {item.hora || `${19 + idx}:00`}
                  </span>
                  <span className="text-sm font-medium text-slate-200">{item.titulo || item.descripcion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2 text-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Código de Vestimenta</h3>
          <p className="text-sm font-bold text-white">{dressCodeTexto}</p>
        </div>
      </section>

      {/* ── MODAL RSVP ── */}
      <Dialog open={isRsvpOpen} onOpenChange={setIsRsvpOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase">Confirmación de Acreditación</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Por favor ingrese sus datos para el registro de asistentes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRsvpSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-300">Nombre y Apellido</Label>
              <Input value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-300">Empresa / Institución (opcional)</Label>
              <Input value={rsvpCompany} onChange={(e) => setRsvpCompany(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-300">Cantidad de asistentes</Label>
              <Input type="number" min={1} max={10} value={rsvpCount} onChange={(e) => setRsvpCount(Number(e.target.value) || 1)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <Button type="submit" disabled={isSubmitting || !rsvpName.trim()} className="w-full h-11 rounded-md bg-blue-600 text-white font-bold text-xs uppercase">
              {isSubmitting ? 'Procesando...' : 'Confirmar Acreditación'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
