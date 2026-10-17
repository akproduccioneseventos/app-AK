'use client';

import React, { useState, useRef } from 'react';
import { Camera, Film, Clock, Sparkles, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { guardarFotoDescartableAction, getFotosDescartablesAction, type FotoDescartable } from '@/app/actions/camara-descartable';

interface CamaraDescartableModalProps {
  fiestaId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultMesa?: string;
  defaultAutor?: string;
}

export function CamaraDescartableModal({
  fiestaId,
  isOpen,
  onClose,
  defaultMesa,
  defaultAutor,
}: CamaraDescartableModalProps) {
  const [autor, setAutor] = useState(defaultAutor || '');
  const [mesa, setMesa] = useState(defaultMesa || '');
  const [caption, setCaption] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FotoDescartable['filtroVintage']>('kodak_gold');
  const [saving, setSaving] = useState(false);
  const [captured, setCaptured] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGuardar = async () => {
    if (!fotoPreview) return;
    setSaving(true);
    try {
      const res = await guardarFotoDescartableAction({
        fiestaId,
        autor: autor || 'Invitado',
        mesa,
        fotoUrlOrBase64: fotoPreview,
        filtroVintage: filtro,
        caption,
      });
      if (res.success) {
        setCaptured(true);
        setTimeout(() => {
          setCaptured(false);
          setFotoPreview(null);
          onClose();
        }, 2200);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {captured ? (
          <div className="py-8 space-y-3">
            <Film className="w-14 h-14 text-amber-400 mx-auto animate-pulse" />
            <h3 className="text-xl font-black text-white">¡Foto guardada en el rollo!</h3>
            <p className="text-xs text-slate-300">
              Se revelará automáticamente junto con todas las fotos de la fiesta el <strong>Domingo a las 12:00 hs</strong>.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="w-14 h-14 bg-amber-500/20 text-amber-300 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                <Camera className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-white flex items-center justify-center gap-1.5">
                <Film className="w-4 h-4 text-amber-400" />
                Cámara Descartable Retro
              </h3>
              <p className="text-xs text-slate-400">
                Sacá tu foto espontánea con rollo de los 90. Todas las fotos se revelan el domingo al mediodía.
              </p>
            </div>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {fotoPreview ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-amber-500/40 aspect-square max-h-56 mx-auto bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fotoPreview}
                    alt="Preview retro"
                    className={`w-full h-full object-cover ${
                      filtro === 'black_and_white'
                        ? 'grayscale contrast-125'
                        : 'sepia-[0.35] contrast-110 saturate-125'
                    }`}
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg p-1.5 text-[10px] text-amber-300 font-mono flex items-center justify-between">
                    <span>AK DISPOSABLE • 35MM</span>
                    <span>ROLL #01</span>
                  </div>
                </div>

                <div className="flex justify-center gap-1.5">
                  <button
                    onClick={() => setFiltro('kodak_gold')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                      filtro === 'kodak_gold'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Kodak Gold
                  </button>
                  <button
                    onClick={() => setFiltro('fuji_90s')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                      filtro === 'fuji_90s'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Fuji 90s
                  </button>
                  <button
                    onClick={() => setFiltro('black_and_white')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                      filtro === 'black_and_white'
                        ? 'bg-white text-slate-950 border-white'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    B & N
                  </button>
                </div>

                <input
                  type="text"
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                  placeholder="Tu nombre (ej: Tía Laura, Primos)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 bg-slate-900 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                  >
                    Sacar otra
                  </button>
                  <button
                    onClick={handleGuardar}
                    disabled={saving}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
                  >
                    {saving ? 'Guardando...' : 'Meter al Rollo'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5 text-slate-950" />
                  Abrir Cámara Retro
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Revelado oficial: Domingo 12:00 hs
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
