'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  fiestaId: string;
  nombreEvento: string;
  primaryColor: string;
  tipoCelebracion?: string;
  onComplete: () => void;
}

const TIPO_EMOJI: Record<string, string> = {
  'XV Años': '👑',
  'Boda': '💍',
  'Cumpleaños': '🎂',
  'Infantil': '🎈',
};

function getEmoji(tipo?: string): string {
  if (!tipo) return '🎉';
  return TIPO_EMOJI[tipo] ?? '🎉';
}

interface Particle {
  id: number;
  left: number;
  duration: number;
  delay: number;
  emoji: string;
  size: number;
}

function getParticleEmojis(tipo?: string): string[] {
  if (tipo === 'XV Años') return ['🌸', '🦋', '✨', '🌸', '✨'];
  if (tipo === 'Boda') return ['💍', '✨', '🤍', '✨', '🤍'];
  if (tipo === 'Cumpleaños') return ['🎊', '🎉', '⭐', '🎊', '🎉'];
  if (tipo === 'Infantil') return ['🎈', '⭐', '🎊', '🎈', '⭐'];
  return ['✨', '🎉', '✨', '🎉', '✨'];
}

function generateParticles(tipo?: string, count = 12): Particle[] {
  const emojis = getParticleEmojis(tipo);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 10 + Math.random() * 80,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 3,
    emoji: emojis[i % emojis.length],
    size: 18 + Math.floor(Math.random() * 16),
  }));
}

export function SplashScreen({
  fiestaId,
  nombreEvento,
  primaryColor,
  tipoCelebracion,
  onComplete,
}: SplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [particles] = useState<Particle[]>(() => generateParticles(tipoCelebracion));
  const [dots, setDots] = useState('');

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem(`splash_seen_${fiestaId}`, '1');
    } catch {}
    setTimeout(onComplete, 600);
  }, [fiestaId, onComplete]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(`splash_seen_${fiestaId}`)) {
        onComplete();
        return;
      }
    } catch {}
    setVisible(true);
    const timer = setTimeout(dismiss, 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiestaId]);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 450);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '-100%' }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
          style={{ backgroundColor: primaryColor }}
          onClick={dismiss}
        >
          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {particles.map(p => (
              <span
                key={p.id}
                className="absolute bottom-0"
                style={{
                  left: `${p.left}%`,
                  fontSize: p.size,
                  animation: `splashFloat ${p.duration}s ${p.delay}s ease-in infinite`,
                  opacity: 0,
                }}
              >
                {p.emoji}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="text-7xl sm:text-8xl drop-shadow-2xl"
            >
              {getEmoji(tipoCelebracion)}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="text-3xl sm:text-5xl font-serif font-bold text-white leading-tight drop-shadow-lg"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", textShadow: '0 2px 20px rgba(0,0,0,0.25)' }}
            >
              {nombreEvento}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="text-white/80 text-base sm:text-lg font-medium tracking-wide"
              style={{ minHeight: '1.5em' }}
            >
              Tu invitación está lista{dots}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="text-white text-xs mt-2 uppercase tracking-widest"
            >
              Toca para continuar
            </motion.p>
          </div>

          <style>{`
            @keyframes splashFloat {
              0%   { transform: translateY(0) scale(1);   opacity: 0; }
              10%  { opacity: 1; }
              80%  { opacity: 0.8; }
              100% { transform: translateY(-100vh) scale(0.7); opacity: 0; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
