/** @jest-environment node */
/**
 * Orden 293, bloque 1: las once acciones que el auditor encontro diciendo "listo" sin haber guardado.
 * Cada una hace la ida, VUELVE A LEER de la base (emulador) y, si se puede deshacer, hace la vuelta.
 * De mentira solo: la sesion, las cookies y los avisos. Nunca data-service ni firebase-sync.
 */
process.env.AK_SESSION_SECRET = 'prueba-293-secreto-con-suficiente-entropia';
process.env.FIREBASE_PROJECT_ID = 'demo-ak-producciones';
delete process.env.AK_USE_LOCAL_JSON_ONLY;
jest.setTimeout(60000);

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, getAll: () => [] }),
  headers: async () => new Headers(),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: async () => ({ success: true, user: { email: 'dueno@ak.uy', role: 'admin', perfil: 'dueno' } }),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: async () => undefined,
}));
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: async () => null,
}));
jest.mock('@/lib/whatsapp-automation-engine', () => ({
  triggerWhatsAppAutomation: async () => ({ scheduled: 0, errors: [] }),
}));
jest.mock('@/lib/google-workspace', () => ({}));
jest.mock('@/app/actions/google-workspace', () => ({
  syncFiestaToGoogleWorkspace: async () => ({ success: true }),
  syncAppointmentToGoogleWorkspace: async () => undefined,
}));

import fs from 'node:fs';
import path from 'node:path';
import { readData, writeData } from '@/lib/data-service';
import { applyPriceAdjustment, revertPriceAdjustment } from '@/app/actions/price-adjustments';
import { adjustAllServicePrices, adjustAllServiceCosts } from '@/app/actions/servicios-empresa';
import { updateMenuAsignado } from '@/app/actions/fiesta/catering.actions';
import { deleteTaskTemplate } from '@/app/actions/task-templates';
import { deleteDecoCanvasTemplate } from '@/app/actions/deco-canvas-templates';
import { deleteMarketingTemplate } from '@/app/actions/marketing';
import { resetAllPresupuestos } from '@/app/actions/presupuestos';
import { updateGuestRsvp } from '@/app/actions/fiesta/invitados.actions';

const conEmuladores = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const FIESTA_ID = `prueba-293-${Date.now()}`;

const ARCHIVOS_LOCALES_TOCADOS = [
  'servicios-empresa.json',
  'price-adjustments-history.json',
  'task-templates.json',
  'deco-canvas-templates.json',
  'marketing-templates.json',
  'presupuestos.json',
  'crm-leads.json',
  'backup-status.json',
].flatMap((nombre) => [
  path.join(process.cwd(), 'data', nombre),
  path.join(process.cwd(), 'src', 'data', nombre),
]);

const copiasLocales = new Map<string, string | null>();

const sinCache = async () => {
  const { cacheInvalidate } = await import('@/lib/server-cache');
  cacheInvalidate('servicios-empresa-raw');
};

