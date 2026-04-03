import type { SimV2TipoEvento, SimV2Paquete } from '@/types/simulador-v2';

export const SIM_V2_BASE_RATES: Record<SimV2TipoEvento, { perPerson: number; base: number }> = {
  'Cumpleaños': { perPerson: 800, base: 5000 },
  '15 años': { perPerson: 950, base: 8000 },
  'Boda': { perPerson: 1100, base: 12000 },
  'Evento empresarial': { perPerson: 750, base: 6000 },
};

export const SIM_V2_PACKAGE_MULTIPLIERS: Record<SimV2Paquete, number> = {
  'Básico': 0.85,
  'Intermedio': 1.0,
  'Premium': 1.3,
};

export const SIM_V2_DISCOUNT_PERCENTAGE = 20;
