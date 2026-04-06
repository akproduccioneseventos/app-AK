// @ts-nocheck
'use client';

import React from 'react';

interface Escenario3DProps {
  position: [number, number, number];
  width: number;
  depth: number;
}

export function Escenario3D({ position, width, depth }: Escenario3DProps) {
  return (
    <group position={position}>
      {/* Plataforma principal */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.5, depth]} />
        <meshStandardMaterial color="#4b3621" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Superficie */}
      <mesh position={[0, 0.51, 0]}>
        <boxGeometry args={[width, 0.02, depth]} />
        <meshStandardMaterial color="#2d1f10" roughness={0.4} />
      </mesh>
      {/* Escalones frontales */}
      <mesh position={[0, 0.12, depth / 2 + 0.3]} castShadow>
        <boxGeometry args={[width * 0.6, 0.24, 0.4]} />
        <meshStandardMaterial color="#3d2a15" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.05, depth / 2 + 0.55]} castShadow>
        <boxGeometry args={[width * 0.5, 0.1, 0.3]} />
        <meshStandardMaterial color="#3d2a15" roughness={0.7} />
      </mesh>
      {/* Cortinas laterales */}
      <mesh position={[-width / 2 - 0.05, 0.9, 0]}>
        <boxGeometry args={[0.08, 1.4, depth]} />
        <meshStandardMaterial color="#8b0000" roughness={0.9} />
      </mesh>
      <mesh position={[width / 2 + 0.05, 0.9, 0]}>
        <boxGeometry args={[0.08, 1.4, depth]} />
        <meshStandardMaterial color="#8b0000" roughness={0.9} />
      </mesh>
      {/* Iluminación de escenario */}
      <spotLight
        position={[0, 5, -depth]}
        target-position={[0, 0.5, 0]}
        intensity={3}
        angle={0.4}
        penumbra={0.3}
        color="#ffe8a0"
        castShadow
      />
    </group>
  );
}
