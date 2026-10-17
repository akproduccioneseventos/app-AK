'use client';

import React, { useState } from 'react';
import { GlassWater, Sparkles, Send, X, CheckCircle2, Wine } from 'lucide-react';
import { enviarBrindisCruzadoAction } from '@/app/actions/brindis-cruzado';

interface BrindisCruzadoModalProps {
  fiestaId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultMesa?: string;
  defaultRemitente?: string;
}

const TRAGOS_BRINDIS_RAPIDOS = [
  'Champagne / Sidra',
  'Fernet con Coca',
  'Gin Tonic con Frutos Rojos',
  'Mojito Clásico',
  'Daiquiri Frutilla',
  'Limonada con Menta (Sin alcohol)',
];

const MENSAJES_RAPIDOS = [
  '¡Salud por los novios y que la noche no termine nunca!',
  '¡Por la quinceañera más hermosa, a romper la pista!',
  '¡Los de la mesa de al lado desafían a un fondo blanco!',
  '¡Hermosa fiesta, qué viva la familia y los amigos!',
];

export function BrindisCruzadoModal({
  fiestaId,
  isOpen,
  onClose,
  defaultMesa,
  defaultRemitente,
}: BrindisCruzadoModalProps) {
  const [mesaOrigen, setMesaOrigen] = useState(defaultMesa || '');
  const [mesaDestino, setMesaDestino] = useState('');
  const [remitente, setRemitente] = useState(defaultRemitente || '');
  const [tragoOBrindis, setTragoOBrindis] = useState(TRAGOS_BRINDIS_RAPIDOS[0]);
  const [dedicatoria, setDedicatoria] = useState(MENSAJES_RAPIDOS[0]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleEnviar = async () => {
    if (!mesaOrigen.trim() || !mesaDestino.trim() || !dedicatoria.trim()) {
      alert('Por favor indicá tu mesa, la mesa de destino y la dedicatoria.');
      return;
    }
    setSending(true);
    try {
      const res = await enviarBrindisCruzadoAction({
        fiestaId,
        mesaOrigen,
        mesaDestino,
        remitente: remitente || 'Mesa amiga',
        tragoOBrindis,
        dedicatoria,
      });
      if (res.success) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          onClose();
        }, 2000);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {sent ? (
          <div className="py-8 space-y-3">
            <CheckCircle2 className="w-14 h-14 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-black text-white">¡Brindis enviado a Pantalla!</h3>
            <p className="text-xs text-slate-300">
              Va a salir en vivo en el muro LED y pantallas gigantes del salón con animación de copas.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="w-14 h-14 bg-amber-500/20 text-amber-300 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                <Wine className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-white flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Brindis Cruzado entre Mesas
              </h3>
              <p className="text-xs text-slate-400">
                Mandale un brindis a otra mesa o a toda la fiesta para que aparezca en las pantallas LED.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tu Mesa:</label>
                <input
                  type="text"
                  value={mesaOrigen}
                  onChange={(e) => setMesaOrigen(e.target.value)}
                  placeholder="Mesa 4"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-400 uppercase">Mesa Destino:</label>
                <input
                  type="text"
                  value={mesaDestino}
                  onChange={(e) => setMesaDestino(e.target.value)}
                  placeholder="Mesa 9 / Novios"
                  className="w-full px-3 py-2 bg-slate-900 border border-amber-500/30 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="text-left space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Trago / Copa:</label>
              <select
                value={tragoOBrindis}
                onChange={(e) => setTragoOBrindis(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              >
                {TRAGOS_BRINDIS_RAPIDOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-left space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Mensaje de Brindis:</label>
              <textarea
                rows={2}
                value={dedicatoria}
                onChange={(e) => setDedicatoria(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <button
              onClick={handleEnviar}
              disabled={sending}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Mandando...' : 'Lanzar Brindis a la Pantalla Gigante'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
