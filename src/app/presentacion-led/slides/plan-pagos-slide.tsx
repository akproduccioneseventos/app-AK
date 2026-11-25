'use client';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { CalendarDays, FileText, MessageCircle, CheckCircle2 } from 'lucide-react';
import { SlideLayout } from '../components/slide-layout';
import { getContenidoPorTipo } from '../lib/contenido-por-tipo';
import { DEFAULT_BOOKING_DEPOSIT_AMOUNT } from '@/lib/budget/formal-budget';
import { cn } from '@/lib/utils';
import type { CompanyInfo } from '@/types/settings';

const WHATSAPP_NUMBER = AK_WHATSAPP_NUMBER;
const FOTO_PLAN_DEFAULT = '/media/catalogo-servicios/quinceanera_persuasiva.png';
const FOTO_PLAN_FALLBACK = '/media/catalogo-servicios/familia_feliz_evento.png';

interface PlanPagosSlideProps {
  companyInfo: CompanyInfo;
  tipoFiesta: string;
  clienteNombre: string;
  fechaEvento: string;
  totalEstimado: number;
  bookingDepositAmount?: number;
  mostrarPrecios?: boolean;
  imagenFondoUrl?: string;
  onContrato?: () => void;
}

export interface CuotaPlanPagosLed {
  label: string;
  monto: number;
  descripcion: string;
}

/**
 * Arma las cuotas del plan de pagos de la presentación LED usando la seña fija
 * configurada en Ajustes (`bookingDepositAmount`), y repartiendo el saldo
 * restante en 40% (segundo pago) y 60% (saldo final).
 */
export function calcularCuotasPlanPagosLed(
  total: number,
  bookingDepositAmount = DEFAULT_BOOKING_DEPOSIT_AMOUNT,
): CuotaPlanPagosLed[] {
  const sena = Math.max(
    0,
    Math.round(Number.isFinite(bookingDepositAmount) ? bookingDepositAmount : DEFAULT_BOOKING_DEPOSIT_AMOUNT),
  );
  const senaFormateada = `$${sena.toLocaleString('es-UY')}`;

  if (!Number.isFinite(total) || total <= 0) {
    return [
      {
        label: `Seña para reservar la fecha: ${senaFormateada}`,
        monto: sena,
        descripcion: 'El resto, en cuotas antes de la fiesta',
      },
      {
        label: 'Segundo pago',
        monto: 0,
        descripcion: '30 días antes del evento',
      },
      {
        label: 'Saldo final',
        monto: 0,
        descripcion: 'El día del evento',
      },
    ];
  }

  const totalRedondeado = Math.round(total);
  const reserva = Math.min(totalRedondeado, sena);
  const restante = Math.max(0, totalRedondeado - reserva);
  const segundo = Math.round(restante * 0.4);
  const saldo = restante - segundo;

  return [
    {
      label: `Seña para reservar la fecha (${senaFormateada})`,
      monto: reserva,
      descripcion: 'Seña fija al momento de contratar',
    },
    {
      label: 'Segundo pago (40% del saldo)',
      monto: segundo,
      descripcion: '30 días antes del evento',
    },
    {
      label: 'Saldo final (60% del saldo)',
      monto: saldo,
      descripcion: 'El día del evento',
    },
  ];
}

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
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
  totalEstimado,
  bookingDepositAmount = DEFAULT_BOOKING_DEPOSIT_AMOUNT,
  mostrarPrecios = true,
  imagenFondoUrl,
  onContrato,
}: PlanPagosSlideProps) {
  const contenido = getContenidoPorTipo(tipoFiesta);
  const cuotas = calcularCuotasPlanPagosLed(totalEstimado, bookingDepositAmount);
  const defaultByTipo = tipoFiesta.toLowerCase().includes('boda') || tipoFiesta.toLowerCase().includes('casamiento')
    ? '/media/catalogo-servicios/boda_persuasiva.png'
    : FOTO_PLAN_DEFAULT;
  const initialImg = imagenFondoUrl && isSafeUrl(imagenFondoUrl) ? imagenFondoUrl : defaultByTipo;
  const [imgSrc, setImgSrc] = useState<string>(initialImg);
  const empresa = companyInfo.companyName || 'AK Producciones';

  const waMessage = clienteNombre
    ? `¡Hola ${empresa}! Quisiera coordinar el plan de pagos para el evento de ${clienteNombre.slice(0, 200)}.`
    : `¡Hola ${empresa}! Me gustaría hablar sobre el plan de pagos.`;
  // Build a safe WhatsApp URL only when the phone number is a known constant
  const waHref = /^\d+$/.test(WHATSAPP_NUMBER)
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`
    : '#';

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-5"
        >
          <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-indigo-400/30 to-emerald-500/30 border border-white/20 flex items-center justify-center mb-2">
            <CalendarDays className="h-6 w-6 text-indigo-300" />
          </div>
          <p className={`text-transparent bg-clip-text bg-gradient-to-r ${contenido.colorAcento} font-bold uppercase tracking-widest text-xs mb-1`}>
            Plan sugerido
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg mb-1">
            Plan de Pagos
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            Distribuí el costo en cuotas accesibles para tu evento.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Cuotas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            {cuotas.map((cuota, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5"
              >
                <div className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-black text-lg',
                  i === 0 ? 'bg-indigo-500/30 text-indigo-300' :
                  i === 1 ? 'bg-emerald-500/30 text-emerald-300' :
                  'bg-amber-500/30 text-amber-300',
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm sm:text-base">{cuota.label}</p>
                  <p className="text-white/50 text-xs sm:text-sm">{cuota.descripcion}</p>
                </div>
                {mostrarPrecios && (
                  <p className={cn(
                    'font-black text-lg sm:text-xl shrink-0',
                    i === 0 ? 'text-indigo-300' :
                    i === 1 ? 'text-emerald-300' : 'text-amber-300',
                  )}>
                    {cuota.monto > 0 ? `$${cuota.monto.toLocaleString('es-UY')}` : '—'}
                  </p>
                )}
              </motion.div>
            ))}

            {mostrarPrecios && totalEstimado > 0 && (
              <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 flex items-center justify-between">
                <p className="text-white/80 font-semibold text-sm">Total estimado</p>
                <p className="text-white font-black text-xl sm:text-2xl">${totalEstimado.toLocaleString('es-UY')}</p>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-white/60 text-xs sm:text-sm">
                  Los montos son estimativos y tienen un ajuste anual del 15% acumulativo desde la firma del contrato. En caso de cancelación rige una penalidad del 30% del presupuesto vigente.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: image + CTAs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-3"
          >
            <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl border border-white/15 bg-slate-900">
              <Image
                src={imgSrc}
                alt="Evento AK Producciones"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
                className="object-cover"
                onError={() => {
                  if (imgSrc !== FOTO_PLAN_FALLBACK) {
                    setImgSrc(FOTO_PLAN_FALLBACK);
                  }
                }}
              />
            </div>

            {/* CTAs */}
            <button
              type="button"
              onClick={onContrato}
              className="w-full py-3.5 rounded-2xl font-black text-white text-base sm:text-lg flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-700 shadow-lg transition-all"
            >
              <FileText className="h-5 w-5" />
              Generar Contrato
            </button>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/30 transition-all"
            >
              <MessageCircle className="h-5 w-5 text-emerald-300" />
              Consultar por WhatsApp
            </a>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <p className="text-white font-bold text-sm sm:text-base">{empresa}</p>
              {companyInfo.companyAddress && (
                <p className="text-white/50 text-xs sm:text-sm mt-0.5">{companyInfo.companyAddress}</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}
