/** @jest-environment node */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const projectId = 'demo-ak-producciones';
let testEnvironment: RulesTestEnvironment;

beforeAll(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

afterAll(async () => {
  await testEnvironment.cleanup();
});

test('denies unauthenticated client reads', async () => {
  const firestore = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(getDoc(doc(firestore, 'customers', 'customer-1')));
});

test('denies authenticated client reads', async () => {
  const firestore = testEnvironment.authenticatedContext('employee-1', {
    role: 'admin',
  }).firestore();

  await assertFails(getDoc(doc(firestore, 'customers', 'customer-1')));
});

test('denies authenticated client writes', async () => {
  const firestore = testEnvironment.authenticatedContext('employee-1', {
    role: 'admin',
  }).firestore();

  await assertFails(setDoc(doc(firestore, 'customers', 'customer-1'), {
    name: 'Test Customer',
  }));
});

test('allows trusted server-style setup with rules disabled', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await assertSucceeds(setDoc(doc(context.firestore(), 'customers', 'customer-1'), {
      name: 'Test Customer',
    }));
  });
});

/**
 * Las colecciones con datos que no pueden salir de la empresa.
 *
 * La postura del proyecto es que NADIE entra directo a la base: todo pasa por el
 * servidor. Estas pruebas lo dejan clavado. Si alguna vez alguien abre una regla
 * "para probar" y se olvida de cerrarla, esto falla antes de llegar a producción.
 */
const COLECCIONES_SENSIBLES = [
  { nombre: 'clientes', porQue: 'nombres, teléfonos y correos de los clientes' },
  { nombre: 'fiestas', porQue: 'la contraseña del portal y los teléfonos de todos los invitados' },
  { nombre: 'presupuestos', porQue: 'precios y condiciones de cada venta' },
  { nombre: 'prospectos', porQue: 'los contactos comerciales' },
  { nombre: 'crm-leads', porQue: 'los contactos que dejan sus datos en el simulador' },
  { nombre: 'empleados', porQue: 'los datos del personal' },
  { nombre: 'facturas', porQue: 'la facturación' },
  { nombre: 'social_gallery_posts', porQue: 'las fotos de los invitados' },
];

describe('nadie entra directo a la base', () => {
  for (const coleccion of COLECCIONES_SENSIBLES) {
    test(`${coleccion.nombre}: no se puede leer sin pasar por el servidor (${coleccion.porQue})`, async () => {
      const sinSesion = testEnvironment.unauthenticatedContext().firestore();
      const conSesion = testEnvironment.authenticatedContext('empleado-1', { role: 'admin' }).firestore();

      await assertFails(getDoc(doc(sinSesion, coleccion.nombre, 'cualquiera')));
      await assertFails(getDoc(doc(conSesion, coleccion.nombre, 'cualquiera')));
    });

    test(`${coleccion.nombre}: no se puede escribir sin pasar por el servidor`, async () => {
      const sinSesion = testEnvironment.unauthenticatedContext().firestore();
      const conSesion = testEnvironment.authenticatedContext('empleado-1', { role: 'admin' }).firestore();

      await assertFails(setDoc(doc(sinSesion, coleccion.nombre, 'cualquiera'), { x: 1 }));
      await assertFails(setDoc(doc(conSesion, coleccion.nombre, 'cualquiera'), { x: 1 }));
    });
  }
});