describe('ida y vuelta contra la base: las once del auditor', () => {
  beforeAll(() => {
    expect(conEmuladores).toBe(true); // sin emulador la prueba no prueba nada
    for (const ruta of ARCHIVOS_LOCALES_TOCADOS) {
      copiasLocales.set(ruta, fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : null);
    }
  });

  afterAll(() => {
    for (const [ruta, contenido] of copiasLocales.entries()) {
      try {
        if (contenido === null) {
          if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        } else {
          fs.writeFileSync(ruta, contenido, 'utf8');
        }
      } catch {
        // ignorar errores de limpieza local
      }
    }
  });

  it('revertPriceAdjustment: +10% y la vuelta dejan 100 y 40', async () => {
    await writeData('servicios-empresa.json', [
      { id: 'serv_293_a', nombre: 'Servicio 293', categoria: 'Prueba', tipoItem: 'Servicio', precioVenta: 100, valorUnitarioEstimado: 40, calculationMethod: 'fijo' },
    ], undefined, { skipAutoBackup: true });
    await writeData('price-adjustments-history.json', [], undefined, { skipAutoBackup: true });
    await sinCache();

    const aplicado = await applyPriceAdjustment(10, 'ambos');
    expect(aplicado.success).toBe(true);
    let [s] = await readData<any[]>('servicios-empresa.json', []);
    expect(s.precioVenta).toBe(110);
    expect(s.valorUnitarioEstimado).toBe(44);

    const revertido = await revertPriceAdjustment(aplicado.record!.id);
    expect(revertido).toEqual({ success: true });
    [s] = await readData<any[]>('servicios-empresa.json', []);
    expect(s.precioVenta).toBe(100);
    expect(s.valorUnitarioEstimado).toBe(40);
  });

  it('adjustAllServicePrices / adjustAllServiceCosts: -200% se rechaza y el precio queda igual', async () => {
    await sinCache();
    const precios = await adjustAllServicePrices(-200);
    const costos = await adjustAllServiceCosts(-200);
    expect(precios.success).toBe(false);
    expect(costos.success).toBe(false);
    const [s] = await readData<any[]>('servicios-empresa.json', []);
    expect(s.precioVenta).toBe(100);
    expect(s.valorUnitarioEstimado).toBe(40);
  });

  it('updateMenuAsignado: asignar y quitar; el campo no queda en la base', async () => {
    await writeData(`fiestas/${FIESTA_ID}.json`, {
      id: FIESTA_ID,
      estado: 'En Planificación',
      configuracion: { nombreEvento: 'Fiesta 293', fechaEvento: '2030-01-01' },
      invitados: [{ id: 'inv_293', nombre: 'Invitado 293', rsvp: 'Confirmado', categoria: 'Adulto', partySize: 1, dietaryRestriction: 'Celiaco', isCeliac: true }],
    }, undefined, { skipAutoBackup: true });

    await updateMenuAsignado(FIESTA_ID, 'menu_293');
    let f = await readData<any>(`fiestas/${FIESTA_ID}.json`, null);
    expect(f.menuAsignadoId).toBe('menu_293');

    await updateMenuAsignado(FIESTA_ID, undefined);
    f = await readData<any>(`fiestas/${FIESTA_ID}.json`, null);
    expect(f.menuAsignadoId).toBeUndefined();
    const { dbAdmin } = await import('@/lib/firebase/server');
    const crudo = await dbAdmin!.collection('fiestas').doc(FIESTA_ID).get();
    if (crudo.exists) expect(crudo.data()?.menuAsignadoId).toBeUndefined();
  });

  it('updateGuestRsvp: Celiaco -> Ninguna deja isCeliac en falso', async () => {
    const r = await updateGuestRsvp(FIESTA_ID, 'inv_293', { rsvp: 'Confirmado', dietaryRestriction: 'Ninguna' });
    expect(r.success).toBe(true);
    const f = await readData<any>(`fiestas/${FIESTA_ID}.json`, null);
    const inv = f.invitados.find((i: any) => i.id === 'inv_293');
    expect(inv.dietaryRestriction).toBe('Ninguna');
    expect(inv.isCeliac).toBe(false);
  });

  it('deleteTaskTemplate: borrar la unica plantilla deja la lista vacia', async () => {
    await writeData('task-templates.json', [{ id: 'tpl_293', name: 'Plantilla 293', tasks: [] }], undefined, { skipAutoBackup: true });
    const r = await deleteTaskTemplate('tpl_293');
    expect(r.success).toBe(true);
    expect(await readData<any[]>('task-templates.json', [{ id: 'fantasma' }])).toEqual([]);
  });

  it('deleteDecoCanvasTemplate: borrar la unica plantilla deja la lista vacia', async () => {
    await writeData('deco-canvas-templates.json', [
      { id: 'deco_tpl_293', nombre: 'Canvas 293', elementos: [], fondoColor: '#fff', creadoEn: new Date().toISOString() },
    ], undefined, { skipAutoBackup: true });
    const r = await deleteDecoCanvasTemplate('deco_tpl_293');
    expect(r.success).toBe(true);
    expect(await readData<any[]>('deco-canvas-templates.json', [{ id: 'fantasma' }])).toEqual([]);
  });

  it('deleteMarketingTemplate: borrar la unica plantilla deja la lista vacia', async () => {
    await writeData('marketing-templates.json', [{ id: 'mkt_293', name: 'Marketing 293' }], undefined, { skipAutoBackup: true });
    const r = await deleteMarketingTemplate('mkt_293');
    expect(r.success).toBe(true);
    expect(await readData<any[]>('marketing-templates.json', [{ id: 'fantasma' }])).toEqual([]);
  });

  it('resetAllPresupuestos: el prospecto queda sin presupuestoId', async () => {
    await writeData('presupuestos.json', [
      { id: 'pres_293', numero: 1, clienteNombre: 'Cliente 293', itemsPresupuestados: [], estado: 'Enviado', timestamp: new Date().toISOString() },
    ], undefined, { skipAutoBackup: true });
    await writeData('crm-leads.json', [
      { id: 'lead_293', nombre: 'Lead 293', presupuestoId: 'pres_293', presupuestoEstado: 'Enviado' },
    ], undefined, { skipAutoBackup: true });

    const r = await resetAllPresupuestos();
    expect(r.success).toBe(true);
    expect(await readData<any[]>('presupuestos.json', [{ id: 'fantasma' }])).toEqual([]);
    const leads = await readData<any[]>('crm-leads.json', []);
    const lead = leads.find((l) => l.id === 'lead_293');
    expect(lead).toBeDefined();
    expect(lead.presupuestoId).toBeUndefined();
  });
});
