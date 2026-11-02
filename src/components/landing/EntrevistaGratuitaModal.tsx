'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, CalendarCheck, ArrowRight, User, Phone } from 'lucide-react';
import { SimulatorMeetingScheduler } from '@/components/simulator/SimulatorMeetingScheduler';
import { buildAkWhatsAppUrl } from '@/lib/public-contact';

interface EntrevistaGratuitaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EntrevistaGratuitaModal({ isOpen, onClose }: EntrevistaGratuitaModalProps) {
  const [paso, setPaso] = useState<'datos' | 'agenda'>('datos');
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');

  // Reiniciar estado al abrir
  useEffect(() => {
    if (isOpen) {
      setPaso('datos');
      setErrorValidacion('');
    }
  }, [isOpen]);

  // Cerrar con Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleAvanzarAAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim();
    const contactoLimpio = contacto.trim();

    if (nombreLimpio.length < 3) {
      setErrorValidacion('Por favor ingresá tu nombre completo (mínimo 3 letras).');
      return;
    }
    if (contactoLimpio.length < 6) {
      setErrorValidacion('Por favor ingresá un teléfono o WhatsApp de contacto válido.');
      return;
    }

    setErrorValidacion('');
    setPaso('agenda');
  };

  const handleWhatsAppFallback = () => {
    const texto = `Hola AK Producciones, me gustaría coordinar una entrevista gratuita para mi fiesta. Mi nombre es ${nombre || 'un cliente'}.`;
    window.open(buildAkWhatsAppUrl(texto), '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Coordinar una entrevista gratuita"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl sm:p-8">
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabecera */}
        <div className="mb-6 pr-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
            <CalendarCheck className="h-3.5 w-3.5" />
            Entrevista sin costo
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Coordinar una entrevista gratuita
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Conversamos sobre tu fiesta en Salto, resolvemos dudas y planificamos cada detalle con tranquilidad.
          </p>
        </div>

        {/* Contenido según paso */}
        {paso === 'datos' ? (
          <form onSubmit={handleAvanzarAAgenda} className="space-y-4">
            <div>
              <label htmlFor="entrevista-nombre" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Tu nombre y apellido
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="entrevista-nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Sofía Rodríguez"
                  className="w-full min-h-[44px] rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="entrevista-contacto" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Teléfono o WhatsApp
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="entrevista-contacto"
                  type="tel"
                  required
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Ej: 099 123 456"
                  className="w-full min-h-[44px] rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {errorValidacion && (
              <p className="text-xs font-semibold text-red-400 bg-red-950/40 border border-red-500/20 rounded-lg p-2.5">
                {errorValidacion}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 hover:bg-red-500 transition active:scale-98"
            >
              Elegir fecha y horario
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-xs text-zinc-500 pt-2">
              Sin compromiso ni costos ocultos. Te esperamos en nuestra oficina en Salto.
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 border border-white/10 text-xs text-zinc-300">
              <span>
                Entrevista para: <strong className="text-white">{nombre}</strong> ({contacto})
              </span>
              <button
                type="button"
                onClick={() => setPaso('datos')}
                className="text-red-400 hover:text-red-300 font-bold underline ml-2"
              >
                Modificar
              </button>
            </div>

            <SimulatorMeetingScheduler
              clienteNombre={nombre}
              clienteContacto={contacto}
              onWhatsAppFallback={handleWhatsAppFallback}
            />
          </div>
        )}
      </div>
    </div>
  );
}
