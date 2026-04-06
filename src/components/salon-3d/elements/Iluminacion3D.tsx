// @ts-nocheck
'use client';

import React from 'react';

interface Iluminacion3DProps {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export function Iluminacion3D({
  primaryColor = '#ffffff',
  secondaryColor = '#ffd8a8',
  accentColor = '#a8c8ff',
}: Iluminacion3DProps) {
  return (
    <>
      <ambientLight intensity={0.6} color={primaryColor} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        color={secondaryColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[-10, 15, -10]}
        intensity={0.5}
        color={accentColor}
      />
      <pointLight position={[0, 8, 0]} intensity={0.8} color={secondaryColor} distance={30} />
      <hemisphereLight skyColor={primaryColor} groundColor="#888888" intensity={0.4} />
    </>
  );
}
