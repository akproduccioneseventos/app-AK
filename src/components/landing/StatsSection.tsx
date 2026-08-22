'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarCheck2, Clock3, HeartHandshake, Headphones, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LandingStatItem } from '@/types/landing-editor';

const DEFAULT_STATS: LandingStatItem[] = [
  { value: '+500', label: 'Eventos realizados', icon: 'events' },
  { value: '+12', label: 'Años de experiencia', icon: 'years' },
  { value: '100%', label: 'Clientes satisfechos', icon: 'clients' },
  { value: '24/7', label: 'Acompañamiento', icon: 'support' },
];

const STAT_ICONS: Record<string, LucideIcon> = {
  events: CalendarCheck2,
  years: Clock3,
  clients: HeartHandshake,
  support: Headphones,
};

const FALLBACK_ICONS = [CalendarCheck2, Clock3, HeartHandshake, Headphones];

import { AnimatedCounter } from '@/components/ui/animated-counter';

function StatCard({
  value,
  label,
  icon,
  index,
}: LandingStatItem & { index: number }) {
  const Icon = STAT_ICONS[icon] || FALLBACK_ICONS[index % FALLBACK_ICONS.length];
  const customIcon = STAT_ICONS[icon] ? null : icon;

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-500/40 hover:bg-white/[0.055]">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 text-red-200">
        {customIcon && customIcon.length <= 3 ? (
          <span className="text-lg leading-none">{customIcon}</span>
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>
      <div className="text-4xl font-black tabular-nums text-white sm:text-5xl">
        <AnimatedCounter value={value} />
      </div>
      <div className="mt-3 text-xs font-black uppercase tracking-widest text-white/60">
        {label}
      </div>
    </article>
  );
}

interface StatsSectionProps {
  stats?: LandingStatItem[];
}

export function StatsSection({ stats }: StatsSectionProps) {
  const displayStats = stats && stats.length > 0 ? stats : DEFAULT_STATS;

  return (
    <section className="border-y border-white/10 bg-slate-950 py-20 text-white" id="stats">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="mb-3 inline-flex rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-400">
              Trayectoria AK
            </span>
            <h2 className="font-headline text-3xl font-black leading-tight text-white sm:text-4xl">
              Números que respaldan cada evento
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium leading-relaxed text-white/60 sm:text-right">
            Experiencia real, atención cercana y producción integral para que la fiesta no dependa de improvisar.
          </p>
        </div>
        <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4')}>
          {displayStats.map((stat, index) => (
            <StatCard key={`stat-${stat.label}-${index}`} {...stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

