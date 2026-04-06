// @ts-nocheck
'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface PistaBaile3DProps {
  position: [number, number, number];
  width: number;
  depth: number;
  primaryColor?: string;
}

export function PistaBaile3D({ position, width, depth, primaryColor = '#38bdf8' }: PistaBaile3DProps) {
  const meshRef = useRef<any>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      meshRef.current.material.emissiveIntensity = 0.15 + Math.sin(t * 1.5) * 0.08;
    }
  });

  // Checkered dance floor
  const tiles: { x: number; z: number; color: string }[] = [];
  const tileSize = Math.min(width, depth) / 4;
  const tilesX = Math.ceil(width / tileSize);
  const tilesZ = Math.ceil(depth / tileSize);

  for (let i = 0; i < tilesX; i++) {
    for (let j = 0; j < tilesZ; j++) {
      const isEven = (i + j) % 2 === 0;
      tiles.push({
        x: -width / 2 + (i + 0.5) * tileSize,
        z: -depth / 2 + (j + 0.5) * tileSize,
        color: isEven ? '#111827' : '#1e3a5f',
      });
    }
  }

  return (
    <group position={position}>
      {/* Base reflectiva */}
      <mesh ref={meshRef} position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[width, 0.04, depth]} />
        <meshStandardMaterial
          color={primaryColor}
          roughness={0.05}
          metalness={0.8}
          emissive={primaryColor}
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Tiles */}
      {tiles.map((tile, i) => (
        <mesh key={i} position={[tile.x, 0.03, tile.z]}>
          <boxGeometry args={[tileSize * 0.96, 0.01, tileSize * 0.96]} />
          <meshStandardMaterial color={tile.color} roughness={0.1} metalness={0.7} />
        </mesh>
      ))}
      {/* Borde */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[width + 0.1, 0.02, depth + 0.1]} />
        <meshStandardMaterial color="#ffd700" roughness={0.3} metalness={0.9} emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Luz de pista */}
      <pointLight position={[0, 3, 0]} intensity={2} color={primaryColor} distance={Math.max(width, depth) * 2} />
    </group>
  );
}
