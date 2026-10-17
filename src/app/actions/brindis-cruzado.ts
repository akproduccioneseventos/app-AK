'use server';

import { readData, writeData } from '@/lib/data-service';

export interface BrindisCruzado {
  id: string;
  fiestaId: string;
  mesaOrigen: string; // ej: "Mesa 4"
  mesaDestino: string; // ej: "Mesa 9" o "Toda la Fiesta"
  remitente: string; // ej: "Los amigos de la facultad"
  tragoOBrindis: string; // ej: "Fernet con Coca", "Mojito", "Champagne"
  dedicatoria: string; // ej: "¡Salud por los novios y que la noche no termine!"
  createdAt: string;
  mostradoEnPantalla?: boolean;
}

const BRINDIS_FILE = 'fiesta-brindis.json';

export async function getBrindisActivosAction(fiestaId: string): Promise<{
  success: boolean;
  brindis?: BrindisCruzado[];
}> {
  try {
    const list = await readData<BrindisCruzado[]>(BRINDIS_FILE, []);
    const filtered = list.filter((b) => b.fiestaId === fiestaId);
    return { success: true, brindis: filtered.slice(0, 30) };
  } catch {
    return { success: false, brindis: [] };
  }
}

export async function enviarBrindisCruzadoAction(params: {
  fiestaId: string;
  mesaOrigen: string;
  mesaDestino: string;
  remitente: string;
  tragoOBrindis: string;
  dedicatoria: string;
}): Promise<{ success: boolean; brindis?: BrindisCruzado; error?: string }> {
  try {
    const list = await readData<BrindisCruzado[]>(BRINDIS_FILE, []);
    const nuevo: BrindisCruzado = {
      id: `brindis_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      fiestaId: params.fiestaId,
      mesaOrigen: params.mesaOrigen.trim() || 'Mesa Invitada',
      mesaDestino: params.mesaDestino.trim() || 'Toda la Fiesta',
      remitente: params.remitente.trim() || 'Invitados',
      tragoOBrindis: params.tragoOBrindis.trim() || 'Brindis de Fiesta',
      dedicatoria: params.dedicatoria.trim() || '¡Salud!',
      createdAt: new Date().toISOString(),
      mostradoEnPantalla: true,
    };
    list.unshift(nuevo);
    await writeData(BRINDIS_FILE, list);
    return { success: true, brindis: nuevo };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al enviar brindis.' };
  }
}
