/**
 * @jest-environment node
 *
 * Barrido de permisos (12/10/2026). Muchas acciones pedían sólo "tener sesión": el personal y el
 * operador también tienen. Acá se prueba con la sesión de cada perfil y una base de mentira que el
 * personal queda afuera y el perfil que usa la pantalla de verdad pasa la guarda (después puede
 * fallar por otra cosa, como que el dato de prueba no exista: eso no es de este control).
 */
let usuario: { perfil?: string; role?: string } | null = null;

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => (usuario ? { success: true, user: usuario } : { success: false, error: 'sin sesión' })),
}));

jest.mock('@/lib/data-service', () => {
  const nada = jest.fn(async () => undefined);
  return {
    __esModule: true,
    readData: jest.fn(async (_f: string, def: unknown) => def),
    readDataConDetalle: jest.fn(async (_f: string, def: unknown) => ({ data: def, completo: true })),
    writeData: nada,
    createDataItem: nada,
    updateDataItem: nada,
    updateDataPartial: nada,
    deleteDataItem: jest.fn(async () => false),
    mutateDataItem: jest.fn(async () => null),
    mutateGenericJsonArray: jest.fn(async () => undefined),
  };
});
jest.mock('@/lib/firebase/server', () => ({ __esModule: true, dbAdmin: null }));
jest.mock('@/lib/firebase/storage', () => ({
  __esModule: true,
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn(),
  extractStoragePath: (p: string) => p,
  getSignedUrl: jest.fn(),
}));

import { getWhatsAppConfig, sendWhatsAppMessage } from '@/app/actions/whatsapp';
import { getSocialConnections } from '@/app/actions/social-connections';
import { addSalonPago } from '@/app/actions/salones';
import { savePlanPagosContrato } from '@/app/actions/fiesta-actual';
import { updatePresupuesto } from '@/app/actions/presupuestos';
import { resetAllFiestasHistoricas } from '@/app/actions/fiestas-historicas';
import { deleteCustomer } from '@/app/actions/customers';
import { saveTaskTemplate } from '@/app/actions/task-templates';

const SIN_PERMISO = /perfil|no autorizad|administradores|sesion no autorizada|sin sesi/i;

/** Devuelve true si la guarda lo rechazó (tirando o devolviendo el error de permiso). */
async function rechazado(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    const r = (await fn()) as { success?: boolean; ok?: boolean; error?: string } | undefined;
    return Boolean(r && typeof r === 'object' && r.success === false && r.error && SIN_PERMISO.test(r.error));
  } catch (e) {
    return SIN_PERMISO.test(e instanceof Error ? e.message : String(e));
  }
}

const PERFILES = ['dueno', 'secretaria', 'operador', 'personal', 'cliente', 'invitado'] as const;
const sesion = (perfil: string) => ({ perfil, role: perfil === 'dueno' ? 'admin' : 'user' });

type Caso = { nombre: string; correr: () => Promise<unknown>; permitidos: string[] };
const casos: Caso[] = [
  { nombre: 'configuración de WhatsApp (trae la clave)', correr: () => getWhatsAppConfig(), permitidos: ['dueno'] },
  { nombre: 'conexiones de redes (traen los tokens)', correr: () => getSocialConnections(), permitidos: ['dueno'] },
  { nombre: 'mandar un WhatsApp desde la bandeja', correr: () => sendWhatsAppMessage('c1', 'hola'), permitidos: ['dueno', 'secretaria'] },
  {
    nombre: 'anotar un pago al salón',
    correr: () => addSalonPago('s1', { fecha: '2026-10-01', monto: 100 } as never),
    permitidos: ['dueno', 'secretaria'],
  },
  {
    nombre: 'plan de pagos del contrato',
    correr: () => savePlanPagosContrato('f1', { activo: true, cuotas: [] } as never),
    permitidos: ['dueno', 'secretaria'],
  },
  {
    nombre: 'cambiar un presupuesto',
    correr: () => updatePresupuesto({ id: 'p1', itemsPresupuestados: [] } as never),
    permitidos: ['dueno', 'secretaria'],
  },
  { nombre: 'reiniciar las fiestas históricas', correr: () => resetAllFiestasHistoricas(), permitidos: ['dueno'] },
  { nombre: 'borrar un cliente', correr: () => deleteCustomer('c1'), permitidos: ['dueno', 'secretaria'] },
  { nombre: 'guardar una plantilla de tareas', correr: () => saveTaskTemplate('x', []), permitidos: ['dueno', 'secretaria', 'operador'] },
];

describe('el barrido de permisos deja afuera al personal y al operador donde no les toca', () => {
  afterEach(() => { usuario = null; });

  for (const caso of casos) {
    for (const perfil of PERFILES) {
      const permitido = caso.permitidos.includes(perfil);
      it(`${caso.nombre}: ${perfil} ${permitido ? 'pasa la guarda' : 'es rechazado'}`, async () => {
        usuario = sesion(perfil);
        expect(await rechazado(caso.correr)).toBe(!permitido);
      });
    }
    it(`${caso.nombre}: sin sesión es rechazado`, async () => {
      usuario = null;
      expect(await rechazado(caso.correr)).toBe(true);
    });
  }
});
