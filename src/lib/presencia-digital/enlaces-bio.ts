import 'server-only';

import { mutateGenericJsonArray, readGenericJsonFile } from '@/lib/generic-json-store';
import { hoyEnUruguay } from '@/lib/utils';

export interface EnlaceClicRegistro {
  boton: string;
  fecha: string; // YYYY-MM-DD
  clicks: number;
}

const ENLACES_CLICS_FILE = 'marketing-enlaces-clics.json';

export async function registrarClicEnlace(boton: string): Promise<void> {
  const hoy = hoyEnUruguay();
  await mutateGenericJsonArray<EnlaceClicRegistro>(ENLACES_CLICS_FILE, (lista) => {
    const arr = Array.isArray(lista) ? [...lista] : [];
    const idx = arr.findIndex((item) => item.boton === boton && item.fecha === hoy);
    if (idx >= 0) {
      arr[idx] = {
        ...arr[idx],
        clicks: (arr[idx].clicks || 0) + 1,
      };
    } else {
      arr.push({
        boton,
        fecha: hoy,
        clicks: 1,
      });
    }
    return arr;
  });
}

export async function obtenerClicsEnlaces(): Promise<EnlaceClicRegistro[]> {
  const lista = (await readGenericJsonFile(ENLACES_CLICS_FILE)) as EnlaceClicRegistro[] | null;
  return Array.isArray(lista) ? lista : [];
}
