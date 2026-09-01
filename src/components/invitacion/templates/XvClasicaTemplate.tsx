'use client';

import React, { useState } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { CountdownTimer } from '@/components/countdown-timer';
import { EventLocationMap } from '@/components/invitacion/EventLocationMap';
import { AddToCalendarButton } from '@/components/invitacion/AddToCalendarButton';
import { Crown, MapPin, Calendar, Clock, Gift, Sparkles, UserCheck } from 'lucide-react';
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

export const XvClasicaTemplate: React.FC<TemplateProps> = ({
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

  const protagonista = invitacionData.cabecera?.protagonista1 || fiesta.configuracion?.nombreAgasajado || 'Mis 15 Años';
  const fechaEvento = fiesta.configuracion?.fechaEvento || '';
  const lugar = invitacionData.detallesEvento?.celebracion?.nombreLugar || fiesta.configuracion?.nombreLugar || 'Salón de Fiestas';
  const direccion = invitacionData.detallesEvento?.celebracion?.direccionLugar || fiesta.configuracion?.direccionLugar || '';
  const itinerarioItems = (fiesta.programa || []).map((c) => ({
    hora: c.hora || '',
    titulo: c.titulo || '',
    descripcion: c.descripcion || '',
  }));
  const dressCodeTexto = invitacionData.dressCode?.texto?.text || invitacionData.dressCode?.tipo || 'Elegante / Gala';
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
      toast({ title: '¡Confirmación enviada!', description: 'Gracias por acompañarme en mis 15.' });
      setIsRsvpOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo registrar la confirmación.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-[#f4efe6] font-serif selection:bg-amber-400 selection:text-black overflow-x-hidden">
      {/* ── PORTADA CLÁSICA ORO ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-xl mx-auto space-y-8 relative z-10">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-center">
            <div className="w-16 h-16 rounded-full border border-amber-400/40 bg-amber-500/10 flex items-center justify-center text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
              <Crown className="w-8 h-8" />
            </div>
          </motion.div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300 font-sans font-bold">
              Mis Quince Años
            </p>
            <h1 className="text-5xl sm:text-7xl font-normal italic tracking-wide text-amber-100 font-serif">
              {protagonista}
            </h1>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4" />
          </div>

          <p className="text-base text-zinc-300 max-w-md mx-auto font-sans font-light leading-relaxed">
            Hay momentos en la vida que son inolvidables, y compartirlos con quienes más quiero los hace eternos.
          </p>

          {fechaEvento && (
            <div className="pt-2">
              <div className="inline-block p-4 rounded-2xl bg-zinc-900/90 border border-amber-400/30 backdrop-blur-md shadow-2xl font-sans">
                <CountdownTimer targetDate={fechaEvento} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-sans">
            <Button
              onClick={() => setIsRsvpOpen(true)}
              className="h-13 px-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20"
            >
              <UserCheck className="w-4 h-4 mr-2" /> Confirmar Asistencia
            </Button>
            <AddToCalendarButton
              eventName={protagonista}
              startDate={fechaEvento || new Date().toISOString()}
              location={lugar}
              primaryColor="#f59e0b"
            />
          </div>
        </div>
      </section>

      {/* ── UBICACIÓN & DETALLES ── */}
      <section className="py-16 px-4 max-w-3xl mx-auto space-y-10 font-sans">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-amber-400/20 space-y-2 text-center">
            <Calendar className="w-6 h-6 text-amber-400 mx-auto" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-200">Fecha y Hora</h3>
            <p className="text-base text-white font-semibold">{fechaEvento || 'Fecha a confirmar'}</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-amber-400/20 space-y-2 text-center">
            <MapPin className="w-6 h-6 text-amber-400 mx-auto" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-200">Lugar</h3>
            <p className="text-base text-white font-semibold">{lugar}</p>
            {direccion && <p className="text-xs text-zinc-400">{direccion}</p>}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-amber-400/20">
          <EventLocationMap venueName={lugar} address={direccion} primaryColor="#f59e0b" />
        </div>
      </section>

      {/* ── CRONOGRAMA ── */}
      {itinerarioItems.length > 0 && (
        <section className="py-16 px-4 max-w-2xl mx-auto space-y-8 font-sans">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif italic text-amber-200">Itinerario</h2>
            <p className="text-xs text-zinc-400 uppercase tracking-widest">Cronograma de la celebración</p>
          </div>

          <div className="space-y-3">
            {itinerarioItems.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-amber-400/20">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/10 text-amber-300 text-xs font-black">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.hora || `${21 + idx}:00`}</span>
                </div>
                <p className="text-sm font-semibold text-white">{item.titulo || item.descripcion}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── DRESS CODE Y REGALOS ── */}
      <section className="py-16 px-4 max-w-3xl mx-auto grid sm:grid-cols-2 gap-4 font-sans">
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-amber-400/20 space-y-3 text-center">
          <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-200">Código de Vestimenta</h3>
          <p className="text-sm text-white font-semibold">{dressCodeTexto}</p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-amber-400/20 space-y-3 text-center">
          <Gift className="w-6 h-6 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-200">Sugerencia de Regalo</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">Si deseás hacerme un regalo, podés consultar los datos bancarios.</p>
          {datosBancarios && (
            <Button variant="outline" size="sm" onClick={() => setIsGiftOpen(true)} className="rounded-full border-amber-400/40 text-amber-300 text-xs font-bold hover:bg-amber-400/10">
              Ver datos bancarios
            </Button>
          )}
        </div>
      </section>

      {/* ── MODALES ── */}
      <Dialog open={isRsvpOpen} onOpenChange={setIsRsvpOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-amber-400/30 text-white rounded-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif italic text-amber-200">Confirmación de Asistencia</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">Por favor confirmá tu lugar para acompañarme en esta noche tan especial.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRsvpSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Nombre y Apellido</Label>
              <Input value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} required className="bg-zinc-900 border-zinc-700 text-white" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Cantidad de personas</Label>
              <Input type="number" min={1} max={10} value={rsvpCount} onChange={(e) => setRsvpCount(Number(e.target.value) || 1)} className="bg-zinc-900 border-zinc-700 text-white" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Alergias o menú especial (opcional)</Label>
              <Input value={rsvpDiet} onChange={(e) => setRsvpDiet(e.target.value)} placeholder="Vegetariano, celíaco..." className="bg-zinc-900 border-zinc-700 text-white" />
            </div>

            <Button type="submit" disabled={isSubmitting || !rsvpName.trim()} className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black uppercase text-xs">
              {isSubmitting ? 'Enviando...' : 'Confirmar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGiftOpen} onOpenChange={setIsGiftOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-amber-400/30 text-white rounded-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif italic text-amber-200">Datos Bancarios</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs text-zinc-300 whitespace-pre-wrap">
            {datosBancarios}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
