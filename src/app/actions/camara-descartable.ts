'use server';

import { readData, writeData } from '@/lib/data-service';

export interface FotoDescartable {
  id: string;
  fiestaId: string;
  autor: string;
  mesa?: string;
  fotoUrlOrBase64: string;
  filtroVintage: 'kodak_gold' | 'fuji_90s' | 'black_and_white';
  caption?: string;
  sacadaAt: string;
  reveladoAt: string; // ISO String (Domingo 12:00 hs)
}

const FOTOS_DESCARTABLES_FILE = 'fiesta-fotos-descartables.json';

function calcularProximoDomingoMediodia(): string {
  const d = new Date();
  const diaSemana = d.getDay(); // 0 es Domingo
  const diasHastaDomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
  const domingo = new Date(d.getTime() + diasHastaDomingo * 24 * 60 * 60 * 1000);
  domingo.setHours(12, 0, 0, 0);
  // Si ya pasó el mediodía del domingo, pasa al siguiente
  if (domingo.getTime() <= d.getTime()) {
    domingo.setDate(domingo.getDate() + 7);
  }
  return domingo.toISOString();
}

export async function getFotosDescartablesAction(fiestaId: string): Promise<{
  success: boolean;
  fotos?: FotoDescartable[];
  reveladas: boolean;
  reveladoAt: string;
}> {
  try {
    const list = await readData<FotoDescartable[]>(FOTOS_DESCARTABLES_FILE, []);
    const filtered = list.filter((f) => f.fiestaId === fiestaId);
    const ahora = new Date().getTime();
    const reveladoAt = filtered[0]?.reveladoAt || calcularProximoDomingoMediodia();
    const reveladas = ahora >= new Date(reveladoAt).getTime();

    return {
      success: true,
      fotos: filtered,
      reveladas,
      reveladoAt,
    };
  } catch {
    return {
      success: false,
      fotos: [],
      reveladas: false,
      reveladoAt: calcularProximoDomingoMediodia(),
    };
  }
}

export async function guardarFotoDescartableAction(params: {
  fiestaId: string;
  autor: string;
  mesa?: string;
  fotoUrlOrBase64: string;
  filtroVintage?: FotoDescartable['filtroVintage'];
  caption?: string;
}): Promise<{ success: boolean; foto?: FotoDescartable; reveladoAt?: string; error?: string }> {
  try {
    const list = await readData<FotoDescartable[]>(FOTOS_DESCARTABLES_FILE, []);
    const reveladoAt = calcularProximoDomingoMediodia();

    const nueva: FotoDescartable = {
      id: `retro_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      fiestaId: params.fiestaId,
      autor: (params.autor || 'Invitado').trim(),
      mesa: params.mesa?.trim(),
      fotoUrlOrBase64: params.fotoUrlOrBase64,
      filtroVintage: params.filtroVintage || 'kodak_gold',
      caption: params.caption?.trim(),
      sacadaAt: new Date().toISOString(),
      reveladoAt,
    };

    list.unshift(nueva);
    await writeData(FOTOS_DESCARTABLES_FILE, list);

    return { success: true, foto: nueva, reveladoAt };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar foto descartable.' };
  }
}
