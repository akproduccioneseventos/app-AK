'use client';

import React from 'react';

interface SvgProps {
  color?: string;
  color2?: string;
  color3?: string;
  size?: number;
}

export function GloboSvg({ color = '#FF6B6B', size = 60 }: SvgProps) {
  return (
    <svg width={size} height={size * 1.33} viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="28" rx="26" ry="28" fill={color} />
      <ellipse cx="22" cy="16" rx="8" ry="6" fill="rgba(255,255,255,0.35)" />
      <path d="M30 56 C28 62 26 68 30 72 C34 68 32 62 30 56Z" fill={color} />
      <line x1="30" y1="56" x2="30" y2="72" stroke="#888" strokeWidth="1.5" />
      <circle cx="30" cy="57" r="2" fill="#888" />
    </svg>
  );
}

export function FlorSvg({ color = '#FF9ECA', color2 = '#FFD700', size = 60 }: SvgProps) {
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {angles.map((a, i) => {
        const rad = (a * Math.PI) / 180;
        const cx = 30 + 14 * Math.cos(rad);
        const cy = 30 + 14 * Math.sin(rad);
        return <ellipse key={i} cx={cx} cy={cy} rx="9" ry="6" fill={color} transform={`rotate(${a},${cx},${cy})`} />;
      })}
      <circle cx="30" cy="30" r="9" fill={color2} />
      <circle cx="27" cy="27" r="3" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

export function ArcoSvg({ color = '#FF6B6B', color2 = '#6BC5FF', color3 = '#FFDD57', size = 100 }: SvgProps) {
  const cs = [color, color2, color3];
  const ballsOnArc = 14;
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {Array.from({ length: ballsOnArc }).map((_, i) => {
        const t = i / (ballsOnArc - 1);
        const angle = Math.PI * t;
        const cx = 10 + 80 * t;
        const cy = 55 - 46 * Math.sin(angle);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="7" fill={cs[i % cs.length]} />
            <circle cx={cx - 2} cy={cy - 2} r="2.5" fill="rgba(255,255,255,0.4)" />
          </g>
        );
      })}
    </svg>
  );
}

export function LazoSvg({ color = '#FF69B4', size = 60 }: SvgProps) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="15" cy="12" rx="13" ry="10" fill={color} transform="rotate(-20,15,12)" />
      <ellipse cx="45" cy="12" rx="13" ry="10" fill={color} transform="rotate(20,45,12)" />
      <ellipse cx="15" cy="36" rx="10" ry="8" fill={color} opacity="0.8" transform="rotate(20,15,36)" />
      <ellipse cx="45" cy="36" rx="10" ry="8" fill={color} opacity="0.8" transform="rotate(-20,45,36)" />
      <circle cx="30" cy="24" r="7" fill={color} />
      <ellipse cx="10" cy="12" rx="3" ry="2" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

export function CandelabroSvg({ color = '#C9A96E', size = 60 }: SvgProps) {
  return (
    <svg width={size * 0.7} height={size * 1.2} viewBox="0 0 42 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="50" width="6" height="20" rx="2" fill={color} />
      <ellipse cx="21" cy="48" rx="18" ry="4" fill={color} />
      <rect x="19" y="24" width="4" height="24" rx="2" fill={color} />
      <ellipse cx="21" cy="22" rx="8" ry="3" fill={color} />
      <rect x="19.5" y="10" width="3" height="14" rx="1.5" fill={color} />
      <ellipse cx="21" cy="9" rx="5" ry="2" fill={color} />
      <ellipse cx="21" cy="8" rx="2" ry="4" fill="#FFDD57" opacity="0.9" />
      <ellipse cx="21" cy="6" rx="1" ry="3" fill="#FF8C00" opacity="0.7" />
    </svg>
  );
}

export function MesaTortaSvg({ color = '#C8A882', size = 60 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="38" width="44" height="16" rx="3" fill={color} />
      <rect x="4" y="52" width="52" height="5" rx="2" fill={color} />
      <rect x="16" y="20" width="28" height="20" rx="4" fill="#F5F0E8" />
      <rect x="16" y="20" width="28" height="5" rx="2" fill="#FFB3C1" />
      <rect x="20" y="10" width="20" height="12" rx="3" fill="#FFF" />
      <rect x="20" y="10" width="20" height="4" rx="2" fill="#B2D8FF" />
      <line x1="29" y1="2" x2="29" y2="10" stroke="#888" strokeWidth="1.5" />
      <circle cx="29" cy="2" r="2" fill="#FF6B6B" />
    </svg>
  );
}

export function TelaSvg({ color = '#C9A9E9', size = 60 }: SvgProps) {
  return (
    <svg width={size * 1.2} height={size} viewBox="0 0 72 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0 Q18 40 36 20 Q54 0 72 40 L72 60 L0 60Z" fill={color} opacity="0.85" />
      <path d="M0 0 Q18 40 36 20 Q54 0 72 40" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );
}

export function GlobosMacivosSvg({ color = '#FF6B6B', color2 = '#6BC5FF', color3 = '#FFDD57', size = 60 }: SvgProps) {
  const cs = [color, color2, color3];
  const positions = [
    { cx: 18, cy: 38 }, { cx: 38, cy: 38 }, { cx: 28, cy: 24 },
    { cx: 12, cy: 24 }, { cx: 44, cy: 24 }, { cx: 28, cy: 48 },
  ];
  return (
    <svg width={size} height={size * 1.17} viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      {positions.map((p, i) => (
        <g key={i}>
          <ellipse cx={p.cx} cy={p.cy} rx="11" ry="12" fill={cs[i % cs.length]} />
          <ellipse cx={p.cx - 3} cy={p.cy - 4} rx="3" ry="2.5" fill="rgba(255,255,255,0.35)" />
        </g>
      ))}
      <line x1="28" y1="60" x2="28" y2="65" stroke="#888" strokeWidth="2" />
    </svg>
  );
}

