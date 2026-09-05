'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Check, X, ArrowRight, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registerQuinceaneraPartyLead } from '@/app/actions/commercial-intelligence';

interface QuinceaneraLeadPromptProps {
  fiestaId: string;
  nombreFiesta?: string;
  guestCategory?: string; // 'Adulto' | 'Niño' | 'Adolescente'
  invitadoId?: string;
  invitadoNombre?: string;
  invitadoContacto?: string;
  origen: 'fotocabina' | 'galeria' | 'muro_social' | 'mi_mesa' | 'invitacion';
  className?: string;
}

type RespuestaQuince = 'Ya los festejé' | 'Este año' | 'El año que viene' | 'No es lo mío';

export function QuinceaneraLeadPrompt({
  fiestaId,
  nombreFiesta,
  guestCategory,
  invitadoId,
  invitadoNombre = '',
  invitadoContacto = '',
  origen,
  className = '',
}: QuinceaneraLeadPromptProps) {
  const storageKey = `ak_quince_prompt_${fiestaId}`;
  const [dismissed, setDismissed] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<RespuestaQuince | null>(null);
  const [nombre, setNombre] = useState(invitadoNombre);
  const [telefono, setTelefono] = useState(invitadoContacto);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Si la categoría del invitado es explícitamente Adulto o Niño (no adolescente ni indefinida), no mostramos el prompt
    if (guestCategory === 'Adulto' || guestCategory === 'Niño') {
      setDismissed(true);
      return;
    }
    // Verificar si ya fue respondido en este navegador
    const isAnswered = localStorage.getItem(storageKey);
    if (!isAnswered) {
      setDismissed(false);
    }
  }, [guestCategory, storageKey]);

  if (dismissed) return null;

  const handleSelectOption = async (option: RespuestaQuince) => {
    setSelectedResponse(option);

    if (option === 'Ya los festejé' || option === 'No es lo mío') {
      localStorage.setItem(storageKey, option);
      // Ocultar suavemente después de 2 segundos
      setTimeout(() => setDismissed(true), 2000);
      return;
    }

    // Si ya tenemos el nombre y contacto del invitado, registrar directamente
    if (invitadoNombre && invitadoContacto) {
      setSubmitting(true);
      try {
        await registerQuinceaneraPartyLead({
          fiestaId,
          nombreFiesta,
          nombre: invitadoNombre,
          contacto: invitadoContacto,
          respuestaQuince: option,
          origen,
          invitadoId,
        });
        localStorage.setItem(storageKey, option);
        setSubmitted(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleConfirmLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResponse || !nombre.trim()) return;

    setSubmitting(true);
    try {
      await registerQuinceaneraPartyLead({
        fiestaId,
        nombreFiesta,
        nombre: nombre.trim(),
        contacto: telefono.trim(),
        respuestaQuince: selectedResponse,
        origen,
        invitadoId,
      });
      localStorage.setItem(storageKey, selectedResponse);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 p-4 text-center text-slate-800 shadow-sm ${className}`}>
        <div className="flex items-center justify-center gap-2 font-headline text-sm font-bold text-pink-900">
          <PartyPopper className="h-4 w-4 text-pink-600" />
          <span>¡Qué emoción! Te guardamos una sorpresa para tus 15</span>
        </div>
        <p className="mt-1 text-xs text-slate-600">
          Cuando llegue el momento vas a poder cotizar tu fiesta con beneficios exclusivos de AK Producciones.
        </p>
      </div>
    );
  }

  if (selectedResponse === 'Ya los festejé' || selectedResponse === 'No es lo mío') {
    return (
      <div className={`rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-600 ${className}`}>
        <span>¡Gracias por contarnos! ¡Que disfrutes la fiesta a pleno! ✨</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-pink-300/70 bg-gradient-to-br from-pink-50/90 via-white to-rose-50/80 p-4 text-slate-900 shadow-md ${className}`}>
      {!selectedResponse ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-pink-700">
              <Sparkles className="h-3.5 w-3.5 text-pink-600" />
              <span>¿Cuándo cumplís tus quince?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(storageKey, 'dismissed');
                setDismissed(true);
              }}
              className="text-slate-400 hover:text-slate-600"
              title="Cerrar"
              aria-label="Cerrar pregunta de 15"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['Ya los festejé', 'Este año', 'El año que viene', 'No es lo mío'] as RespuestaQuince[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelectOption(option)}
                className="rounded-xl border border-pink-200 bg-white py-2 px-3 text-xs font-bold text-slate-800 shadow-xs hover:border-pink-500 hover:bg-pink-50 hover:text-pink-900 transition active:scale-95"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleConfirmLead} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-pink-900">
              ✨ ¡Genial! Dejanos tu nombre para guardarte promociones para tu fiesta:
            </div>
            <button
              type="button"
              onClick={() => setSelectedResponse(null)}
              className="text-xs text-slate-500 hover:underline"
            >
              Cambiar
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              type="text"
              placeholder="Tu nombre y apellido"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="h-9 text-base bg-white"
            />
            <Input
              type="tel"
              placeholder="WhatsApp (opcional)"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="h-9 text-base bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.setItem(storageKey, 'dismissed');
                setDismissed(true);
              }}
              className="text-xs text-slate-500 h-8"
            >
              Ahora no
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !nombre.trim()}
              className="h-8 bg-pink-700 hover:bg-pink-800 text-white text-xs font-bold gap-1 rounded-xl shadow-xs"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Guardar</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
