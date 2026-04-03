'use client';

import { cn } from '@/lib/utils';
import type { PaymentMethod } from '@/types/public-landing';

interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  className?: string;
}

export function PaymentMethods({ paymentMethods, className }: PaymentMethodsProps) {
  if (!paymentMethods.length) return null;

  return (
    <section className={cn('py-20 px-4 bg-white', className)}>
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-3">
            Formas de pago
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Múltiples formas de pago disponibles
          </h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            Aceptamos distintas opciones para que puedas reservar sin complicaciones.
          </p>
        </div>

        {/* Payment options grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={cn(
                'flex flex-col items-center text-center p-4 rounded-2xl',
                'bg-gradient-to-br from-slate-50 to-purple-50',
                'border border-slate-100 shadow-sm',
                'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
              )}
            >
              <span className="text-4xl mb-3 drop-shadow-sm" role="img" aria-label={method.name}>
                {method.icon}
              </span>
              <p className="text-sm font-black text-slate-800 leading-snug">{method.name}</p>
              {method.description && (
                <p className="text-xs text-slate-400 mt-1 leading-tight">{method.description}</p>
              )}
            </div>
          ))}
        </div>

        {/* Cuotas note */}
        <p className="text-center mt-8 text-sm text-slate-400">
          💳 Aceptamos pagos en cuotas y a convenir. Consultanos para más detalles.
        </p>
      </div>
    </section>
  );
}
