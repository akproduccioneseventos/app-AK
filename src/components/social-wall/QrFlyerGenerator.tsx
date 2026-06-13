'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Layout, Sparkles, PartyPopper, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QrFlyerGeneratorProps {
  qrUrl: string;
  eventName: string;
  onClose?: () => void;
}

type FlyerTheme = 'elegant' | 'party' | 'corporate';

export default function QrFlyerGenerator({ qrUrl, eventName, onClose }: QrFlyerGeneratorProps) {
  const [theme, setTheme] = useState<FlyerTheme>('elegant');
  const [headline, setHeadline] = useState('¡Sé parte del momento!');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Theme-specific styles
  const themeStyles = {
    elegant: {
      card: 'bg-[#faf8f5] text-[#2c2620] border-8 border-[#d4af37] font-serif',
      accentText: 'text-[#b8860b]',
      button: 'border-[#d4af37] text-[#8b6508] bg-[#fdfbf7] hover:bg-[#f5ebd6]',
      qrFg: '#2c2620',
      qrBg: '#faf8f5',
    },
    party: {
      card: 'bg-zinc-950 text-white border-8 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] font-sans',
      accentText: 'text-fuchsia-400 font-extrabold tracking-wide drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]',
      button: 'border-purple-500 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20',
      qrFg: '#18181b',
      qrBg: '#ffffff',
    },
    corporate: {
      card: 'bg-slate-50 text-slate-800 border-8 border-slate-700 font-sans',
      accentText: 'text-indigo-600 font-bold',
      button: 'border-slate-500 text-slate-700 bg-white hover:bg-slate-100',
      qrFg: '#1e293b',
      qrBg: '#f8fafc',
    },
  };

  const activeTheme = themeStyles[theme];

  return (
    <div className="flex flex-col gap-6 p-1 max-w-lg mx-auto">
      {/* Theme Selector */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        <button
          onClick={() => { setTheme('elegant'); setHeadline('¡Sé parte de nuestra historia!'); }}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all
            ${theme === 'elegant' ? 'border-[#d4af37] bg-[#faf8f5] text-[#8b6508] scale-[1.03]' : 'border-zinc-200 bg-white text-zinc-500'}`}
        >
          <Sparkles className="w-4 h-4 text-[#d4af37]" />
          Elegante / Boda
        </button>
        <button
          onClick={() => { setTheme('party'); setHeadline('¡Subí tu foto al muro!'); }}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all
            ${theme === 'party' ? 'border-purple-500 bg-purple-500/5 text-purple-400 scale-[1.03]' : 'border-zinc-200 bg-white text-zinc-500'}`}
        >
          <PartyPopper className="w-4 h-4 text-purple-500" />
          Fiesta / Neón
        </button>
        <button
          onClick={() => { setTheme('corporate'); setHeadline('¡Compartí tu experiencia!'); }}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all
            ${theme === 'corporate' ? 'border-slate-700 bg-slate-100 text-slate-700 scale-[1.03]' : 'border-zinc-200 bg-white text-zinc-500'}`}
        >
          <Briefcase className="w-4 h-4 text-slate-600" />
          Corporativo
        </button>
      </div>

      {/* Editable Headline */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título del Cartel</label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="w-full text-sm font-semibold border border-zinc-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-slate-400"
          placeholder="Escribe un título motivador..."
        />
      </div>

      {/* FLYER PREVIEW CARD (Target for window.print) */}
      <div className="relative border border-zinc-200 rounded-[2.5rem] overflow-hidden bg-zinc-100 p-6 flex justify-center shadow-inner">
        <div
          ref={printRef}
          id="printable-flyer"
          className={`w-[290px] h-[410px] rounded-[1.8rem] flex flex-col items-center justify-between p-6 shadow-xl text-center relative overflow-hidden transition-all duration-300 ${activeTheme.card}`}
        >
          {/* Subtle background graphics */}
          {theme === 'elegant' && (
            <div className="absolute inset-0 border border-[#d4af37]/20 m-2 rounded-[1.4rem] pointer-events-none" />
          )}

          {/* Heading */}
          <div className="space-y-2 mt-2">
            <h2 className="text-2xl font-black leading-tight tracking-wide px-2">
              {headline}
            </h2>
            <p className="text-xs font-medium opacity-80 max-w-[220px] mx-auto leading-relaxed">
              {eventName || 'Fiesta AK'}
            </p>
          </div>

          {/* QR Container */}
          <div className="my-4 p-4 bg-white rounded-3xl shadow-lg border border-black/5 flex items-center justify-center">
            <QRCodeSVG
              value={qrUrl}
              size={135}
              level="M"
              fgColor={theme === 'party' ? '#09090b' : activeTheme.qrFg}
              bgColor="#ffffff"
              includeMargin
            />
          </div>

          {/* Instructions */}
          <div className="space-y-3 mb-2 px-1">
            <p className={`text-xs font-black uppercase tracking-widest ${activeTheme.accentText}`}>
              ¿Cómo participar?
            </p>
            <div className="text-[11px] leading-relaxed font-semibold opacity-90 space-y-1.5 max-w-[230px] mx-auto">
              <p>1. Escaneá el QR con tu celular 📱</p>
              <p>2. Subí tus mejores fotos y videos 📸</p>
              <p>3. Mandá saludos y pedí música en vivo 🎵</p>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="text-[9px] font-bold tracking-widest opacity-40 uppercase">
            Experiencia Muro Social · AK Producciones
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-2">
        {onClose && (
          <Button variant="outline" className="flex-1 rounded-xl h-11 text-zinc-500" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button
          onClick={handlePrint}
          className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 gap-2 shadow-lg"
        >
          <Printer className="w-4 h-4" />
          Imprimir Flyer
        </Button>
      </div>

      {/* PRINT-ONLY CSS */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the target flyer card */
          body * {
            visibility: hidden !important;
          }
          #printable-flyer, #printable-flyer * {
            visibility: visible !important;
          }
          #printable-flyer {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) scale(1.6) !important;
            box-shadow: none !important;
            border-width: 6px !important;
            margin: 0 !important;
            z-index: 9999999 !important;
          }
          /* Prevent browsers from printing headers and footers (date, URL) */
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>
    </div>
  );
}
