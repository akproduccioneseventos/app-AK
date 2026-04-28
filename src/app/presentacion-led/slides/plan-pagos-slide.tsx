'use client';

import { motion } from 'framer-motion';
import { CalendarDays, FileText, MessageCircle, ImageIcon, CheckCircle2 } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { getContenidoPorTipo } from '../lib/contenido-por-tipo';
import { cn } from '@/lib/utils';
import type { CompanyInfo } from '@/types/settings';

const WHATSAPP_NUMBER = '59898355530';

interface PlanPagosSlideProps {
  companyInfo: CompanyInfo;
  tipoFiesta: string;
  clienteNombre: string;
  fechaEvento: string;
  totalEstimado: number;
  mostrarPrecios?: boolean;
  imagenFondoUrl?: string;
  onContrato?: () => void;
}

function calcularCuotas(total: number): Array<{ label: string; monto: number; descripcion: string }> {
  if (total <= 0) {
    return [
      { label: 'Reserva', monto: 0, descripcion: 'Monto a confirmar al contratar' },
      { label: 'Segundo pago', monto: 0, descripcion: '30 días antes del evento' },
      { label: 'Saldo final', monto: 0, descripcion: 'El día del evento' },
    ];
  }
  const reserva = Math.round(total * 0.3);
  const segundo = Math.round(total * 0.4);
  const saldo = total - reserva - segundo;
  return [
    { label: 'Reserva (30%)', monto: reserva, descripcion: 'Al momento de contratar' },
    { label: 'Segundo pago (40%)', monto: segundo, descripcion: '30 días antes del evento' },
    { label: 'Saldo final (30%)', monto: saldo, descripcion: 'El día del evento' },
  ];
}

function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

export function PlanPagosSlide({
  companyInfo,
  tipoFiesta,
  clienteNombre,
  fechaEvento,
  totalEstimado,
  mostrarPrecios = true,
  imagenFondoUrl,
  onContrato,
}: PlanPagosSlideProps) {
  const contenido = getContenidoPorTipo(tipoFiesta);
  const cuotas = calcularCuotas(totalEstimado);
  const safeImagen = imagenFondoUrl && isSafeUrl(imagenFondoUrl) ? imagenFondoUrl : null;

  const waMessage = clienteNombre
    ? `¡Hola AK Producciones! Quisiera coordinar el plan de pagos para el evento de ${clienteNombre}.`
    : '¡Hola AK Producciones! Me gustaría hablar sobre el plan de pagos.';
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-br from-indigo-400/30 to-emerald-500/30 border border-white/20 flex items-center justify-center mb-4">
            <CalendarDays className="h-8 w-8 text-indigo-300" />
          </div>
          <p className={`text-transparent bg-clip-text bg-gradient-to-r ${contenido.colorAcento} font-bold uppercase tracking-widest text-sm mb-2`}>
            Plan sugerido
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-3">
            Plan de Pagos
          </h1>
          <p className="text-white/60 text-lg">
            Distribuí el costo en cuotas accesibles para tu evento.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cuotas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {cuotas.map((cuota, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
              >
                <div className={cn(
                  'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl',
                  i === 0 ? 'bg-indigo-500/30 text-indigo-300' :
                  i === 1 ? 'bg-emerald-500/30 text-emerald-300' :
                  'bg-amber-500/30 text-amber-300',
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base">{cuota.label}</p>
                  <p className="text-white/50 text-sm">{cuota.descripcion}</p>
                </div>
                {mostrarPrecios && (
                  <p className={cn(
                    'font-black text-xl shrink-0',
                    i === 0 ? 'text-indigo-300' :
                    i === 1 ? 'text-emerald-300' : 'text-amber-300',
                  )}>
                    {cuota.monto > 0 ? `$${cuota.monto.toLocaleString('es-UY')}` : '—'}
                  </p>
                )}
              </motion.div>
            ))}

            {mostrarPrecios && totalEstimado > 0 && (
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center justify-between">
                <p className="text-white/80 font-semibold">Total estimado</p>
                <p className="text-white font-black text-2xl">${totalEstimado.toLocaleString('es-UY')}</p>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-white/60 text-sm">
                  Los montos son estimativos y se ajustan al presupuesto final. Consultanos para condiciones especiales.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: image + CTAs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-4"
          >
            {safeImagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safeImagen}
                alt="Evento"
                className="w-full aspect-[4/3] object-cover rounded-2xl"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-indigo-900/40 to-slate-800/60 rounded-2xl flex items-center justify-center border border-white/10">
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <ImageIcon className="h-12 w-12 text-white/60" />
                  <span className="text-white/50 text-sm">Foto del evento</span>
                </div>
              </div>
            )}

            {/* CTAs */}
            <button
              type="button"
              onClick={onContrato}
              className={`w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 bg-gradient-to-r ${contenido.colorAcento} shadow-lg transition-all hover:opacity-90`}
            >
              <FileText className="h-6 w-6" />
              Generar Contrato
            </button>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-3 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/30 transition-all"
            >
              <MessageCircle className="h-5 w-5 text-emerald-300" />
              Consultar por WhatsApp
            </a>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-white font-bold">{companyInfo.companyName || 'AK Producciones'}</p>
              {companyInfo.companyAddress && (
                <p className="text-white/50 text-sm mt-1">{companyInfo.companyAddress}</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}
