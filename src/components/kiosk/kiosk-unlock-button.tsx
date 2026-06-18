'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Lock, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function KioskUnlockButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [savedPin, setSavedPin] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSavedPin(localStorage.getItem('kiosk_pin'));
    }
  }, [isOpen]);

  const handleUnlock = () => {
    const requiredPin = savedPin || '1234'; // Default fallback
    if (pin === requiredPin) {
      // Clear lock storage
      localStorage.removeItem('kiosk_locked_fiesta_id');
      localStorage.removeItem('kiosk_role');
      localStorage.removeItem('kiosk_pin');
      localStorage.removeItem('kiosk_totem_id');
      
      setIsOpen(false);
      
      // Redirect back to main event hub setup page
      router.push('/evento');
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 800);
    }
  };

  const handleResetApp = () => {
    // Completely clear all localstorage keys and refresh the page
    localStorage.clear();
    window.location.reload();
  };

  return (
    <>
      {/* Subtle trigger button in top right corner */}
      <div className="fixed top-3 right-3 z-[9999] print:hidden">
        <button
          onClick={() => {
            setIsOpen(true);
            setPin('');
            setError(false);
          }}
          className="p-3 rounded-full bg-black/20 text-white/40 hover:text-white hover:bg-black/60 backdrop-blur-md transition-all duration-300 shadow-md border border-white/5"
          title="Administrar Dispositivo"
        >
          <Settings className="w-4 h-4 animate-spin-slow" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-4 mb-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Desbloquear Dispositivo</h3>
                  <p className="text-xs text-slate-400">Ingresa el PIN de 4 dígitos para salir de esta pantalla.</p>
                </div>
              </div>

              <div className="space-y-4">
                <motion.div
                  animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPin(val);
                      setError(false);
                      // Auto trigger unlock when 4 digits are completed
                      if (val.length === 4) {
                        // Let state set, then run unlock
                        setTimeout(() => {
                          const correctPin = savedPin || '1234';
                          if (val === correctPin) {
                            localStorage.removeItem('kiosk_locked_fiesta_id');
                            localStorage.removeItem('kiosk_role');
                            localStorage.removeItem('kiosk_pin');
                            localStorage.removeItem('kiosk_totem_id');
                            setIsOpen(false);
                            router.push('/evento');
                          } else {
                            setError(true);
                            setPin('');
                            setTimeout(() => setError(false), 800);
                          }
                        }, 100);
                      }
                    }}
                    placeholder="••••"
                    className={`bg-slate-950 text-center text-3xl tracking-[0.4em] font-black h-16 rounded-xl focus:ring-purple-500 ${
                      error ? 'border-rose-500 ring-rose-500 text-rose-500' : 'border-slate-800 text-white'
                    }`}
                    autoFocus
                  />
                </motion.div>

                {error && (
                  <p className="text-xs font-bold text-rose-400 text-center uppercase tracking-wider animate-pulse">
                    PIN Incorrecto
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    className="flex-1 h-11 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold"
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleUnlock}
                    className="flex-1 h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    Desbloquear
                  </Button>
                </div>
                
                <div className="border-t border-slate-800/60 pt-4 flex justify-center">
                  <button
                    onClick={handleResetApp}
                    className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1.5 uppercase font-semibold tracking-wider transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reiniciar Caché Completa
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
