'use client';

import React, { useState } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { CountdownTimer } from '@/components/countdown-timer';
import { EventLocationMap } from '@/components/invitacion/EventLocationMap';
import { AddToCalendarButton } from '@/components/invitacion/AddToCalendarButton';
import { Sparkles, MapPin, Calendar, Clock, Gift, UserCheck } from 'lucide-react';
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

export const XvModernaTemplate: React.FC<TemplateProps> = ({
  fiesta,
  invitacionData,
  onRsvpSubmit,
}) => {
  const { toast } = useToast();
  const paleta = invitacionData.cabecera?.paletaColores;
  const primaryColor = paleta?.primary || '#ec4899';
  const secondaryColor = paleta?.secondary || '#8b5cf6';

  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpCount, setRsvpCount] = useState(1);
  const [rsvpDiet, setRsvpDiet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const protagonista = invitacionData.cabecera?.protagonista1 || fiesta.configuracion?.nombreAgasajado || 'Mis 15 Años';
  const fechaEvento = fiesta.configuracion?.fechaEvento || '';
  const lugar = invitacionData.detallesEvento?.celebracion?.nombreLugar || fiesta.configuracion?.nombreLugar || 'Salón de Eventos';
  const direccion = invitacionData.detallesEvento?.celebracion?.direccionLugar || fiesta.configuracion?.direccionLugar || '';
  const itinerarioItems = (fiesta.programa || []).map((c) => ({
    hora: c.hora || '',
    titulo: c.titulo || '',
    descripcion: c.descripcion || '',
  }));
  const dressCodeTexto = invitacionData.dressCode?.texto?.text || invitacionData.dressCode?.tipo || 'Elegante / Fiesta';
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
      toast({ title: '¡Confirmación enviada!', description: 'Gracias por confirmar tu asistencia.' });
      setIsRsvpOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar la confirmación.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-pink-500 selection:text-black overflow-x-hidden">
      {/* ── HERO / PORTADA MODERNA ── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-40 blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${primaryColor} 0%, ${secondaryColor} 40%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-300 text-xs font-black uppercase tracking-widest backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> Mis Quince Años
            </span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl sm:text-8xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300"
          >
            {protagonista}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl text-zinc-300 font-medium max-w-md mx-auto"
          >
            ¡Te espero para festejar una noche inolvidable llena de música y fiesta!
          </motion.p>

          {fechaEvento && (
            <div className="pt-4">
              <div className="inline-block p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-2xl">
                <CountdownTimer targetDate={fechaEvento} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <Button
              onClick={() => setIsRsvpOpen(true)}
              className="h-14 px-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-pink-500/25 transition-transform hover:scale-105"
            >
              <UserCheck className="w-4 h-4 mr-2" /> Confirmar Asistencia
            </Button>
            <AddToCalendarButton
              eventName={protagonista}
              startDate={fechaEvento || new Date().toISOString()}
              location={lugar}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      </section>

      {/* ── DETALLES DEL EVENTO & MAPA ── */}
      <section className="py-16 px-4 max-w-3xl mx-auto space-y-10">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase">¿Cuándo?</h3>
            <p className="text-sm text-zinc-300 font-semibold">{fechaEvento || 'Fecha a confirmar'}</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase">¿Dónde?</h3>
            <p className="text-sm text-zinc-300 font-semibold">{lugar}</p>
            {direccion && <p className="text-xs text-zinc-400">{direccion}</p>}
          </div>
        </div>

        {/* Mapa del Salón */}
        <div className="rounded-2xl overflow-hidden border border-zinc-800">
          <EventLocationMap venueName={lugar} address={direccion} primaryColor={primaryColor} />
        </div>
      </section>

      {/* ── CRONOGRAMA DE LA FIESTA ── */}
      {itinerarioItems.length > 0 && (
        <section className="py-16 px-4 max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-pink-400">El Itinerario</span>
            <h2 className="text-3xl font-black uppercase">Cronograma de la Noche</h2>
          </div>

          <div className="space-y-3">
            {itinerarioItems.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-500/10 text-pink-400 text-xs font-black">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.hora || `${21 + idx}:00`}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white">{item.titulo || item.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── DRESS CODE & REGALOS ── */}
      <section className="py-16 px-4 max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3 text-center">
          <Sparkles className="w-6 h-6 text-pink-400 mx-auto" />
          <h3 className="text-base font-black uppercase">Código de Vestimenta</h3>
          <p className="text-sm text-zinc-300 font-bold">{dressCodeTexto}</p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3 text-center">
          <Gift className="w-6 h-6 text-purple-400 mx-auto" />
          <h3 className="text-base font-black uppercase">Mesa de Regalos</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Tu presencia es mi mejor regalo. Si deseás hacerme un presente, podés ver los datos aquí.
          </p>
          {datosBancarios && (
            <Button variant="outline" size="sm" onClick={() => setIsGiftOpen(true)} className="rounded-full border-zinc-700 text-xs font-bold">
              Ver datos bancarios
            </Button>
          )}
        </div>
      </section>

      {/* ── MODAL RSVP ── */}
      <Dialog open={isRsvpOpen} onOpenChange={setIsRsvpOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Confirmar Asistencia</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Completá tus datos para que podamos recibirte de la mejor manera.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRsvpSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Nombre completo</Label>
              <Input
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                placeholder="Tu nombre y apellido"
                required
                className="bg-zinc-950 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Cantidad de personas</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={rsvpCount}
                onChange={(e) => setRsvpCount(Number(e.target.value) || 1)}
                className="bg-zinc-950 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Restricciones alimentarias (opcional)</Label>
              <Input
                value={rsvpDiet}
                onChange={(e) => setRsvpDiet(e.target.value)}
                placeholder="Celíaco, vegetariano, alergias..."
                className="bg-zinc-950 border-zinc-700 text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !rsvpName.trim()}
              className="w-full h-12 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-black uppercase"
            >
              {isSubmitting ? 'Enviando...' : 'Confirmar ahora'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL REGALOS ── */}
      <Dialog open={isGiftOpen} onOpenChange={setIsGiftOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Datos de Regalo</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Datos para transferencias o cuenta bancaria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs text-zinc-300 whitespace-pre-wrap">
            {datosBancarios}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
