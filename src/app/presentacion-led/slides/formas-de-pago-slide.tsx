'use client';

import { motion } from 'framer-motion';
import { SlideLayout } from '../components/slide-layout';
import { getContenidoPorTipo } from '../lib/contenido-por-tipo';
import { sharedPaymentMethods } from '@/data/event-catalogs/shared';
import { DEFAULT_BOOKING_DEPOSIT_AMOUNT } from '@/lib/budget/formal-budget';

interface FormasDePagoSlideProps {
  tipoFiesta: string;
  bookingDepositAmount?: number;
}

export function FormasDePagoSlide({
  tipoFiesta,
  bookingDepositAmount = DEFAULT_BOOKING_DEPOSIT_AMOUNT,
}: FormasDePagoSlideProps) {
  const contenido = getContenidoPorTipo(tipoFiesta);
  const senaFormateada = new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(bookingDepositAmount);

  return (
    <SlideLayout overflowScroll>
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <p
            className={`text-transparent bg-clip-text bg-gradient-to-r ${contenido.colorAcento} font-bold uppercase tracking-widest text-sm mb-2`}
          >
            Sin complicaciones
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
            Formas de pago 💳
          </h1>
          <p className="text-white/60 text-lg mt-2 max-w-2xl mx-auto">
            Nos adaptamos a lo que mejor te funcione.
          </p>
        </motion.div>

        {/* Payment methods grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {sharedPaymentMethods.map((method, i) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl"
            >
              <span className="text-3xl flex-shrink-0">{method.icon}</span>
              <div>
                <div className="font-bold text-white text-sm">{method.name}</div>
                {method.description && (
                  <div className="text-white/50 text-xs mt-0.5">{method.description}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Seña callout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + sharedPaymentMethods.length * 0.08 + 0.1 }}
          className="p-5 rounded-2xl text-center bg-white/5 border border-white/10"
        >
          <p
            className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${contenido.colorAcento} mb-1`}
          >
            Seña para reservar tu fecha
          </p>
          <p className="text-white/60 text-sm">
            Para reservar la fecha se abona una seña de {senaFormateada}. El saldo se abona en
            cuotas según lo acordado. En caso de cancelación rige una penalidad del 30% del
            presupuesto vigente.
          </p>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
