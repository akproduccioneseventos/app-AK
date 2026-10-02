'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Martini, Sparkles, CheckCircle2, Clock, Volume2 } from 'lucide-react';
import { getBarPedidosListos } from '@/app/actions/fiesta/barra-tecnologica.actions';
import type { BarDrinkOrder } from '@/types/barra-tecnologica';
import { usePantallaPrendida } from '@/hooks/use-pantalla-prendida';

export default function PantallaTragoListoPage() {
  usePantallaPrendida();
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const [pedidosListos, setPedidosListos] = useState<BarDrinkOrder[]>([]);
  const [nombreEvento, setNombreEvento] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const cargarPedidos = useCallback(async () => {
    try {
      const res = await getBarPedidosListos(fiestaId);
      if (res.success && res.orders) {
        setNombreEvento(res.eventName || '');
        setPedidosListos(res.orders);
      }
    } catch (e) {
      // Ignorar errores de sondeo
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    cargarPedidos();
    const interval = setInterval(cargarPedidos, 2500);
    return () => clearInterval(interval);
  }, [cargarPedidos]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans">
      {/* Encabezado visible a la distancia */}
      <header className="border-b border-emerald-500/30 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
            <Martini className="w-10 h-10 text-slate-950" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              ¡Tu trago está listo!
            </h1>
            <p className="text-emerald-400 font-bold text-sm sm:text-lg tracking-wide mt-1">
              Pasá por la barra a retirarlo
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-mono">AK Producciones</span>
          <div className="text-sm font-semibold text-slate-300">{nombreEvento}</div>
        </div>
      </header>

      {/* Contenido principal: Grilla de pedidos listos */}
      <main className="flex-1 my-8 flex items-center justify-center">
        {pedidosListos.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4 max-w-md">
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Clock className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <h2 className="text-2xl font-bold text-slate-300">
              Los tragos se están preparando
            </h2>
            <p className="text-slate-500 text-sm">
              En instantes vas a ver tu nombre en esta pantalla cuando el barman termine tu pedido.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl">
            <AnimatePresence>
              {pedidosListos.map((pedido) => (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500 p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Listo para retirar
                      </span>
                      {pedido.tableNumber && (
                        <span className="text-xs font-semibold text-slate-400">
                          {pedido.tableNumber}
                        </span>
                      )}
                    </div>

                    <div className="pt-2">
                      <div className="text-3xl sm:text-4xl font-black text-white capitalize tracking-tight leading-tight">
                        {pedido.guestName}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-2 flex items-center gap-2">
                        <Martini className="w-6 h-6 shrink-0" />
                        <span>{pedido.drinkName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Pedido #{pedido.id.slice(-4).toUpperCase()}</span>
                    <span className="text-emerald-400 font-semibold">¡Salud! 🥂</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Pie de pantalla */}
      <footer className="border-t border-slate-900 pt-4 flex items-center justify-between text-xs text-slate-500">
        <div>Pantalla de avisos en vivo · Barra de tragos</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>En tiempo real</span>
        </div>
      </footer>
    </div>
  );
}
