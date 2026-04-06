// @ts-nocheck
'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import type { DecoracionData, LayoutElement } from '@/types/fiesta';
import { Mesa3D } from './elements/Mesa3D';
import { PistaBaile3D } from './elements/PistaBaile3D';
import { Escenario3D } from './elements/Escenario3D';
import { DecoItem3D } from './elements/DecoItem3D';
import { Iluminacion3D } from './elements/Iluminacion3D';

// --- Types ---
export interface SalonSceneRef {
  captureScreenshot: () => string | null;
}

interface SalonSceneProps {
  decoracion: DecoracionData;
  onCapture?: (dataUrl: string) => void;
  captureRef?: React.MutableRefObject<SalonSceneRef | null>;
}

// --- Camera capture helper ---
function CaptureHelper({ onReady }: { onReady: (ref: SalonSceneRef) => void }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    onReady({
      captureScreenshot: () => {
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
      }
    });
  }, [gl, scene, camera, onReady]);

  return null;
}

// --- 3D element renderer ---
function SalonElement({
  element,
  pixelsPerMeter,
  salonWidth,
  salonHeight,
  primaryColor,
}: {
  element: LayoutElement;
  pixelsPerMeter: number;
  salonWidth: number;
  salonHeight: number;
  primaryColor?: string;
}) {
  const ppm = pixelsPerMeter || 40;
  const sW = salonWidth || 15;
  const sH = salonHeight || 15;

  // Convert 2D canvas position (pixels) to 3D world coordinates
  // 2D: origin top-left, Y grows down
  // 3D: origin center, Z grows toward camera
  const worldX = element.x / ppm - sW / 2 + (element.width || 0) / ppm / 2;
  const worldZ = element.y / ppm - sH / 2 + (element.height || 0) / ppm / 2;
  const pos3D: [number, number, number] = [worldX, 0, worldZ];

  const widthM = (element.width || 80) / ppm;
  const depthM = (element.height || 80) / ppm;
  const cat = (element.category || '').toLowerCase();

  if (cat.includes('pista')) {
    return <PistaBaile3D position={pos3D} width={widthM} depth={depthM} primaryColor={primaryColor} />;
  }
  if (cat.includes('escenario')) {
    return <Escenario3D position={pos3D} width={widthM} depth={depthM} />;
  }
  if (cat.includes('barra') || cat.includes('bar') || cat.includes('dj')) {
    return (
      <group position={pos3D}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[widthM, 1.1, depthM]} />
          <meshStandardMaterial color="#5d4037" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[widthM + 0.1, 0.06, depthM + 0.1]} />
          <meshStandardMaterial color="#4a2c0a" roughness={0.3} metalness={0.3} />
        </mesh>
      </group>
    );
  }
  if (cat.includes('living')) {
    return (
      <group position={pos3D}>
        {/* Sofá */}
        <mesh position={[0, 0.25, -depthM / 2 + 0.3]} castShadow>
          <boxGeometry args={[widthM * 0.9, 0.5, 0.6]} />
          <meshStandardMaterial color="#7c6f64" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.55, -depthM / 2 + 0.1]} castShadow>
          <boxGeometry args={[widthM * 0.9, 0.6, 0.15]} />
          <meshStandardMaterial color="#7c6f64" roughness={0.8} />
        </mesh>
        {/* Mesa de centro */}
        <mesh position={[0, 0.22, 0.1]} castShadow>
          <boxGeometry args={[widthM * 0.4, 0.44, depthM * 0.35]} />
          <meshStandardMaterial color="#8b7355" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.46, 0.1]}>
          <boxGeometry args={[widthM * 0.45, 0.04, depthM * 0.4]} />
          <meshStandardMaterial color="#5d4037" roughness={0.3} metalness={0.2} />
        </mesh>
      </group>
    );
  }

  // Default: Mesa (redonda o rectangular)
  if (cat.includes('mesa') || element.type === 'element') {
    return (
      <Mesa3D
        element={element}
        pixelsPerMeter={ppm}
        position={pos3D}
        primaryColor={primaryColor}
      />
    );
  }

  // Generic area/element
  return (
    <mesh position={[pos3D[0], 0.05, pos3D[2]]} receiveShadow>
      <boxGeometry args={[widthM, 0.1, depthM]} />
      <meshStandardMaterial
        color={element.backgroundColor || '#e2e8f0'}
        roughness={0.8}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

// --- Walls ---
function SalonWalls({ width, depth }: { width: number; depth: number }) {
  const wallHeight = 3.5;
  const wallThickness = 0.1;
  const wallColor = '#f8f5f0';
  const wallOpacity = 0.25;

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, wallHeight / 2, -depth / 2]} castShadow>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} transparent opacity={wallOpacity} />
      </mesh>
      {/* Front wall */}
      <mesh position={[0, wallHeight / 2, depth / 2]}>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} transparent opacity={0.1} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-width / 2, wallHeight / 2, 0]} castShadow>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} transparent opacity={wallOpacity} />
      </mesh>
      {/* Right wall */}
      <mesh position={[width / 2, wallHeight / 2, 0]} castShadow>
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} transparent opacity={wallOpacity} />
      </mesh>
    </group>
  );
}

