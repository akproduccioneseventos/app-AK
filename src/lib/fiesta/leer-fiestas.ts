import fs from 'fs/promises';
import path from 'path';

import { readData } from '@/lib/data-service';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * La lectura cruda de las fiestas, SIN comprobar quien pregunta.
 *
 * Por que existe: `getFiestas()` vive en un archivo de servidor, y ahi cada funcion
 * exportada es una direccion que cualquiera de internet puede llamar. Devolvia
 * **todas** las fiestas con el cliente, su telefono, el presupuesto y la lista de
 * invitados, sin pedir cuenta. Ahora esa puerta pide sesion.
 *
 * Pero hay pantallas que un desconocido tiene que poder abrir y que igual necesitan
 * mirar las fiestas por dentro: el simulador, para decir si una fecha esta libre; el
 * portal del cliente, que entra con su clave. Esas usan esta lectura, que **no es
 * una direccion de internet** porque este archivo no es de servidor: solo se puede
 * llamar desde adentro, despues de que la funcion publica hizo su propio control.
 */
const FIESTAS_DIR = 'fiestas';
const ARCHIVE_DIR = 'archive';

function soloJsonLocal(): boolean {
  return process.env.AK_USE_LOCAL_JSON_ONLY === 'true';
}

async function leerCarpetaLocal(directory: string): Promise<FiestaEnPlanificacion[]> {
  const fileNames = new Set<string>();
  const candidates = [
    path.join(process.cwd(), 'data', directory),
    path.join(process.cwd(), 'src', 'data', directory),
  ];

  for (const candidate of candidates) {
    try {
      const entries = await fs.readdir(candidate);
      entries.filter((file) => file.endsWith('.json')).forEach((file) => fileNames.add(file));
    } catch {
      // La carpeta es opcional en local y en las pruebas.
    }
  }

  const fiestas = await Promise.all(
    [...fileNames].map((file) => readData<FiestaEnPlanificacion | null>(path.join(directory, file), null)),
  );
  return fiestas.filter((fiesta): fiesta is FiestaEnPlanificacion => fiesta !== null);
}

async function leerColeccion(directory: string): Promise<FiestaEnPlanificacion[]> {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

  if (!soloJsonLocal()) {
    try {
      const { isFirebaseAvailable } = await import('@/lib/firebase');
      if (isProduction || isFirebaseAvailable()) {
        const { listCollectionFromFirestore } = await import('@/lib/firebase-sync');
        return (await listCollectionFromFirestore(directory)) as FiestaEnPlanificacion[];
      }
    } catch {
      // Si la base no contesta, se sigue con los archivos locales.
    }
  }

  return leerCarpetaLocal(directory);
}

/** Las fiestas archivadas, sin comprobar quien pregunta. */
export async function leerHistorialCrudo(): Promise<FiestaEnPlanificacion[]> {
  const historiales = await leerColeccion(ARCHIVE_DIR);
  return Array.from(new Map(historiales.map((f) => [f.id, f])).values())
    .sort(
      (a, b) =>
        new Date(b.configuracion.fechaEvento || 0).getTime()
        - new Date(a.configuracion.fechaEvento || 0).getTime(),
    );
}

/** Todas las fiestas, sin comprobar quien pregunta. */
export async function leerFiestasCrudas(includeArchived = true): Promise<FiestaEnPlanificacion[]> {
  const activas = await leerColeccion(FIESTAS_DIR);
  const archivadas = includeArchived ? await leerHistorialCrudo() : [];
  const activasFiltradas = activas.filter((f) => f.estado !== 'Archivado');
  const todas = [...activasFiltradas, ...archivadas];
  return Array.from(new Map(todas.map((item) => [item.id, item])).values());
}
