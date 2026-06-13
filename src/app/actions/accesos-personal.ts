'use server';

import { readData, writeData } from '@/lib/data-service';
import { randomUUID } from 'crypto';
import { verifySession } from '@/lib/auth/session-token';

export type ModuloPermiso = 
  | 'musica' | 'itinerario' | 'carga-operativa' | 'decoracion' | 'crm' | 'reposteria' | 'fotografia'
  | 'presupuestos' | 'facturas' | 'clientes' | 'empleados' | 'proveedores' | 'empresa' | 'contabilidad' | 'calendario';

export interface AccesoPersonal {
  id: string; // Token único y secreto
  nombreAcceso: string;
  fiestaId?: string; // Opcional, para accesos específicos de una fiesta
  permisos: ModuloPermiso[];
  fechaCreacion: string; // ISO Date String
}

const ACCESOS_FILE = 'accesos-personal.json';

export async function createAccesoPersonal(
  data: Omit<AccesoPersonal, 'id' | 'fechaCreacion'>
): Promise<{ success: boolean; acceso?: AccesoPersonal; error?: string }> {
  if (!(await verifySession()).success) {
    return { success: false, error: 'Acceso no autorizado.' };
  }
  if (!data.nombreAcceso.trim() || data.permisos.length === 0) {
    return { success: false, error: "Faltan datos para crear el acceso." };
  }
  try {
    const accesos = await readData<AccesoPersonal[]>(ACCESOS_FILE, []);
    const newAcceso: AccesoPersonal = {
      ...data,
      fiestaId: data.fiestaId || undefined,
      id: randomUUID(),
      fechaCreacion: new Date().toISOString(),
    };
    accesos.push(newAcceso);
    await writeData(ACCESOS_FILE, accesos);
    return { success: true, acceso: newAcceso };
  } catch (error: any) {
    console.error("Error creating acceso personal:", error);
    return { success: false, error: error.message || "Error al crear el acceso." };
  }
}

export async function getAccesosGenerales(): Promise<AccesoPersonal[]> {
  if (!(await verifySession()).success) return [];
  const accesos = await readData<AccesoPersonal[]>(ACCESOS_FILE, []);
  return accesos;
}

export async function getAccesoById(tokenId: string): Promise<AccesoPersonal | null> {
    if (!tokenId || tokenId.length > 200) return null;
    const accesos = await readData<AccesoPersonal[]>(ACCESOS_FILE, []);
    return accesos.find(a => a.id === tokenId) || null;
}

export async function deleteAccesoPersonal(tokenId: string): Promise<{ success: boolean; error?: string }> {
  if (!(await verifySession()).success) {
    return { success: false, error: 'Acceso no autorizado.' };
  }
  try {
    let accesos = await readData<AccesoPersonal[]>(ACCESOS_FILE, []);
    const initialLength = accesos.length;
    accesos = accesos.filter(a => a.id !== tokenId);
    if (accesos.length === initialLength) {
      return { success: false, error: "No se encontró el acceso para eliminar." };
    }
    await writeData(ACCESOS_FILE, accesos);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting acceso personal:", error);
    return { success: false, error: error.message || "Error al eliminar el acceso." };
  }
}
