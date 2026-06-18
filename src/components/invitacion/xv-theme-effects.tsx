'use client';

import { motion } from 'framer-motion';

type XVTheme = 'XV_NeonParty' | 'XV_PrincesaClasica' | 'XV_GlowInTheDark' | 'XV_MinimalChic';

interface XVThemeEffectsProps {
  plantillaId: string;
}

/**
 * Renders decorative floating particle / glow overlays for 15-year-old party
 * invitation themes. Each template gets its own distinct visual language.
 *
 * These are rendered as a fixed overlay that sits behind interactive content
 * but above the page background, creating depth and atmosphere.
 */
export function XVThemeEffects({ plantillaId }: XVThemeEffectsProps) {
  switch (plantillaId) {
    case 'XV_NeonParty':
      return <NeonPartyEffects />;
    case 'XV_PrincesaClasica':
      return <PrincesaClasicaEffects />;
    case 'XV_GlowInTheDark':
      return <GlowInTheDarkEffects />;
    case 'XV_MinimalChic':
      return <MinimalChicEffects />;
    default:
      return null;
  }
}

// ─── XV_NeonParty ─────────────────────────────────────────────────────────────
// Pulsing neon border glow lines + floating light orbs in fuchsia/cyan
function NeonPartyEffects() {
  const orbs = Array.from({ length: 14 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {/* Ambient neon glow corners */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-30"
        style={{ background: 'radial-gradient(circle, #d946ef 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-25"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
      />

      {/* Floating neon orbs */}
      {orbs.map((_, i) => {
        const isCyan = i % 2 === 0;
        const size = 6 + (i % 5) * 4;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${(i * 7.3) % 100}%`,
              top: `${(i * 13.7) % 100}%`,
              backgroundColor: isCyan ? '#22d3ee' : '#e879f9',
              boxShadow: `0 0 ${size * 2}px ${isCyan ? '#22d3ee' : '#e879f9'}`,
            }}
            animate={{
              y: [0, -60, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      {/* Horizontal neon scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, #d946ef, #06b6d4, transparent)',
          boxShadow: '0 0 20px #d946ef, 0 0 40px #06b6d4',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ─── XV_PrincesaClasica ───────────────────────────────────────────────────────
// Soft falling rose petals + champagne sparkles
function PrincesaClasicaEffects() {
  const petals = Array.from({ length: 18 });
  const sparkles = Array.from({ length: 10 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {/* Warm romantic ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] rounded-full blur-[100px] opacity-15"
        style={{ background: 'radial-gradient(circle, #fda4af 0%, transparent 70%)' }}
      />

      {/* Falling petals */}
      {petals.map((_, i) => {
        const startX = (i * 5.7) % 100;
        const size = 12 + (i % 4) * 6;
        const petalColor = i % 3 === 0 ? '#fda4af' : i % 3 === 1 ? '#fecdd3' : '#ffe4e6';
        return (
          <motion.div
            key={`petal-${i}`}
            className="absolute"
            style={{
              left: `${startX}%`,
              top: '-5%',
              width: size,
              height: size * 0.6,
              borderRadius: '50% 0 50% 0',
              backgroundColor: petalColor,
              opacity: 0.5,
              filter: 'blur(0.5px)',
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, (i % 2 === 0 ? 40 : -40), (i % 2 === 0 ? -20 : 20)],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8 + (i % 5) * 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'linear',
            }}
          />
        );
      })}

      {/* Champagne sparkles */}
      {sparkles.map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-amber-200"
          style={{
            left: `${(i * 11) % 100}%`,
            top: `${(i * 17) % 100}%`,
            boxShadow: '0 0 4px #fde68a, 0 0 8px #fde68a',
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
}

// ─── XV_GlowInTheDark ─────────────────────────────────────────────────────────
// Fluorescent paint splatter particles + UV-light glow
function GlowInTheDarkEffects() {
  const particles = Array.from({ length: 20 });
  const uvColors = ['#a3e635', '#c084fc', '#22d3ee', '#f472b6', '#facc15'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {/* UV ambient light */}
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: 'radial-gradient(ellipse at 30% 50%, #7c3aed 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, #06b6d4 0%, transparent 50%)' }}
      />

      {/* Fluorescent floating particles */}
      {particles.map((_, i) => {
        const color = uvColors[i % uvColors.length];
        const size = 4 + (i % 6) * 3;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${(i * 5.3) % 100}%`,
              top: `${(i * 11) % 100}%`,
              backgroundColor: color,
              boxShadow: `0 0 ${size * 3}px ${color}, 0 0 ${size * 6}px ${color}40`,
            }}
            animate={{
              y: [0, -30 - (i % 3) * 20, 0],
              x: [0, (i % 2 === 0 ? 15 : -15), 0],
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 2.5 + (i % 4),
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      {/* Slow-moving UV wave */}
      <motion.div
        className="absolute left-0 right-0 h-32 opacity-10"
        style={{
          background: 'linear-gradient(180deg, transparent, #a855f7, #22d3ee, transparent)',
        }}
        animate={{ top: ['-15%', '115%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ─── XV_MinimalChic ───────────────────────────────────────────────────────────
// Subtle gold-rose metallic dust + geometric accent lines
function MinimalChicEffects() {
  const dustParticles = Array.from({ length: 12 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {/* Ultra-subtle warm glow */}
      <div
        className="absolute top-1/4 right-0 w-[40vw] h-[40vh] rounded-full blur-[120px] opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
      />

      {/* Metallic gold dust */}
      {dustParticles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            left: `${(i * 8.5) % 100}%`,
            top: `${(i * 14) % 100}%`,
            backgroundColor: i % 2 === 0 ? '#d4a574' : '#e8c89e',
            opacity: 0.35,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.15, 0.5, 0.15],
          }}
          transition={{
            duration: 4 + (i % 3) * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Thin geometric accent line */}
      <motion.div
        className="absolute left-[10%] right-[10%] h-px opacity-[0.08]"
        style={{ background: 'linear-gradient(90deg, transparent, #d4a574, transparent)' }}
        animate={{ top: ['20%', '80%', '20%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
