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
  const onReadyRef = useRef<(ref: SalonSceneRef) => void>(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    onReadyRef.current({
      captureScreenshot: () => {
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
      }
    });
  }, [gl, scene, camera]); // onReadyRef.current is stable so no dep needed

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
  const rotRad = -((element.rotation || 0) * Math.PI) / 180;
  const cat = (element.category || '').toLowerCase();
  const name = (element.name || '').toLowerCase();

  if (cat.includes('pista') || name.includes('pista')) {
    return (
      <group position={pos3D} rotation={[0, rotRad, 0]}>
        <PistaBaile3D position={[0, 0, 0]} width={widthM} depth={depthM} primaryColor={primaryColor} />
      </group>
    );
  }
  if (cat.includes('escenario') || name.includes('escenario')) {
    return (
      <group position={pos3D} rotation={[0, rotRad, 0]}>
        <Escenario3D position={[0, 0, 0]} width={widthM} depth={depthM} />
      </group>
    );
  }
  if (cat.includes('barra') || cat.includes('bar') || cat.includes('dj') || name.includes('barra') || name.includes('dj')) {
    return (
      <group position={pos3D} rotation={[0, rotRad, 0]}>
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
  if (cat.includes('living') || name.includes('living')) {
    return (
      <group position={pos3D} rotation={[0, rotRad, 0]}>
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
  if (cat.includes('arco') || name.includes('arco')) {
    return (
      <group position={pos3D} rotation={[0, rotRad, 0]}>
        <Arco3D width={widthM} height={Math.max(2.2, depthM * 1.5)} color={element.backgroundColor} />
      </group>
    );
  }
  if (cat.includes('pedestal') || name.includes('pedestal') || cat.includes('columna') || name.includes('columna')) {
    return (
      <group position={pos3D} rotation={[0, rotRad, 0]}>
        <Pedestal3D width={widthM} depth={depthM} height={1.2} color={element.backgroundColor} />
      </group>
    );
  }
  if (cat.includes('panel') || name.includes('panel') || cat.includes('neon') || name.includes('neon') || cat.includes('backdrop') || cat.includes('fondo') || cat.includes('pantalla')) {
    return (
      <group position={pos3D} rotation={[0, rotRad, 0]}>
        <PanelDecorativo3D width={widthM} height={Math.max(2.0, depthM)} color={element.backgroundColor} />
      </group>
    );
  }

  // Mesa: solo si explicitamente es mesa o si tiene asientos configurados
  if (cat.includes('mesa') || name.includes('mesa') || (!cat && (element.seats || 0) > 0)) {
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
    <group position={pos3D} rotation={[0, rotRad, 0]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[widthM, 0.1, depthM]} />
        <meshStandardMaterial
          color={element.backgroundColor || '#e2e8f0'}
          roughness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

export function Arco3D({ width = 2, height = 2.4, color = '#ec4899' }: { width?: number; height?: number; color?: string }) {
  const radius = Math.max(0.6, width / 2);
  const tubeRadius = 0.15;
  return (
    <group>
      <mesh position={[0, height - radius, 0]} castShadow>
        <torusGeometry args={[radius, tubeRadius, 16, 32, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
      {height > radius && (
        <>
          <mesh position={[-radius, (height - radius) / 2, 0]} castShadow>
            <cylinderGeometry args={[tubeRadius, tubeRadius, height - radius, 16]} />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[radius, (height - radius) / 2, 0]} castShadow>
            <cylinderGeometry args={[tubeRadius, tubeRadius, height - radius, 16]} />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
          </mesh>
        </>
      )}
      <mesh position={[-radius, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 0.1, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      <mesh position={[radius, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 0.1, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function Pedestal3D({ width = 0.5, depth = 0.5, height = 1.1, color = '#f8fafc' }: { width?: number; depth?: number; height?: number; color?: string }) {
  const radius = Math.min(width, depth) / 2;
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 24]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, height + 0.02, 0]}>
        <cylinderGeometry args={[radius + 0.05, radius + 0.05, 0.04, 24]} />
        <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

export function PanelDecorativo3D({ width = 2, height = 2.2, color = '#1e293b' }: { width?: number; height?: number; color?: string }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[-width * 0.35, 0.05, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.6]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <mesh position={[width * 0.35, 0.05, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.6]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function elegirObjeto3D(element: LayoutElement): React.ComponentType<any> | null {
  const cat = (element.category || '').toLowerCase();
  const name = (element.name || '').toLowerCase();

  if (cat.includes('pista') || name.includes('pista')) return PistaBaile3D;
  if (cat.includes('escenario') || name.includes('escenario')) return Escenario3D;
  if (cat.includes('arco') || name.includes('arco')) return Arco3D;
  if (cat.includes('pedestal') || name.includes('pedestal') || cat.includes('columna') || name.includes('columna')) return Pedestal3D;
  if (cat.includes('panel') || name.includes('panel') || cat.includes('neon') || name.includes('neon') || cat.includes('backdrop') || cat.includes('fondo') || cat.includes('pantalla')) return PanelDecorativo3D;
  if (cat.includes('mesa') || name.includes('mesa') || (!cat && (element.seats || 0) > 0)) {
    return Mesa3D;
  }
  return null;
}

export function calcularDimensiones3DConRotacion(
  element: LayoutElement,
  pixelsPerMeter: number = 40
): { anchoX: number; profundidadZ: number } {
  const ppm = pixelsPerMeter || 40;
  const w = (element.width || 80) / ppm;
  const d = (element.height || 80) / ppm;
  const rotRad = -((element.rotation || 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rotRad));
  const sin = Math.abs(Math.sin(rotRad));
  return {
    anchoX: Number((w * cos + d * sin).toFixed(3)),
    profundidadZ: Number((w * sin + d * cos).toFixed(3)),
  };
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
export function SalonScene({ decoracion, onCapture, captureRef }: SalonSceneProps) {
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

export default SalonScene;