// --- Floor ---
function SalonFloor({ width, depth, primaryColor }: { width: number; depth: number; primaryColor?: string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Floor border accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[width - 0.1, depth - 0.1]} />
        <meshStandardMaterial color={primaryColor || '#e8ddd0'} roughness={0.7} metalness={0.1} opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

// --- Main Scene content ---
function SceneContent({
  decoracion,
  captureRef,
}: {
  decoracion: DecoracionData;
  captureRef?: React.MutableRefObject<SalonSceneRef | null>;
}) {
  const salonWidth = decoracion.salonWidth || 15;
  const salonHeight = decoracion.salonHeight || 15;
  const ppm = decoracion.pixelsPerMeter || 40;
  const primaryColor = decoracion.paletaColores?.primary || decoracion.colorPalette?.primary || '#d4a853';
  const secondaryColor = decoracion.paletaColores?.secondary || decoracion.colorPalette?.secondary || '#ffd8a8';
  const accentColor = decoracion.paletaColores?.accent || decoracion.colorPalette?.accent || '#a8c8ff';

  const elements = (decoracion.salonElements || []).filter(
    el => el && el.id && typeof el.x === 'number' && typeof el.y === 'number'
  );

  const decoItems = decoracion.itemsDecoracion || [];

  return (
    <>
      <CaptureHelper onReady={(ref) => { if (captureRef) captureRef.current = ref; }} />

      <Iluminacion3D
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />

      <SalonFloor width={salonWidth} depth={salonHeight} primaryColor={primaryColor} />
      <SalonWalls width={salonWidth} depth={salonHeight} />

      <Grid
        args={[salonWidth, salonHeight]}
        position={[0, 0.005, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#c8c0b8"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#a89880"
        fadeDistance={40}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {elements.map(el => (
        <SalonElement
          key={el.id}
          element={el}
          pixelsPerMeter={ppm}
          salonWidth={salonWidth}
          salonHeight={salonHeight}
          primaryColor={primaryColor}
        />
      ))}

      {/* Render deco items at center of tables */}
      {elements.filter(el => (el.category || '').toLowerCase().includes('mesa')).map((mesa, i) => {
        const worldX = mesa.x / ppm - salonWidth / 2 + (mesa.width || 0) / ppm / 2;
        const worldZ = mesa.y / ppm - salonHeight / 2 + (mesa.height || 0) / ppm / 2;
        const centerItem = decoItems.find(di =>
          di.categoria?.toLowerCase().includes('centro') ||
          di.categoria?.toLowerCase().includes('flor') ||
          di.categoria?.toLowerCase().includes('vela')
        );
        if (!centerItem) return null;
        return (
          <DecoItem3D
            key={`decoitem_${mesa.id}`}
            item={centerItem}
            position={[worldX, 0.77, worldZ]}
          />
        );
      })}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={Math.max(salonWidth, salonHeight) * 1.5}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

// --- Exported component ---
export default function SalonScene({ decoracion, onCapture, captureRef }: SalonSceneProps) {
  return (
    <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-slate-900">
      <Canvas
        shadows
        camera={{
          position: [
            (decoracion.salonWidth || 15) * 0.6,
            (decoracion.salonWidth || 15) * 0.5,
            (decoracion.salonHeight || 15) * 0.8,
          ],
          fov: 50,
        }}
        gl={{ preserveDrawingBuffer: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <fog attach="fog" args={['#f8f5f0', 20, 60]} />
        <SceneContent decoracion={decoracion} captureRef={captureRef} />
      </Canvas>
    </div>
  );
}
