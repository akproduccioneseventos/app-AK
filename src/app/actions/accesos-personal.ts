'use server';

import { readData, writeData } from '@/lib/data-service';
import { randomUUID } from 'crypto';
import { verifySession } from '@/lib/auth/session-token';
import { accesoVencido } from '@/lib/auth/vigencia-acceso';
import type { AccesoPersonal, ModuloPermiso } from '@/types/acceso-personal';

export type { AccesoPersonal, ModuloPermiso } from '@/types/acceso-personal';

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

export async function verifyAccesoPersonalToken(
  fiestaId: string,
  modulo: ModuloPermiso,
  accessToken?: string
): Promise<{
  authorized: boolean;
  operatorName?: string;
  isExternalProvider?: boolean;
  motivo?: 'vencido' | 'sin-permiso';
}> {
  const session = await verifySession();
  if (session.success) {
    return { authorized: true, isExternalProvider: false };
  }

  if (!accessToken) {
    return { authorized: false, isExternalProvider: false };
  }

  const access = await getAccesoById(accessToken);
  if (!access) return { authorized: false, isExternalProvider: false };

  // El acceso tiene que servir para ESTA fiesta. Un acceso sin fiesta asignada
  // es deliberadamente global (el DJ de siempre, que trabaja en todas), pero
  // igual necesita el permiso del modulo.
  const esDeEstaFiesta = !access.fiestaId || access.fiestaId === fiestaId;
  const tienePermiso = access.permisos.includes(modulo);

  // Un enlace de proveedor no puede servir para siempre: el fotografo de una
  // fiesta de hace ocho meses seguia entrando. Si el acceso no trae vencimiento
  // propio, se le da la ventana por defecto desde que se creo.
  const vencido = accesoVencido(access);

  const authorized = Boolean(esDeEstaFiesta && tienePermiso && !vencido);

  return {
    authorized,
    operatorName: authorized ? access.nombreAcceso : undefined,
    isExternalProvider: authorized,
    motivo: authorized ? undefined : vencido ? 'vencido' : 'sin-permiso',
  };
}
