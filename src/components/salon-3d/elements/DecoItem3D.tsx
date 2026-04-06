// @ts-nocheck
'use client';

import React from 'react';
import type { DecoItem } from '@/types/fiesta';

interface DecoItem3DProps {
  item: DecoItem;
  position: [number, number, number];
}

function Globo({ color = '#ff6b9d', x = 0, z = 0 }: { color?: string; x?: number; z?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 1.2, 4]} />
        <meshStandardMaterial color="#999999" roughness={0.9} />
      </mesh>
    </group>
  );
}

function FloresDeCoracion({ color = '#ff69b4' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#7c5c3e" roughness={0.9} />
      </mesh>
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const r = 0.15;
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={i} position={[Math.cos(rad) * r, 0.85, Math.sin(rad) * r]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffdd57" roughness={0.4} />
      </mesh>
    </group>
  );
}

function CentroMesa({ color = '#d4a853' }: { color?: string }) {
  return (
    <group>
      {/* Candelabro */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 1, 8]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Vela */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#fffde7" roughness={0.9} />
      </mesh>
      {/* Llama */}
      <pointLight position={[0, 1.3, 0]} intensity={0.8} color="#ff9500" distance={2} />
    </group>
  );
}

export function DecoItem3D({ item, position }: DecoItem3DProps) {
  const color = item.color || '#ff6b9d';
  const categoria = (item.categoria || '').toLowerCase();

  return (
    <group position={position}>
      {categoria.includes('globo') && (
        <group>
          {Array.from({ length: Math.min(item.cantidad || 1, 5) }).map((_, i) => (
            <Globo key={i} color={color} x={(i - 2) * 0.22} z={0} />
          ))}
        </group>
      )}
      {(categoria.includes('flor') || categoria.includes('planta')) && (
        <FloresDeCoracion color={color} />
      )}
      {(categoria.includes('centro') || categoria.includes('vela') || categoria.includes('candelabro')) && (
        <CentroMesa color={color} />
      )}
      {!categoria.includes('globo') && !categoria.includes('flor') && !categoria.includes('planta') &&
       !categoria.includes('centro') && !categoria.includes('vela') && !categoria.includes('candelabro') && (
        // Generic decoration item
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}
