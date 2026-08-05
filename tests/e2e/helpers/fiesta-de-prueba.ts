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
export function crearFiestaDeEstaNoche(
  opciones: { id?: string; clavePortal?: string; fechaEvento?: string } = {},
) {
  const base = buildAkDemoFiesta('tecnologia-total');
  const { year, month, day } = getUruguayParts();
  const fechaHoyUruguay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const hoy = opciones.fechaEvento ?? fechaHoyUruguay;

  /**
   * Lista de invitados de tamaño real.
   *
   * Con cuatro invitados de prueba, las pantallas que listan gente entraban
   * siempre y los defectos de ancho no aparecían nunca. Una fiesta de AK tiene
   * ochenta invitados repartidos en diez mesas, y así se prueba.
   */
  const NOMBRES = ['Lucía Fernández', 'Martín Rodríguez', 'Sofía Pereyra', 'Diego Silva'];
  const RELLENO = Array.from({ length: 76 }, (_, i) => ({
    nombre: `Invitado de prueba número ${i + 5} con apellido largo`,
    mesa: String((i % 10) + 1),
    partySize: (i % 3) + 1,
  }));

  const invitados = [
    { nombre: NOMBRES[0], mesa: '1', partySize: 2 },
    { nombre: NOMBRES[1], mesa: '1', partySize: 1 },
    { nombre: NOMBRES[2], mesa: '2', partySize: 3 },
    { nombre: NOMBRES[3], mesa: '2', partySize: 1 },
    ...RELLENO,
  ].map((g, i) => ({
    id: `inv_prueba_${i}`,
    guestAccessToken: `token-prueba-${i}`,
    nombre: g.nombre,
    rsvp: (i < 4 || i % 4 !== 0 ? 'Confirmado' : 'Pendiente') as 'Confirmado' | 'Pendiente',
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
    // Con la galería apagada, la pantalla del video de vida contesta "no está
    // habilitada" y no se puede comprobar nada de lo que hay detrás.
    videoVida: { ...(base.videoVida ?? {}), galleryEnabled: true, photoCount: 12 },
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

/**
 * Quita los presupuestos que dejó la prueba del simulador.
 *
 * El simulador genera un presupuesto de verdad al final del recorrido. Sin esto
 * queda en la lista de presupuestos del negocio, y además hace fallar la guarda
 * de maquetación: la pantalla de presupuestos tiene una fila de más y la guarda
 * lo lee como un cambio de diseño.
 */
export function borrarPresupuestosDePrueba() {
  const esDePrueba = (p: any) => {
    const nombre = String(p?.clienteNombre ?? p?.cliente?.nombre ?? p?.nombreCliente ?? '');
    return nombre.startsWith('Prospecto de prueba') || nombre.startsWith('Prospecto E2E');
  };

  for (const carpeta of ['data', path.join('src', 'data')]) {
    const archivo = path.join(process.cwd(), carpeta, 'presupuestos.json');
    if (!fs.existsSync(archivo)) continue;
    try {
      const presupuestos = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      if (!Array.isArray(presupuestos)) continue;
      const limpios = presupuestos.filter((p: any) => !esDePrueba(p));
      if (limpios.length !== presupuestos.length) {
        fs.writeFileSync(archivo, `${JSON.stringify(limpios, null, 2)}\n`);
      }
    } catch {
      // Si el archivo no se puede leer, no es la prueba quien tiene que arreglarlo.
    }
  }
}

/**
 * Quita del CRM los prospectos que dejó la prueba del simulador.
 *
 * El simulador registra el avance del visitante paso a paso, así que la prueba
 * crea un prospecto de verdad aunque nunca llegue a generar el presupuesto. Sin
 * esto, queda gente inventada mezclada con los prospectos reales del negocio.
 */
export function borrarProspectosDePrueba() {
  for (const carpeta of ['data', path.join('src', 'data')]) {
    const archivo = path.join(process.cwd(), carpeta, 'crm-leads.json');
    if (!fs.existsSync(archivo)) continue;
    try {
      const leads = JSON.parse(fs.readFileSync(archivo, 'utf8'));
      if (!Array.isArray(leads)) continue;
      const limpios = leads.filter((l: any) => !String(l?.name ?? '').startsWith('Prospecto de prueba'));
      if (limpios.length !== leads.length) {
        fs.writeFileSync(archivo, `${JSON.stringify(limpios, null, 2)}\n`);
      }
    } catch {
      // Si el archivo no se puede leer, no es la prueba quien tiene que arreglarlo.
    }
  }
}
