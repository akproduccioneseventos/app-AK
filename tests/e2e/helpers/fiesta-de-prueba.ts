import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildAkDemoFiesta } from '../../../src/lib/experience-ak/demo-fiesta-factory';
import type { FiestaEnPlanificacion } from '../../../src/types/fiesta';
import { getUruguayParts } from '../../../src/lib/utils';

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

/**
 * Permiso de estación, igual que el que genera el equipo desde el Centro de
 * Fiesta. Las estaciones (buzón, fotocabina, espejo, 360) no se abren con el
 * link pelado: hay que llegar con este permiso, que es lo que lleva el QR.
 *
 * Se reproduce acá el mismo formato que usa la app (`ent-v2` + firma) para poder
 * probar el camino real del invitado y no una versión inventada.
 */
export function crearPermisoDeEstacion(fiestaId: string, moduloId: string, horas = 18) {
  const datos = Buffer.from(
    JSON.stringify({
      version: 'ent-v2',
      fiestaId,
      moduleId: moduloId,
      scope: 'guest',
      expiresAt: Date.now() + horas * 60 * 60 * 1000,
      nonce: crypto.randomUUID(),
    }),
  ).toString('base64url');
  const firma = crypto.createHmac('sha256', SESSION_SECRET).update(datos).digest('base64url');
  return `${datos}.${firma}`;
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
  const { year, month, day } = getUruguayParts();
  const hoy = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

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

/**
 * Quita del archivo de opiniones las que dejó la prueba.
 *
 * El envío se guarda de verdad (esa es la gracia), así que sin esto las
 * opiniones inventadas quedarían mezcladas con las de los clientes reales.
 */
export function borrarOpinionesDePrueba() {
  for (const carpeta of ['data', path.join('src', 'data')]) {
    const archivo = path.join(process.cwd(), carpeta, 'feedback.json');
    if (!fs.existsSync(archivo)) continue;
    try {
      const opiniones = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      if (!Array.isArray(opiniones)) continue;
      const limpias = opiniones.filter((o: any) => !String(o?.fiestaId || '').startsWith('e2e_'));
      if (limpias.length !== opiniones.length) {
        fs.writeFileSync(archivo, `${JSON.stringify(limpias, null, 2)}\n`);
      }
    } catch {
      // Si el archivo no se puede leer, no es la prueba quien tiene que arreglarlo.
    }
  }
}
