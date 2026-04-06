// @ts-nocheck
'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { LayoutElement } from '@/types/fiesta';

interface Mesa3DProps {
  element: LayoutElement;
  pixelsPerMeter: number;
  position: [number, number, number];
  primaryColor?: string;
}

const SCALE = 0.01; // Convert pixels to 3D units (1px = 0.01 unit)

function SillaRedonda({ angle, radius }: { angle: number; radius: number }) {
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  return (
    <group position={[x, 0, z]}>
      {/* Silla base */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.15, 0.08, 8]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.7} />
      </mesh>
      {/* Respaldo */}
      <mesh position={[0, 0.6, -0.12]} castShadow>
        <boxGeometry args={[0.32, 0.45, 0.05]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.7} />
      </mesh>
      {/* Pata */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.28, 6]} />
        <meshStandardMaterial color="#4a3728" roughness={0.8} />
      </mesh>
    </group>
  );
}

function SillaRectangular({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.14, 0.07, 6]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.6, -0.1]} castShadow>
        <boxGeometry args={[0.28, 0.4, 0.05]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.26, 6]} />
        <meshStandardMaterial color="#4a3728" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function Mesa3D({ element, pixelsPerMeter, position, primaryColor = '#d4a853' }: Mesa3DProps) {
  const isRound = element.shape === 'circle';
  const widthM = (element.width || 80) / pixelsPerMeter;
  const heightM = (element.height || 80) / pixelsPerMeter;
  const seats = element.seats || 8;
  const tableRadius = Math.min(widthM, heightM) / 2;

  if (isRound) {
    const chairRadius = tableRadius + 0.55;
    return (
      <group position={position}>
        {/* Mesa cilíndrica */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[tableRadius, tableRadius * 0.95, 0.07, 32]} />
          <meshStandardMaterial color={element.backgroundColor || primaryColor} roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Mantel */}
        <mesh position={[0, 0.74, 0]}>
          <cylinderGeometry args={[tableRadius + 0.05, tableRadius + 0.05, 0.02, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} opacity={0.85} transparent />
        </mesh>
        {/* Pata */}
        <mesh position={[0, 0.37, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.76, 8]} />
          <meshStandardMaterial color="#6b4c2a" roughness={0.8} />
        </mesh>
        {/* Base */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[tableRadius * 0.5, tableRadius * 0.55, 0.04, 16]} />
          <meshStandardMaterial color="#4a3728" roughness={0.8} />
        </mesh>
        {/* Sillas */}
        {Array.from({ length: seats }).map((_, i) => {
          const angle = (i / seats) * Math.PI * 2;
          return <SillaRedonda key={i} angle={angle} radius={chairRadius} />;
        })}
        {/* Label */}
        <mesh position={[0, 0.82, 0]}>
          <circleGeometry args={[tableRadius * 0.4, 16]} />
          <meshStandardMaterial color="#333333" roughness={1} />
        </mesh>
      </group>
    );
  }

  // Mesa rectangular
  const halfW = widthM / 2;
  const halfH = heightM / 2;
  const chairsPerLong = Math.max(1, Math.floor(seats / 2 * (widthM / (widthM + heightM))));
  const chairsPerShort = Math.max(0, Math.floor((seats - chairsPerLong * 2) / 2));

  const chairs: { x: number; z: number }[] = [];
  // Long sides
  for (let i = 0; i < chairsPerLong; i++) {
    const fx = -halfW + halfW / chairsPerLong + (i * widthM) / chairsPerLong;
    chairs.push({ x: fx, z: -halfH - 0.55 });
    chairs.push({ x: fx, z: halfH + 0.55 });
  }
  // Short sides
  for (let i = 0; i < chairsPerShort; i++) {
    const fz = -halfH + halfH / chairsPerShort + (i * heightM) / chairsPerShort;
    chairs.push({ x: -halfW - 0.55, z: fz });
    chairs.push({ x: halfW + 0.55, z: fz });
  }

  return (
    <group position={position}>
      {/* Tabla */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[widthM, 0.07, heightM]} />
        <meshStandardMaterial color={element.backgroundColor || primaryColor} roughness={0.4} metalness={0.05} />
      </mesh>
      {/* Mantel */}
      <mesh position={[0, 0.74, 0]}>
        <boxGeometry args={[widthM + 0.08, 0.02, heightM + 0.08]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} opacity={0.85} transparent />
      </mesh>
      {/* Patas */}
      {[[-halfW + 0.1, halfH - 0.1], [-halfW + 0.1, -halfH + 0.1], [halfW - 0.1, halfH - 0.1], [halfW - 0.1, -halfH + 0.1]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.37, pz]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.76, 6]} />
          <meshStandardMaterial color="#6b4c2a" roughness={0.8} />
        </mesh>
      ))}
      {/* Sillas */}
      {chairs.map((c, i) => (
        <SillaRectangular key={i} x={c.x} z={c.z} />
      ))}
    </group>
  );
}
