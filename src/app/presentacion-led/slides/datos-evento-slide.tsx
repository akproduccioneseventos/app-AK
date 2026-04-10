'use client';

import { motion } from 'framer-motion';
import { ChevronRight, User, CalendarDays, PartyPopper, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { SlideLayout } from '../components/slide-layout';
import { TIPOS_FIESTA } from '../lib/contenido-por-tipo';
import type { ClientData } from '../lib/tipos';

interface DatosEventoSlideProps {
  clientData: ClientData;
  onClientDataChange: (data: ClientData) => void;
  onNext: () => void;
}

export function DatosEventoSlide({ clientData, onClientDataChange, onNext }: DatosEventoSlideProps) {
  return (
    <SlideLayout overflowScroll>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-lg mx-auto"
      >
        <div className="text-center mb-8">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-400/30 to-purple-500/30 border border-white/20 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-indigo-300" />
          </div>
          <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm mb-2">Datos del evento</p>
          <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg mb-2">
            ¿Para quién es la celebración?
          </h1>
          <p className="text-white/60 text-base">Completá los datos y armamos tu presupuesto a medida.</p>
        </div>

        <div className="space-y-5 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" /> Nombre del festejado/a o pareja
            </Label>
            <input
              type="text"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="Ej: María y José"
              value={clientData.nombre}
              onChange={e => onClientDataChange({ ...clientData, nombre: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Fecha del evento
            </Label>
            <input
              type="date"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base [color-scheme:dark]"
              value={clientData.fechaEvento}
              onChange={e => onClientDataChange({ ...clientData, fechaEvento: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
              <PartyPopper className="w-4 h-4" /> Tipo de fiesta
            </Label>
            <select
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base [color-scheme:dark]"
              value={clientData.tipoFiesta}
              onChange={e => onClientDataChange({ ...clientData, tipoFiesta: e.target.value })}
            >
              <option value="">Seleccioná el tipo de evento...</option>
              {TIPOS_FIESTA.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> Cantidad de invitados (aprox.)
            </Label>
            <input
              type="number"
              min="1"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="Ej: 150"
              value={clientData.cantidadInvitados}
              onChange={e => onClientDataChange({ ...clientData, cantidadInvitados: e.target.value })}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <button
            onClick={onNext}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            Continuar a los servicios
            <ChevronRight className="h-5 w-5" />
          </button>
        </motion.div>
      </motion.div>
    </SlideLayout>
  );
}
