'use client';

import React, { useState } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { CountdownTimer } from '@/components/countdown-timer';
import { EventLocationMap } from '@/components/invitacion/EventLocationMap';
import { AddToCalendarButton } from '@/components/invitacion/AddToCalendarButton';
import { UserCheck } from 'lucide-react';
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

export const BodaMinimalistaTemplate: React.FC<TemplateProps> = ({
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
  const lugar = invitacionData.detallesEvento?.celebracion?.nombreLugar || fiesta.configuracion?.nombreLugar || 'Salón Principal';
  const direccion = invitacionData.detallesEvento?.celebracion?.direccionLugar || fiesta.configuracion?.direccionLugar || '';
  const itinerarioItems = (fiesta.programa || []).map((c) => ({
    hora: c.hora || '',
    titulo: c.titulo || '',
    descripcion: c.descripcion || '',
  }));
  const dressCodeTexto = invitacionData.dressCode?.texto?.text || invitacionData.dressCode?.tipo || 'Elegante';
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
      toast({ title: '¡Confirmación recibida!', description: 'Nos alegra mucho que nos acompañes.' });
      setIsRsvpOpen(false);
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar la confirmación.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white overflow-x-hidden">
      {/* ── HERO MINIMALISTA ── */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center p-8 text-center border-b border-zinc-100">
        <div className="max-w-xl mx-auto space-y-10">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs uppercase tracking-[0.4em] text-zinc-400 font-bold">
            Nos Casamos
          </motion.p>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-6xl font-light tracking-tight text-zinc-950 font-serif"
          >
            {novios}
          </motion.h1>

          <p className="text-sm text-zinc-500 font-light max-w-sm mx-auto leading-relaxed">
            Queremos celebrar este día único rodeados de las personas que hacen especial nuestra historia.
          </p>

          {fechaEvento && (
            <div className="pt-2">
              <div className="inline-block p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <CountdownTimer targetDate={fechaEvento} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              onClick={() => setIsRsvpOpen(true)}
              className="h-12 px-8 rounded-none bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest"
            >
              <UserCheck className="w-4 h-4 mr-2" /> Confirmar Asistencia
            </Button>
            <AddToCalendarButton
              eventName={novios}
              startDate={fechaEvento || new Date().toISOString()}
              location={lugar}
              primaryColor="#18181b"
            />
          </div>
        </div>
      </section>

      {/* ── DETALLES ── */}
      <section className="py-20 px-6 max-w-3xl mx-auto space-y-16">
        <div className="grid sm:grid-cols-2 gap-8 text-center sm:text-left border-y border-zinc-100 py-12">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Fecha</span>
            <p className="text-xl font-serif text-zinc-950">{fechaEvento || 'Fecha a confirmar'}</p>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Lugar</span>
            <p className="text-xl font-serif text-zinc-950">{lugar}</p>
            {direccion && <p className="text-xs text-zinc-500">{direccion}</p>}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-zinc-200">
          <EventLocationMap venueName={lugar} address={direccion} primaryColor="#18181b" />
        </div>

        {itinerarioItems.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-serif text-center">Itinerario</h2>
            <div className="max-w-md mx-auto space-y-4">
              {itinerarioItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-100 text-sm">
                  <span className="font-mono text-xs text-zinc-500">{item.hora || `${20 + idx}:00`}</span>
                  <span className="font-medium text-zinc-900">{item.titulo || item.descripcion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-8 pt-8 text-center border-t border-zinc-100">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Dress Code</span>
            <p className="text-sm font-medium text-zinc-900">{dressCodeTexto}</p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Regalos</span>
            <p className="text-xs text-zinc-500 leading-relaxed">Agradecemos tu cariño y presencia.</p>
            {datosBancarios && (
              <Button variant="outline" size="sm" onClick={() => setIsGiftOpen(true)} className="rounded-none text-xs font-bold mt-2">
                Datos de cuenta
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── MODALES ── */}
      <Dialog open={isRsvpOpen} onOpenChange={setIsRsvpOpen}>
        <DialogContent className="max-w-md bg-white text-zinc-900 border border-zinc-200 rounded-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Confirmación</DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">Por favor confirmanos tu asistencia.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRsvpSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Nombre completo</Label>
              <Input value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} required className="rounded-none border-zinc-300" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Lugares</Label>
              <Input type="number" min={1} max={10} value={rsvpCount} onChange={(e) => setRsvpCount(Number(e.target.value) || 1)} className="rounded-none border-zinc-300" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Menú especial (opcional)</Label>
              <Input value={rsvpDiet} onChange={(e) => setRsvpDiet(e.target.value)} placeholder="Celíaco, vegetariano..." className="rounded-none border-zinc-300" />
            </div>
            <Button type="submit" disabled={isSubmitting || !rsvpName.trim()} className="w-full h-11 rounded-none bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest">
              {isSubmitting ? 'Enviando...' : 'Confirmar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGiftOpen} onOpenChange={setIsGiftOpen}>
        <DialogContent className="max-w-md bg-white text-zinc-900 border border-zinc-200 rounded-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">Datos Bancarios</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2 text-xs text-zinc-700 font-mono whitespace-pre-wrap">
            {datosBancarios}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
