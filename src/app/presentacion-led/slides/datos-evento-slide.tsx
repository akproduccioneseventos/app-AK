'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, User, CalendarDays, PartyPopper, Users, Building2, MapPin, Clock3 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { SlideLayout } from '../components/slide-layout';
import { TIPOS_FIESTA } from '../lib/contenido-por-tipo';
import type { ClientData } from '../lib/tipos';

interface DatosEventoSlideProps {
  clientData: ClientData;
  onClientDataChange: (data: ClientData) => void;
  onNext: () => void;
}

function addDays(dateString: string, days: number): string | null {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;
  return new Date(year, month - 1, day).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function DatosEventoSlide({ clientData, onClientDataChange, onNext }: DatosEventoSlideProps) {
  const [fechasBloqueadas, setFechasBloqueadas] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const fechaOcupada = !!clientData.fechaEvento && fechasBloqueadas.includes(clientData.fechaEvento);
  const hasRequiredFields = Boolean(
    clientData.nombre.trim()
    && clientData.tipoFiesta
    && clientData.fechaEvento
    && Number(clientData.cantidadInvitados) > 0
    && Number(clientData.duracionHoras) > 0,
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('presentacion_fechas_bloqueadas');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setFechasBloqueadas(parsed.filter((fecha): fecha is string => typeof fecha === 'string'));
      }
    } catch {
      setFechasBloqueadas([]);
    }
  }, []);

  const sugerencias = useMemo(
    () => (fechaOcupada ? [7, 14, -7]
      .map(days => addDays(clientData.fechaEvento, days))
      .filter((fecha): fecha is string => !!fecha && !fechasBloqueadas.includes(fecha)) : []),
    [clientData.fechaEvento, fechaOcupada, fechasBloqueadas],
  );

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
              <PartyPopper className="w-4 h-4" /> Tipo de fiesta
            </Label>
            <select
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base [color-scheme:dark]"
              value={clientData.tipoFiesta}
              onChange={e => onClientDataChange({ ...clientData, tipoFiesta: e.target.value })}
            >
              <option value="">Seleccioná el tipo de evento...</option>
              {TIPOS_FIESTA.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Fecha del evento
            </Label>
            <input
              type="date"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base [color-scheme:dark]"
              value={clientData.fechaEvento}
              onChange={e => onClientDataChange({ ...clientData, fechaEvento: e.target.value })}
            />
            {clientData.fechaEvento && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                {fechaOcupada ? (
                  <div className="space-y-2">
                    <p className="text-amber-300 text-sm font-semibold">
                      ⚠️ Esa fecha podría estar ocupada. Te sugerimos estas fechas cercanas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sugerencias.map(fecha => (
                        <button
                          key={fecha}
                          type="button"
                          onClick={() => onClientDataChange({ ...clientData, fechaEvento: fecha })}
                          className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-sm hover:bg-indigo-500/30 transition-colors"
                        >
                          {formatDate(fecha)}
                        </button>
                      ))}
                    </div>
                    {sugerencias.length === 0 && (
                      <p className="text-white/60 text-xs">
                        No encontramos fechas cercanas en este momento, consultanos para más opciones.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-emerald-300 text-sm font-medium">✅ Fecha disponible para cotizar.</p>
                )}
              </div>
            )}
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
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" /> Invitados adolescentes
              </Label>
              <input
                type="number"
                min="0"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                placeholder="Ej: 15"
                value={clientData.invitadosAdolescentes}
                onChange={e => onClientDataChange({ ...clientData, invitadosAdolescentes: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
                <Clock3 className="w-4 h-4" /> Duración (horas) *
              </Label>
              <select
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base [color-scheme:dark]"
                value={clientData.duracionHoras}
                onChange={e => onClientDataChange({ ...clientData, duracionHoras: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                {Array.from({ length: 10 }).map((_, idx) => {
                  const hour = idx + 3;
                  return (
                    <option key={hour} value={String(hour)}>
                      {hour} horas
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Salón o lugar (si ya lo sabe)
            </Label>
            <input
              type="text"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="Ej: Salón La Toscana"
              value={clientData.salon}
              onChange={e => onClientDataChange({ ...clientData, salon: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Ciudad
            </Label>
            <input
              type="text"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="Ej: Salto"
              value={clientData.ciudad}
              onChange={e => onClientDataChange({ ...clientData, ciudad: e.target.value })}
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
            onClick={() => {
              setShowValidation(true);
              if (!hasRequiredFields) return;
              onNext();
            }}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            Continuar a configuración de menú
            <ChevronRight className="h-5 w-5" />
          </button>
          {showValidation && !hasRequiredFields && (
            <p className="text-amber-300 text-sm mt-2 text-center">
              Completá nombre, tipo, fecha, invitados y horas para continuar.
            </p>
          )}
        </motion.div>
      </motion.div>
    </SlideLayout>
  );
}
