/**
 * Orden 164, defecto 1 (pregunta 58): crear una plantilla con la respuesta perdida y reintentar
 * deja UNA sola plantilla con el mismo id. Dos creaciones deliberadas (con exito confirmado entre
 * medio) dejan dos. La base de mentira devuelve COPIAS, como la de verdad.
 */
import fs from 'fs';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(),
  requirePermisoAlguno: jest.fn(),
}));

let coleccion: Record<string, any> = {};
const existente = () => Object.values(coleccion).map((x) => JSON.parse(JSON.stringify(x)));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => existente()),
  writeData: jest.fn(async () => undefined),
  deleteDataItem: jest.fn(),
  createDataItem: jest.fn(async (_f: string, _c: string, id: string, item: unknown) => {
    if (coleccion[id]) throw Object.assign(new Error('6 ALREADY_EXISTS'), { code: 6 });
    coleccion[id] = JSON.parse(JSON.stringify(item));
  }),
}));

import { saveInvitationTemplate } from '@/app/actions/invitacion-digital-templates';

const datos = { name: 'Nueva Plantilla 1', category: 'General' as const, plantilla: 'Grazia' as const };
beforeEach(() => { coleccion = {}; });

test('respuesta perdida + reintento con el mismo intento = una sola plantilla con el mismo id', async () => {
  const idIntento = 'intento-abc12345';
  const primera = await saveInvitationTemplate(datos as any, { idIntento });
  expect(primera.success).toBe(true);
  // la respuesta se perdio: la pantalla reintenta con el mismo intento
  const segunda = await saveInvitationTemplate(datos as any, { idIntento });
  expect(segunda.success).toBe(true);
  expect(segunda.template?.id).toBe(primera.template?.id);
  expect(Object.keys(coleccion)).toHaveLength(1);
});

test('dos envios a la vez del mismo intento dejan una sola', async () => {
  const idIntento = 'intento-concurr1';
  const [a, b] = await Promise.all([
    saveInvitationTemplate(datos as any, { idIntento }),
    saveInvitationTemplate(datos as any, { idIntento }),
  ]);
  expect(a.template?.id).toBe(b.template?.id);
  expect(Object.keys(coleccion)).toHaveLength(1);
});

test('dos creaciones deliberadas (intentos distintos, misma carga) dan dos plantillas', async () => {
  const a = await saveInvitationTemplate(datos as any, { idIntento: 'intento-uno-1234' });
  const b = await saveInvitationTemplate(datos as any, { idIntento: 'intento-dos-1234' });
  expect(a.template?.id).not.toBe(b.template?.id);
  expect(Object.keys(coleccion)).toHaveLength(2);
});

test('la pantalla manda el intento al guardar y lo termina solo con exito', () => {
  const src = fs.readFileSync('src/app/(app)/settings/templates/invitaciones/page.tsx', 'utf8');
  expect(src).toMatch(/saveInvitationTemplate\(newTemplateData, \{ idIntento \}\)/);
  expect(src).toMatch(/obtenerIntento\(alcanceIntento/);
  expect(src.indexOf('terminarIntento(alcanceIntento)')).toBeGreaterThan(src.indexOf('saveInvitationTemplate(newTemplateData'));
});
