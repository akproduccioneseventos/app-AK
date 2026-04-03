'use client';

import { cn } from '@/lib/utils';
import type { PromotionData } from '@/types/public-landing';

interface PromotionsOrGiftsProps {
  promotion: PromotionData;
  className?: string;
}

export function PromotionsOrGifts({ promotion, className }: PromotionsOrGiftsProps) {
  return (
    <section className={cn('py-20 px-4 bg-white', className)}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-3">
            Regalos &amp; Promociones
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            {promotion.sectionTitle}
          </h2>
          {promotion.sectionSubtitle && (
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">{promotion.sectionSubtitle}</p>
          )}
        </div>

        {/* Gifts grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {promotion.gifts.map((gift) => (
            <div
              key={gift.id}
              className={cn(
                'flex flex-col items-center text-center p-6 rounded-3xl',
                'bg-gradient-to-br from-purple-50 to-pink-50',
                'border border-purple-100 shadow-sm',
                'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
              )}
            >
              <span
                className="text-5xl mb-4 drop-shadow-sm"
                role="img"
                aria-label={gift.title}
              >
                {gift.icon}
              </span>
              <h3 className="text-base font-black text-slate-900 mb-2">{gift.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{gift.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
