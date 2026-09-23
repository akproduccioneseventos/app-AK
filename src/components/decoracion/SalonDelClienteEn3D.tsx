'use client';

import React from 'react';
import { Salon3DClienteView, type Salon3DClienteViewProps } from '@/components/salon-3d/Salon3DClienteView';
import type { DecoracionData } from '@/types/fiesta';

export interface SalonDelClienteEn3DProps extends Salon3DClienteViewProps {
  decoracion?: DecoracionData | null;
  fotoFallbackUrl?: string;
  className?: string;
  titulo?: string;
  subtitulo?: string;
  mostrarEncabezado?: boolean;
}

/**
 * Componente unificado para la visualización del salón en 3D en los portales del cliente.
 * (Orden 77 — La decoración vive en un solo lugar).
 *
 * Utilizado tanto en el portal directo `/portal/[fiestaId]/decoracion` como en el portal
 * con clave privada `/portal/c/[accessKey]`.
 */
export function SalonDelClienteEn3D(props: SalonDelClienteEn3DProps) {
  return <Salon3DClienteView {...props} />;
}

export default SalonDelClienteEn3D;
