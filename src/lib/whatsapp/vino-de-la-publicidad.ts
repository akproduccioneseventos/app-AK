import 'server-only';

import { readData, writeData } from '@/lib/data-service';

/**
 * Distingue a quien llega desde un anuncio de quien escribe al numero personal.
 *
 * ## Por que existe
 *
 * El WhatsApp de la empresa **es el numero personal del dueno**. Un bot que le
 * conteste a cualquiera que escriba es inaceptable: le contestaria a la familia,
 * a los proveedores y a los amigos.
 *
 * Pero **el que llega desde un anuncio de Facebook o Instagram es otra cosa**: es
 * un desconocido que toco "Enviar mensaje" en una publicidad, espera una respuesta
 * comercial, y muchas veces escribe de madrugada. A ese si conviene contestarle al
 * instante, porque es plata que se enfria.
 *
 * ## Como se sabe
 *
 * Meta lo dice en el mensaje: cuando alguien llega tocando un anuncio, **el primer
 * mensaje trae adentro de que anuncio vino** (`referral`). No hay que adivinar
 * nada.
 *
 * **El detalle que arruinaria la idea si se pasa por alto:** ese dato viene
 * **solo en el primer mensaje**. Si se mirara nada mas que eso, el bot contestaria
 * la primera pregunta y despues se quedaria mudo en la mitad de la conversacion,
 * que es peor que no contestar nunca. Por eso se recuerda que esa conversacion
 * empezo en un anuncio, y se le sigue contestando por unos dias.
 */

const ARCHIVO = 'whatsapp-conversaciones-de-publicidad.json';

/** Cuanto se recuerda que una conversacion empezo en un anuncio. */
const SE_RECUERDA_POR_DIAS = 7;

interface ConversacionDePublicidad {
  telefono: string;
  desde: string;
  anuncio?: string;
}

interface Registro {
  conversaciones?: ConversacionDePublicidad[];
}

/** Lo que Meta manda cuando la persona llego tocando un anuncio o una publicacion. */
export interface ReferenciaDeOrigen {
  source_type?: string;
  source_id?: string;
  headline?: string;
}

function soloNumeros(telefono: string): string {
  return String(telefono || '').replace(/\D/g, '');
}

function estaVigente(desde: string, ahoraMs: number): boolean {
  const cuando = new Date(desde).getTime();
  if (!Number.isFinite(cuando)) return false;
  return ahoraMs - cuando < SE_RECUERDA_POR_DIAS * 24 * 60 * 60 * 1000;
}

/**
 * ¿Este mensaje llega desde un anuncio?
 *
 * Vale tanto el anuncio pago (`ad`) como el boton de una publicacion organica
 * (`post`): las dos son piezas de la empresa y la persona escribio por eso.
 */
export function esOrigenDePublicidad(referencia?: ReferenciaDeOrigen | null): boolean {
  const tipo = referencia?.source_type?.toLowerCase();
  return tipo === 'ad' || tipo === 'post';
}

export async function recordarQueVinoDeLaPublicidad(
  telefono: string,
  referencia?: ReferenciaDeOrigen | null,
  ahora: Date = new Date(),
): Promise<void> {
  const numero = soloNumeros(telefono);
  if (!numero) return;

  const registro = await readData<Registro>(ARCHIVO, {});
  const ahoraMs = ahora.getTime();

  const vigentes = (registro.conversaciones || [])
    .filter((c) => c.telefono !== numero && estaVigente(c.desde, ahoraMs));

  vigentes.push({
    telefono: numero,
    desde: ahora.toISOString(),
    anuncio: referencia?.headline || referencia?.source_id,
  });

  await writeData(ARCHIVO, { conversaciones: vigentes }, undefined, { skipAutoBackup: true });
}

/**
 * ¿A esta persona le corresponde respuesta automatica?
 *
 * Si el mensaje trae la referencia del anuncio, se contesta y se recuerda. Si no
 * la trae, se mira si esa conversacion habia empezado en un anuncio hace poco.
 */
export async function correspondeContestarSolo(
  telefono: string,
  referencia?: ReferenciaDeOrigen | null,
  ahora: Date = new Date(),
): Promise<boolean> {
  if (esOrigenDePublicidad(referencia)) {
    await recordarQueVinoDeLaPublicidad(telefono, referencia, ahora);
    return true;
  }

  const numero = soloNumeros(telefono);
  if (!numero) return false;

  const registro = await readData<Registro>(ARCHIVO, {});
  const ahoraMs = ahora.getTime();

  return (registro.conversaciones || []).some(
    (c) => c.telefono === numero && estaVigente(c.desde, ahoraMs),
  );
}
