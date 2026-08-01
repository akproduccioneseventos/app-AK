import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildAkDemoFiesta } from '../../../src/lib/experience-ak/demo-fiesta-factory';
import type { FiestaEnPlanificacion } from '../../../src/types/fiesta';

/**
 * Fiesta de prueba con datos de verdad.
 *
 * La app tiene un modo local que guarda los eventos como archivos en vez de en
 * la base. Con la escritura habilitada, ese modo permite probar el recorrido
 * completo: el invitado confirma, el dato se guarda y el equipo lo ve.
 *
 * Este ayudante crea la fiesta, la deja en las dos carpetas donde la app busca
 * los datos locales, y la borra al terminar.
 */

export const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

/** Cookie de sesión del equipo, firmada igual que en la app. */
export function crearCookieDeSesion() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`;
}

const CARPETAS_DATOS = [
  path.join(process.cwd(), 'data', 'fiestas'),
  path.join(process.cwd(), 'src', 'data', 'fiestas'),
];

export function archivosDe(fiestaId: string) {
  return CARPETAS_DATOS.map((dir) => path.join(dir, `${fiestaId}.json`));
}

export function guardarFiesta(fiesta: FiestaEnPlanificacion) {
  for (const archivo of archivosDe(fiesta.id)) {
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, `${JSON.stringify(fiesta, null, 2)}\n`);
  }
}

export function leerFiesta(fiestaId: string): any | null {
  for (const archivo of archivosDe(fiestaId)) {
    if (fs.existsSync(archivo)) return JSON.parse(fs.readFileSync(archivo, 'utf8'));
  }
  return null;
}

export function borrarFiesta(fiestaId: string) {
  for (const archivo of archivosDe(fiestaId)) {
    if (fs.existsSync(archivo)) fs.unlinkSync(archivo);
  }
}

/**
 * Fiesta "de esta noche": todos los módulos contratados, invitados ya
 * confirmados con mesa asignada y el portal del cliente abierto.
 *
 * La fecha es hoy a propósito: varias pantallas de la noche sólo muestran
 * contenido real el día del evento.
 */
export function crearFiestaDeEstaNoche(opciones: { id?: string; clavePortal?: string } = {}) {
  const base = buildAkDemoFiesta('tecnologia-total');
  const hoy = new Date().toISOString().split('T')[0];

  const invitados = [
    { nombre: 'Lucía Fernández', mesa: '1', partySize: 2 },
    { nombre: 'Martín Rodríguez', mesa: '1', partySize: 1 },
    { nombre: 'Sofía Pereyra', mesa: '2', partySize: 3 },
    { nombre: 'Diego Silva', mesa: '2', partySize: 1 },
  ].map((g, i) => ({
    id: `inv_prueba_${i}`,
    guestAccessToken: `token-prueba-${i}`,
    nombre: g.nombre,
    rsvp: 'Confirmado' as const,
    categoria: 'Adulto' as const,
    contacto: `09911122${i}`,
    partySize: g.partySize,
    tableNumber: g.mesa,
    dietaryRestriction: 'Ninguna' as const,
    cancionesDJ: ['Despacito – Luis Fonsi'],
  }));

  const fiesta = {
    ...base,
    id: opciones.id ?? `e2e_noche_${Date.now()}`,
    invitados,
    configuracion: {
      ...base.configuracion,
      nombreEvento: 'Fiesta de esta noche',
      fechaEvento: hoy,
    },
    clientPortalSettings: {
      ...base.clientPortalSettings,
      enabled: true,
      accessKey: opciones.clavePortal ?? 'clave-de-prueba-e2e',
    },
  } as FiestaEnPlanificacion;

  guardarFiesta(fiesta);
  return fiesta;
}
