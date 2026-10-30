import type { AsistentePropuesta } from './propuestas-service';

const ALERTA_NOCHE_RE = /^\[ALERTA NOCHE\]\[fiesta=([^;]+);tema=(programa|personal|barra);hora=([^\]]+)\]\s*/;
const FALTANTE_PERSONAL_RE = /^\[FALTANTE PERSONAL\]\[fiesta=([^;]+);fecha=(\d{4}-\d{2}-\d{2});invitados=(\d+);asignados=(\d+);requeridos=(\d+)\]\s*/;

export function prepararPropuestaFaltantePersonal(
  hallazgo: string,
): Omit<AsistentePropuesta, 'id' | 'estado' | 'createdAt' | 'updatedAt'> | null {
  const match = FALTANTE_PERSONAL_RE.exec(hallazgo);
  if (!match) return null;
  let fiestaId: string;
  try {
    fiestaId = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  const [, , fecha, invitadosTexto, asignadosTexto, requeridosTexto] = match;
  const invitados = Number(invitadosTexto);
  const asignados = Number(asignadosTexto);
  const requeridos = Number(requeridosTexto);
  if (!fiestaId.trim() || !Number.isFinite(invitados) || !Number.isFinite(asignados) || !Number.isFinite(requeridos) || asignados >= requeridos) {
    return null;
  }
  return {
    clave: `faltante-mozos:${fiestaId}:${fecha}:${asignados}:${requeridos}`,
    area: 'fiestas',
    titulo: 'Completar la asignación de mozos',
    quePasa: hallazgo.slice(match[0].length).trim(),
    porQueImporta: `La fiesta tiene ${invitados} invitados estimados y necesita cobertura operativa de mozos.`,
    quePropone: `Revisar la asignación y completar los ${requeridos - asignados} lugares faltantes. No se cambia el equipo automáticamente.`,
    tipoPropuesta: 'faltante_personal',
    fiestaId,
  };
}

export function prepararPropuestaOperativaNoche(
  hallazgo: string,
  quePropone: string,
): Omit<AsistentePropuesta, 'id' | 'estado' | 'createdAt' | 'updatedAt'> | null {
  const match = ALERTA_NOCHE_RE.exec(hallazgo);
  if (!match) return null;

  let fiestaId: string;
  try {
    fiestaId = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  if (!fiestaId.trim() || !/^\d{4}-\d{2}-\d{2}-\d{2}$/.test(match[3])) return null;

  const tema = match[2] as 'programa' | 'personal' | 'barra';
  const hora = match[3];
  const etiquetas = { programa: 'programa atrasado', personal: 'llegada del personal', barra: 'stock de barra' };
  return {
    clave: `agente:vigilante_noche:${fiestaId}:${tema}:${hora}`,
    area: 'fiestas',
    titulo: `Revisar ${etiquetas[tema]}`,
    quePasa: hallazgo.slice(match[0].length).trim(),
    porQueImporta: 'Es un aviso operativo de una fiesta que está en curso.',
    quePropone,
    tipoPropuesta: 'vigilante_noche',
    fiestaId,
    esImportante: true,
  };
}
