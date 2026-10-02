'use client';

import React from 'react';

interface MascotaAsistenteAKProps {
  className?: string;
  size?: number;
  colorPrimario?: string;
  colorSecundario?: string;
  estado?: 'esperando' | 'hablando' | 'exito';
}

export function MascotaAsistenteAK({
  className = 'w-6 h-6',
  size = 28,
  colorPrimario = '#dc2626', // AK red
  colorSecundario = '#f87171',
  estado = 'esperando',
}: MascotaAsistenteAKProps) {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Mascota Asistente AK"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transform transition-transform duration-300 motion-safe:hover:scale-105"
      >
        <defs>
          <linearGradient id="gradienteCuerpoAK" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorPrimario} />
            <stop offset="100%" stopColor={colorSecundario} />
          </linearGradient>
          <filter id="sombraSuave" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Antenita con destello / estrella simpática */}
        <path
          d="M20 9 V4"
          stroke={colorPrimario}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="3" r="2.5" fill="#facc15" className="motion-safe:animate-pulse" />

        {/* Cabeza redondita amigable */}
        <rect
          x="6"
          y="9"
          width="28"
          height="25"
          rx="11"
          fill="url(#gradienteCuerpoAK)"
          filter="url(#sombraSuave)"
        />

        {/* Pantalla / carita */}
        <rect
          x="9"
          y="12"
          width="22"
          height="19"
          rx="8"
          fill="#1e1e24"
        />

        {/* Ojos expresivos parpadeantes */}
        <g className="fill-cyan-300">
          <ellipse cx="15" cy="20" rx="2.5" ry="3" />
          <ellipse cx="25" cy="20" rx="2.5" ry="3" />
          {/* Brillos de ojos */}
          <circle cx="16" cy="19" r="0.9" fill="#ffffff" />
          <circle cx="26" cy="19" r="0.9" fill="#ffffff" />
        </g>

        {/* Mejillas sonrosadas */}
        <circle cx="12" cy="24" r="1.5" fill="#f87171" opacity="0.8" />
        <circle cx="28" cy="24" r="1.5" fill="#f87171" opacity="0.8" />

        {/* Sonrisa simpática */}
        {estado === 'hablando' ? (
          <ellipse cx="20" cy="24.5" rx="2.2" ry="1.8" fill="#38bdf8" />
        ) : (
          <path
            d="M17.5 24 Q20 27 22.5 24"
            stroke="#38bdf8"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Detalle letra K o corbatita de fiesta */}
        <path
          d="M18.5 35 L20 33 L21.5 35 Z"
          fill="#facc15"
        />
      </svg>
    </div>
  );
}