export function CentroMesaSvg({ color = '#FF9ECA', color2 = '#A8E6CF', size = 60 }: SvgProps) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 60 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="18" rx="10" ry="10" fill={color} />
      <ellipse cx="16" cy="26" rx="8" ry="8" fill={color2} />
      <ellipse cx="44" cy="26" rx="8" ry="8" fill={color} />
      <ellipse cx="22" cy="36" rx="7" ry="7" fill={color2} />
      <ellipse cx="38" cy="36" rx="7" ry="7" fill={color} />
      <path d="M20 46 Q30 52 40 46 L42 56 Q30 62 18 56Z" fill="#C8A882" />
    </svg>
  );
}

export function CorazonSvg({ color = '#FF6B9D', size = 60 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 52 C30 52 6 36 6 20 C6 12 12 6 20 6 C24 6 28 9 30 12 C32 9 36 6 40 6 C48 6 54 12 54 20 C54 36 30 52 30 52Z" fill={color} />
      <ellipse cx="22" cy="17" rx="5" ry="4" fill="rgba(255,255,255,0.3)" transform="rotate(-25,22,17)" />
    </svg>
  );
}

export function EstrellaSvg({ color = '#FFD700', size = 60 }: SvgProps) {
  const points5 = Array.from({ length: 5 }, (_, i) => {
    const outer = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    return [
      `${30 + 26 * Math.cos(outer)},${30 + 26 * Math.sin(outer)}`,
      `${30 + 11 * Math.cos(inner)},${30 + 11 * Math.sin(inner)}`,
    ];
  }).flat().join(' ');
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points={points5} fill={color} />
      <ellipse cx="24" cy="22" rx="5" ry="3" fill="rgba(255,255,255,0.35)" transform="rotate(-30,24,22)" />
    </svg>
  );
}

export function MaripozaSvg({ color = '#9C27B0', color2 = '#E91E8C', size = 60 }: SvgProps) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="15" cy="18" rx="13" ry="16" fill={color} transform="rotate(-15,15,18)" />
      <ellipse cx="45" cy="18" rx="13" ry="16" fill={color} transform="rotate(15,45,18)" />
      <ellipse cx="18" cy="34" rx="9" ry="11" fill={color2} opacity="0.85" transform="rotate(10,18,34)" />
      <ellipse cx="42" cy="34" rx="9" ry="11" fill={color2} opacity="0.85" transform="rotate(-10,42,34)" />
      <ellipse cx="30" cy="26" rx="3" ry="12" fill="#222" />
      <line x1="28" y1="14" x2="18" y2="4" stroke="#222" strokeWidth="1.5" />
      <line x1="32" y1="14" x2="42" y2="4" stroke="#222" strokeWidth="1.5" />
      <circle cx="18" cy="4" r="2" fill="#222" />
      <circle cx="42" cy="4" r="2" fill="#222" />
    </svg>
  );
}

export function CoronaSvg({ color = '#FFD700', size = 60 }: SvgProps) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 60 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 38 L4 16 L16 28 L30 6 L44 28 L56 16 L56 38Z" fill={color} />
      <rect x="4" y="34" width="52" height="6" rx="2" fill={color} />
      <circle cx="30" cy="6" r="3" fill="#FF6B6B" />
      <circle cx="4" cy="16" r="3" fill="#6BC5FF" />
      <circle cx="56" cy="16" r="3" fill="#6BC5FF" />
      <ellipse cx="18" cy="24" rx="3" ry="2" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

// Map from tipo to SVG component
export function DecoElementSvg({ tipo, colores, size = 60 }: { tipo: string; colores: string[]; size?: number }) {
  const c0 = colores[0] || '#888888';
  const c1 = colores[1] || '#AAAAAA';
  const c2 = colores[2] || '#CCCCCC';
  switch (tipo) {
    case 'globo': return <GloboSvg color={c0} size={size} />;
    case 'flor': return <FlorSvg color={c0} color2={c1} size={size} />;
    case 'arco': return <ArcoSvg color={c0} color2={c1} color3={c2} size={size} />;
    case 'lazo': return <LazoSvg color={c0} size={size} />;
    case 'candelabro': return <CandelabroSvg color={c0} size={size} />;
    case 'mesaTorta': return <MesaTortaSvg color={c0} size={size} />;
    case 'tela': return <TelaSvg color={c0} size={size} />;
    case 'globosMacizos': return <GlobosMacivosSvg color={c0} color2={c1} color3={c2} size={size} />;
    case 'centroMesa': return <CentroMesaSvg color={c0} color2={c1} size={size} />;
    case 'corazon': return <CorazonSvg color={c0} size={size} />;
    case 'estrella': return <EstrellaSvg color={c0} size={size} />;
    case 'mariposa': return <MaripozaSvg color={c0} color2={c1} size={size} />;
    case 'corona': return <CoronaSvg color={c0} size={size} />;
    default: return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, background: 'rgba(0,0,0,0.05)', borderRadius: 8 }}>
        🎪
      </div>
    );
  }
}
