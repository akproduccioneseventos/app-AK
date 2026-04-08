'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { LandingStatItem } from '@/types/landing-editor';

const DEFAULT_STATS = [
  { value: '+500', label: 'Eventos Realizados', icon: '🎉' },
  { value: '+12', label: 'Años de Experiencia', icon: '⭐' },
  { value: '100%', label: 'Clientes Satisfechos', icon: '❤️' },
  { value: '24/7', label: 'Soporte al Cliente', icon: '📞' },
];

function StatCard({ value, label, icon, active }: LandingStatItem & { active: boolean }) {
  // Extract numeric part for animation (if present)
  const numMatch = value.match(/(\d+)/);
  const numValue = numMatch ? parseInt(numMatch[1]) : null;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active || numValue === null) return;
    let start = 0;
    const duration = 1800;
    const step = numValue / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [numValue, active]);

  // Build display value: replace numeric part with animated count
  const displayValue = numValue !== null && active
    ? value.replace(String(numValue), String(count))
    : value;

  return (
    <div className="flex flex-col items-center text-center gap-2 p-6">
      <span className="text-4xl">{icon}</span>
      <div className="text-5xl font-black text-white tabular-nums">
        {displayValue}
      </div>
      <div className="text-white/70 font-semibold text-sm uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

interface StatsSectionProps {
  stats?: LandingStatItem[];
}

export function StatsSection({ stats }: StatsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const displayStats = stats && stats.length > 0 ? stats : DEFAULT_STATS;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-purple-900 via-fuchsia-900 to-indigo-900" id="stats">
      <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Números que Hablan
          </h2>
          <p className="text-white/60 text-lg">La experiencia que nos respalda</p>
        </div>
        <div className={cn(
          'grid grid-cols-2 md:grid-cols-4 gap-4',
          'divide-x-0 md:divide-x divide-y md:divide-y-0 divide-white/10'
        )}>
          {displayStats.map((s, i) => (
            <StatCard key={`${s.label}-${i}`} {...s} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
