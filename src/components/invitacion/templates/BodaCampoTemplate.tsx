'use client';

import React, { useState } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { CountdownTimer } from '@/components/countdown-timer';
import { EventLocationMap } from '@/components/invitacion/EventLocationMap';
import { AddToCalendarButton } from '@/components/invitacion/AddToCalendarButton';
import { Leaf, MapPin, Calendar, UserCheck } from 'lucide-react';
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

export const BodaCampoTemplate: React.FC<TemplateProps> = ({
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

  const novios = [
    invitacionData.cabecera?.protagonista1 || fiesta.configuracion?.nombreAgasajado || 'Novia',
    invitacionData.cabecera?.protagonista2 || 'Novio',
  ].filter(Boolean).join(' & ');

  const fechaEvento = fiesta.configuracion?.fechaEvento || '';
  const lugar = invitacionData.detallesEvento?.celebracion?.nombreLugar || fiesta.configuracion?.nombreLugar || 'Chacra / Campo';
  const direccion = invitacionData.detallesEvento?.celebracion?.direccionLugar || fiesta.configuracion?.direccionLugar || '';
  const itinerarioItems = (fiesta.programa || []).map((c) => ({
    hora: c.hora || '',
    titulo: c.titulo || '',
    descripcion: c.descripcion || '',
  }));
  const dressCodeTexto = invitacionData.dressCode?.texto?.text || invitacionData.dressCode?.tipo || 'Elegante Campo / Boho';
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
      toast({ title: '¡Confirmación enviada!', description: 'Gracias por ser parte de este día.' });
      setIsRsvpOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar la confirmación.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#2d372e] font-serif selection:bg-emerald-200 overflow-x-hidden">
      {/* ── PORTADA CAMPO / BOHO ── */}
      <section className="min-h-[88vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-[#e5ebd9] text-[#4a6b4c] flex items-center justify-center">
              <Leaf className="w-7 h-7" />
            </div>
          </motion.div>

          <p className="text-xs uppercase tracking-[0.3em] text-[#5c7a5e] font-sans font-bold">
            Nuestra Boda en el Campo
          </p>

          <h1 className="text-5xl sm:text-7xl font-normal italic tracking-wide text-[#203322]">
            {novios}
          </h1>

          <p className="text-sm text-[#4d5e4f] max-w-sm mx-auto font-sans leading-relaxed">
            Bajo el cielo abierto y rodeados de naturaleza, queremos dar el sí junto a vos.
          </p>

          {fechaEvento && (
            <div className="pt-2 font-sans">
              <div className="inline-block p-4 rounded-2xl bg-white/80 border border-[#d6dec9] shadow-sm">
                <CountdownTimer targetDate={fechaEvento} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-sans">
            <Button
              onClick={() => setIsRsvpOpen(true)}
              className="h-12 px-8 rounded-full bg-[#4a6b4c] hover:bg-[#3d593f] text-white font-bold text-xs uppercase tracking-widest shadow-md"
            >
              <UserCheck className="w-4 h-4 mr-2" /> Confirmar Asistencia
            </Button>
            <AddToCalendarButton
              eventName={novios}
              startDate={fechaEvento || new Date().toISOString()}
              location={lugar}
              primaryColor="#4a6b4c"
            />
          </div>
        </div>
      </section>

      {/* ── DETALLES & MAPA ── */}
      <section className="py-16 px-4 max-w-3xl mx-auto space-y-12 font-sans">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white border border-[#d6dec9] space-y-2 text-center">
            <Calendar className="w-6 h-6 text-[#4a6b4c] mx-auto" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a6b4c]">Fecha</h3>
            <p className="text-base text-zinc-900 font-semibold">{fechaEvento || 'Fecha a confirmar'}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#d6dec9] space-y-2 text-center">
            <MapPin className="w-6 h-6 text-[#4a6b4c] mx-auto" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a6b4c]">Ubicación</h3>
            <p className="text-base text-zinc-900 font-semibold">{lugar}</p>
            {direccion && <p className="text-xs text-zinc-600">{direccion}</p>}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-[#d6dec9]">
          <EventLocationMap venueName={lugar} address={direccion} primaryColor="#4a6b4c" />
        </div>

        {itinerarioItems.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-center italic text-[#203322]">Itinerario del Día</h2>
            <div className="max-w-md mx-auto space-y-3">
              {itinerarioItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-3.5 rounded-xl bg-white border border-[#d6dec9]">
                  <span className="text-xs font-bold text-[#4a6b4c] px-2 py-1 rounded bg-[#eef2e6]">{item.hora || `${17 + idx}:00`}</span>
                  <span className="text-sm font-medium text-zinc-800">{item.titulo || item.descripcion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6 pt-6 text-center border-t border-[#d6dec9]">
          <div className="p-6 rounded-2xl bg-white border border-[#d6dec9] space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a6b4c]">Código de Vestimenta</h3>
            <p className="text-sm font-bold text-zinc-900">{dressCodeTexto}</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#d6dec9] space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a6b4c]">Regalos</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">Tu presencia es nuestro mayor regalo.</p>
            {datosBancarios && (
              <Button variant="outline" size="sm" onClick={() => setIsGiftOpen(true)} className="rounded-full border-[#4a6b4c] text-[#4a6b4c] text-xs font-bold">
                Ver datos de cuenta
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── MODALES ── */}
      <Dialog open={isRsvpOpen} onOpenChange={setIsRsvpOpen}>
        <DialogContent className="max-w-md bg-[#f7f5f0] text-zinc-900 border border-[#d6dec9] rounded-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif italic text-[#203322]">Confirmar Asistencia</DialogTitle>
            <DialogDescription className="text-xs text-zinc-600">Completá tus datos para organizar los lugares.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRsvpSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Nombre completo</Label>
              <Input value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} required className="bg-white border-[#d6dec9]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Lugares</Label>
              <Input type="number" min={1} max={10} value={rsvpCount} onChange={(e) => setRsvpCount(Number(e.target.value) || 1)} className="bg-white border-[#d6dec9]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Menú especial (opcional)</Label>
              <Input value={rsvpDiet} onChange={(e) => setRsvpDiet(e.target.value)} placeholder="Vegetariano, celíaco..." className="bg-white border-[#d6dec9]" />
            </div>
            <Button type="submit" disabled={isSubmitting || !rsvpName.trim()} className="w-full h-11 rounded-full bg-[#4a6b4c] text-white font-bold text-xs uppercase tracking-widest">
              {isSubmitting ? 'Enviando...' : 'Confirmar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGiftOpen} onOpenChange={setIsGiftOpen}>
        <DialogContent className="max-w-md bg-[#f7f5f0] text-zinc-900 border border-[#d6dec9] rounded-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif italic text-[#203322]">Datos Bancarios</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2 text-xs text-zinc-700 font-mono whitespace-pre-wrap">
            {datosBancarios}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
