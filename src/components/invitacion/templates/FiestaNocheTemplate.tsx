'use client';

import React, { useState } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { CountdownTimer } from '@/components/countdown-timer';
import { EventLocationMap } from '@/components/invitacion/EventLocationMap';
import { AddToCalendarButton } from '@/components/invitacion/AddToCalendarButton';
import { Zap, MapPin, Calendar, Clock, Gift, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

export const FiestaNocheTemplate: React.FC<TemplateProps> = ({
  fiesta,
  invitacionData,
  onRsvpSubmit,
}) => {
  const { toast } = useToast();
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpCount, setRsvpCount] = useState(1);
  const [rsvpDiet, setRsvpDiet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const protagonista = invitacionData.cabecera?.protagonista1 || fiesta.configuracion?.nombreAgasajado || 'La Gran Fiesta';
  const fechaEvento = fiesta.configuracion?.fechaEvento || '';
  const lugar = invitacionData.detallesEvento?.celebracion?.nombreLugar || fiesta.configuracion?.nombreLugar || 'Salón de Eventos';
  const direccion = invitacionData.detallesEvento?.celebracion?.direccionLugar || fiesta.configuracion?.direccionLugar || '';
  const itinerarioItems = (fiesta.programa || []).map((c) => ({
    hora: c.hora || '',
    titulo: c.titulo || '',
    descripcion: c.descripcion || '',
  }));
  const dressCodeTexto = invitacionData.dressCode?.texto?.text || invitacionData.dressCode?.tipo || 'Fiesta / Casual Chic';
  const datosBancarios = invitacionData.regalos?.datosBancarios || '';

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setIsSubmitting(true);
    try {
      if (onRsvpSubmit) {
        await onRsvpSubmit({
          nombre: rsvpName,
          asistencia: true,
          adultos: rsvpCount,
          restriccionesAlimentarias: rsvpDiet,
        });
      }
      toast({ title: '¡Anotado para la fiesta!', description: 'Preparate para una noche inolvidable.' });
      setIsRsvpOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar la confirmación.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-400 selection:text-black overflow-x-hidden">
      {/* ── HERO NEÓN NOCHE ── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/40 via-purple-900/20 to-black pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Zap className="w-4 h-4" /> Party Night
            </span>
          </motion.div>

          <h1 className="text-6xl sm:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-fuchsia-400">
            {protagonista}
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 font-medium max-w-md mx-auto">
            ¡Se festeja a lo grande! Música, barra libre y fiesta hasta el amanecer.
          </p>

          {fechaEvento && (
            <div className="pt-2">
              <div className="inline-block p-4 rounded-2xl bg-zinc-900/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <CountdownTimer targetDate={fechaEvento} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              onClick={() => setIsRsvpOpen(true)}
              className="h-13 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-widest shadow-xl shadow-cyan-500/30"
            >
              <UserCheck className="w-4 h-4 mr-2" /> Confirmar Asistencia
            </Button>
            <AddToCalendarButton
              eventName={protagonista}
              startDate={fechaEvento || new Date().toISOString()}
              location={lugar}
              primaryColor="#06b6d4"
            />
          </div>
        </div>
      </section>

      {/* ── DETALLES & MAPA ── */}
      <section className="py-16 px-4 max-w-3xl mx-auto space-y-10">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <Calendar className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Fecha</h3>
            <p className="text-base text-white font-black">{fechaEvento || 'Fecha a confirmar'}</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <MapPin className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Lugar</h3>
            <p className="text-base text-white font-black">{lugar}</p>
            {direccion && <p className="text-xs text-zinc-400">{direccion}</p>}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-zinc-800">
          <EventLocationMap venueName={lugar} address={direccion} primaryColor="#06b6d4" />
        </div>

        {itinerarioItems.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase text-center text-cyan-400">Line Up / Cronograma</h2>
            <div className="max-w-md mx-auto space-y-3">
              {itinerarioItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <span className="text-xs font-mono font-bold text-cyan-300 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/50">
                    {item.hora || `${23 + idx}:00`}
                  </span>
                  <span className="text-sm font-bold text-white">{item.titulo || item.descripcion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-zinc-800">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2 text-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400">Dress Code</h3>
            <p className="text-sm font-bold text-white">{dressCodeTexto}</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2 text-center">
            <Gift className="w-5 h-5 text-cyan-400 mx-auto" />
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400">Regalos</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Si querés hacerme un presente, podés ver los datos aquí.</p>
            {datosBancarios && (
              <Button variant="outline" size="sm" onClick={() => setIsGiftOpen(true)} className="rounded-xl border-zinc-700 text-xs font-bold">
                Ver cuenta
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── MODALES ── */}
      <Dialog open={isRsvpOpen} onOpenChange={setIsRsvpOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-cyan-500/40 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-cyan-300">Confirmá tu Asistencia</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRsvpSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-300">Nombre</Label>
              <Input value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} required className="bg-zinc-900 border-zinc-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-300">Acompañantes</Label>
              <Input type="number" min={1} max={10} value={rsvpCount} onChange={(e) => setRsvpCount(Number(e.target.value) || 1)} className="bg-zinc-900 border-zinc-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-300">Aclaraciones (opcional)</Label>
              <Input value={rsvpDiet} onChange={(e) => setRsvpDiet(e.target.value)} className="bg-zinc-900 border-zinc-700 text-white" />
            </div>
            <Button type="submit" disabled={isSubmitting || !rsvpName.trim()} className="w-full h-11 rounded-xl bg-cyan-500 text-black font-black uppercase text-xs">
              {isSubmitting ? 'Enviando...' : 'Confirmar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGiftOpen} onOpenChange={setIsGiftOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-cyan-500/40 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-cyan-300">Datos Bancarios</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
            {datosBancarios}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
