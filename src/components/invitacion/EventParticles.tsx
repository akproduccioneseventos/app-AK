'use client';
import { useMemo } from 'react';

interface EventParticlesProps {
  tipoCelebracion?: string;
  primaryColor: string;
  count?: number;
}

interface ParticleDef {
  id: number;
  left: number;
  duration: number;
  delay: number;
  content: string;
  isEmoji: boolean;
  color?: string;
  rotate?: number;
}

const CONFETTI_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];

function getEmojis(tipo?: string): string[] {
  if (tipo === 'XV Años') return ['🌸', '🦋', '✨', '🌸', '✨', '🦋'];
  if (tipo === 'Boda') return ['💍', '✨', '🤍', '✨', '🤍', '✨'];
  if (tipo === 'Cumpleaños') return []; // uses confetti divs instead of emojis
  if (tipo === 'Infantil') return ['🎈', '⭐', '🎊', '🎈', '⭐', '🎊'];
  return ['✨', '🎉', '✨', '🎉', '✨', '🎉'];
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildParticles(tipo: string | undefined, count: number, primaryColor: string): ParticleDef[] {
  const rand = seededRandom(42);
  const emojis = getEmojis(tipo);
  const isConfetti = tipo === 'Cumpleaños' || emojis.length === 0;

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 5 + rand() * 90,
    duration: 4 + rand() * 4,
    delay: rand() * 4,
    content: isConfetti ? '' : emojis[i % emojis.length],
    isEmoji: !isConfetti,
    color: isConfetti ? CONFETTI_COLORS[i % CONFETTI_COLORS.length] : undefined,
    rotate: isConfetti ? Math.floor(rand() * 360) : undefined,
  }));
}

export function EventParticles({ tipoCelebracion, primaryColor, count = 12 }: EventParticlesProps) {
  const particles = useMemo(
    () => buildParticles(tipoCelebracion, count, primaryColor),
    [tipoCelebracion, count, primaryColor]
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{ zIndex: 5 }}
    >
      {particles.map(p => (
        p.isEmoji ? (
          <span
            key={p.id}
            className="absolute bottom-0 select-none"
            style={{
              left: `${p.left}%`,
              fontSize: 20,
              animation: `epFloat ${p.duration}s ${p.delay}s ease-in infinite`,
              opacity: 0,
            }}
          >
            {p.content}
          </span>
        ) : (
          <span
            key={p.id}
            className="absolute bottom-0 block"
            style={{
              left: `${p.left}%`,
              width: 6,
              height: 6,
              borderRadius: 1,
              backgroundColor: p.color,
              transform: `rotate(${p.rotate}deg)`,
              animation: `epFloat ${p.duration}s ${p.delay}s ease-in infinite`,
              opacity: 0,
            }}
          />
        )
      ))}

      <style>{`
        @keyframes epFloat {
          0%   { transform: translateY(0) rotate(0deg);    opacity: 0; }
          10%  { opacity: 1; }
          85%  { opacity: 0.7; }
          100% { transform: translateY(-100vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
