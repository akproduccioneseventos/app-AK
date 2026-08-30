'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * El botón para sacar el aparato de la estación.
 *
 * **Ya no pide clave**, y lo pidió el dueño: *"o mejor sacale el PIN y ta. Así no
 * complica."* El PIN no cuidaba plata ni datos —lo único que hacía era evitar que
 * el empleado se saliera sin querer—, y una clave más para acordarse el día de la
 * fiesta es justamente lo que hace que nadie use la pantalla.
 *
 * Queda una confirmación, que alcanza para lo que hay que evitar: un toque de
 * más, sin querer, delante de los invitados.
 */
export function KioskUnlockButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const salirDeLaEstacion = () => {
    localStorage.removeItem('kiosk_locked_fiesta_id');
    localStorage.removeItem('kiosk_role');
    localStorage.removeItem('kiosk_pin');
    localStorage.removeItem('kiosk_totem_id');
    setIsOpen(false);
    router.push('/evento/inicio');
  };

  return (
    <>
      {/* Botón discreto arriba a la derecha: el invitado no tiene por qué verlo. */}
      <div className="fixed top-3 right-3 z-[9999] print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="p-3 rounded-full bg-black/20 text-white/40 hover:text-white hover:bg-black/60 backdrop-blur-md transition-all duration-300 shadow-md border border-white/5"
          title="Cambiar de estación"
          aria-label="Cambiar de estación"
        >
          <Settings className="w-4 h-4" />
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
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors"
                aria-label="Seguir en esta estación"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-4 mb-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">¿Salir de esta estación?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    El aparato deja de estar en esta estación y vuelve a la pantalla donde se
                    eligen los entretenimientos. Los recuerdos ya guardados no se tocan.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={salirDeLaEstacion}
                  className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold"
                >
                  Sí, salir
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-12 rounded-xl text-slate-300 hover:text-white"
                >
                  No, seguir acá
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
