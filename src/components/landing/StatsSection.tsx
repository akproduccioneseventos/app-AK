'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const stats = [
  { value: 500, suffix: '+', label: 'Eventos Realizados', icon: '🎉' },
  { value: 10, suffix: '+', label: 'Años de Experiencia', icon: '⭐' },
  { value: 98, suffix: '%', label: 'Clientes Satisfechos', icon: '❤️' },
  { value: 24, suffix: '/7', label: 'Soporte al Cliente', icon: '📞' },
];

function useCountUp(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return count;
}

function StatCard({ value, suffix, label, icon, active }: typeof stats[0] & { active: boolean }) {
  const count = useCountUp(value, 1800, active);
  return (
    <div className="flex flex-col items-center text-center gap-2 p-6">
      <span className="text-4xl">{icon}</span>
      <div className="text-5xl font-black text-white tabular-nums">
        {count}{suffix}
      </div>
      <div className="text-white/70 font-semibold text-sm uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

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
          {stats.map((s) => (
            <StatCard key={s.label} {...s} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
