'use client';

import { useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaparazziOverlayProps {
  fiestaId: string;
  isOpen: boolean;
  onUpload?: () => void;
  onClose?: () => void;
}

export function PaparazziOverlay({ fiestaId, isOpen, onUpload, onClose }: PaparazziOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(120);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/40 to-yellow-600/20 mix-blend-overlay" />
      
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
          aria-label="Cerrar"
        >
          <X className="h-6 w-6" />
        </button>
      )}

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center space-y-8 rounded-2xl bg-gradient-to-b from-red-950/80 to-black/80 p-8 shadow-2xl backdrop-blur-md border border-red-500/30">
        <div className="space-y-2 animate-pulse">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 uppercase tracking-widest text-center" style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}>
            ¡Momento<br/>Paparazzi!
          </h1>
          <p className="text-sm font-medium text-red-200">¡Todos a sacar fotos!</p>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-6xl font-black tabular-nums text-white" style={{ textShadow: '0 0 30px rgba(255, 255, 255, 0.3)' }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>

        <Button 
          onClick={onUpload} 
          size="lg"
          className="h-16 w-full animate-bounce rounded-full bg-gradient-to-r from-red-600 to-yellow-600 text-lg font-bold text-white shadow-lg shadow-red-600/30 transition hover:from-red-500 hover:to-yellow-500"
        >
          <Camera className="mr-3 h-7 w-7" />
          Abrir Cámara
        </Button>
      </div>
    </div>
  );
}
