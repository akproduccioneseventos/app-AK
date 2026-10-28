import 'server-only';

import { createDataItem, deleteDataItem, readDataConDetalle } from '@/lib/data-service';

const ARCHIVO = 'asistente-memoria.json';
const COLECCION = 'asistente_memoria';
const MAX_RECUERDOS_POR_BUSQUEDA = 8;
const MAX_TEXTO = 500;
export const ID_MEMORIA_DUENO = 'ak:dueno';

export interface RecuerdoAsistente {
  id: string;
  usuarioId: string;
  texto: string;
  sobre?: string;
  esDueno: boolean;
  creadoEn: string;
}

export interface AccesoMemoria {
  esDueno?: boolean;
  puedeVerMemoriaDelDueno?: boolean;
}

const PATRONES_SENSIBLES = [
  /\b(?:contrase(?:ñ|n)a|password|passwd|pin|cvv|cvc)\s*(?:es|:|=)\s*\S+/i,
  /\b(?:tarjeta|card)\s*(?:de\s*)?(?:cr[eé]dito|d[eé]bito)?\s*(?:n[uú]mero|no\.?|:|=)?\s*\d[\d -]{11,}/i,
  /\b(?:diagn[oó]stico|enfermedad|medicaci[oó]n|historia cl[ií]nica|dato de salud)\b/i,
];

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function contieneDatoSensible(texto: string): boolean {
  return PATRONES_SENSIBLES.some((patron) => patron.test(texto));
}

function accesible(recuerdo: RecuerdoAsistente, usuarioId: string, acceso: AccesoMemoria): boolean {
  return recuerdo.usuarioId === usuarioId || (recuerdo.esDueno && acceso.puedeVerMemoriaDelDueno === true);
}

async function leerRecuerdos(): Promise<RecuerdoAsistente[]> {
  const resultado = await readDataConDetalle<RecuerdoAsistente[]>(ARCHIVO, []);
  if (resultado.huboFalla || !Array.isArray(resultado.valor)) return [];
  return resultado.valor.filter((recuerdo) =>
    recuerdo && typeof recuerdo.id === 'string' && typeof recuerdo.usuarioId === 'string' && typeof recuerdo.texto === 'string',
  );
}

export async function recordar(
  usuarioId: string,
  texto: string,
  sobre?: string,
  acceso: AccesoMemoria = {},
): Promise<{ guardado: boolean; motivo?: 'vacio' | 'sensible' }> {
  const contenido = texto.trim().slice(0, MAX_TEXTO);
  const tema = sobre?.trim().slice(0, 100);
  if (!usuarioId.trim() || !contenido) return { guardado: false, motivo: 'vacio' };
  if (contieneDatoSensible(`${tema || ''} ${contenido}`)) return { guardado: false, motivo: 'sensible' };

  const id = `rec_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;
  const recuerdo: RecuerdoAsistente = {
    id,
    usuarioId: usuarioId.trim(),
    texto: contenido,
    sobre: tema || undefined,
    esDueno: acceso.esDueno === true,
    creadoEn: new Date().toISOString(),
  };

  await createDataItem(ARCHIVO, COLECCION, id, recuerdo, { skipAutoBackup: true });
  return { guardado: true };
}

export async function loQueSe(
  usuarioId: string,
  consulta: string,
  acceso: AccesoMemoria = {},
): Promise<RecuerdoAsistente[]> {
  if (!usuarioId.trim()) return [];
  const recuerdos = (await leerRecuerdos()).filter((recuerdo) => accesible(recuerdo, usuarioId, acceso));
  const palabras = normalizar(consulta).split(' ').filter((palabra) => palabra.length > 2);
  if (palabras.length === 0) return recuerdos.slice(-MAX_RECUERDOS_POR_BUSQUEDA).reverse();

  return recuerdos
    .map((recuerdo, indice) => {
      const texto = normalizar(`${recuerdo.sobre || ''} ${recuerdo.texto}`);
      const puntaje = palabras.reduce((total, palabra) => total + (texto.includes(palabra) ? 1 : 0), 0);
      return { recuerdo, indice, puntaje };
    })
    .filter((item) => item.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje || b.indice - a.indice)
    .slice(0, MAX_RECUERDOS_POR_BUSQUEDA)
    .map((item) => item.recuerdo);
}

export async function olvidar(
  usuarioId: string,
  consulta: string,
  acceso: AccesoMemoria = {},
): Promise<number> {
  if (!usuarioId.trim()) return 0;
  const recuerdos = await leerRecuerdos();
  const propios = recuerdos.filter((recuerdo) => accesible(recuerdo, usuarioId, acceso));
  const palabras = normalizar(consulta).split(' ').filter((palabra) => palabra.length > 2);
  const comodin = palabras.length === 0 || palabras.every((palabra) => ['eso', 'esto', 'ultimo', 'recuerdo'].includes(palabra));
  const objetivo = comodin
    ? propios.slice(-1)
    : propios.filter((recuerdo) => {
        const texto = normalizar(`${recuerdo.sobre || ''} ${recuerdo.texto}`);
        return palabras.some((palabra) => texto.includes(palabra));
      });

  let borrados = 0;
  for (const recuerdo of objetivo) {
    if (await deleteDataItem(ARCHIVO, COLECCION, recuerdo.id, { skipAutoBackup: true })) borrados++;
  }
  return borrados;
}
