import type { SocialComment } from '@/types/comentarios-redes';
import { readData, writeData } from '@/lib/data-service';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { AsyncMutex } from '@/lib/mutex';

/**
 * Guardado de los comentarios de redes que FUSIONA por id sobre lo que hay AHORA.
 *
 * Antes, la sincronizacion leia la lista, tardaba minutos llamando a Facebook, Instagram,
 * YouTube y a la IA, y despues escribia la lista entera: borraba lo que el dueño aprobo como
 * testimonio, ocultó o restauró mientras tanto. Ahora cada cambio es un parche por id que se
 * aplica adentro del turno de la base, sobre la lista actual.
 *
 * OJO: `social-comments.json` es UN documento (no una coleccion), por eso `mutateGenericJsonArray`.
 */
export const COMMENTS_FILE = 'social-comments.json';

const turnoLocal = new AsyncMutex();
const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

/** Cambia la lista actual de comentarios adentro de un turno. Devuelve false si `cambiar` dijo que no. */
export async function mutarComentarios(
  cambiar: (lista: SocialComment[]) => SocialComment[] | null,
): Promise<boolean> {
  if (!SIN_BASE()) {
    const resultado = await mutateGenericJsonArray<SocialComment>(COMMENTS_FILE, cambiar);
    return resultado !== null;
  }
  let guardado = false;
  await turnoLocal.runExclusive(async () => {
    const actual = await readData<SocialComment[]>(COMMENTS_FILE, []);
    const nueva = cambiar(Array.isArray(actual) ? actual : []);
    if (nueva) {
      await writeData(COMMENTS_FILE, nueva);
      guardado = true;
    }
  });
  return guardado;
}

// Lo que decide la revision automatica: si otro ya reviso el comentario, no se pisa.
const CLAVES_DE_REVISION: Array<keyof SocialComment> = [
  'sentiment', 'sentimentReason', 'isInsultOrSpam', 'isLegitimateComplaint', 'esPregunta',
  'classifiedAt', 'isAutoHidden', 'autoHiddenReason', 'autoHiddenAt',
];

/** Las claves que cambiaron entre `antes` y `despues`. */
export function parcheEntre(antes: Partial<SocialComment>, despues: SocialComment): Partial<SocialComment> {
  const parche: Record<string, unknown> = {};
  for (const clave of Object.keys(despues) as Array<keyof SocialComment>) {
    if (JSON.stringify(antes[clave]) !== JSON.stringify(despues[clave])) parche[clave] = despues[clave];
  }
  return parche as Partial<SocialComment>;
}

/**
 * Aplica parches por id sobre la lista actual. Un comentario que todavia no esta se agrega;
 * uno que ya esta conserva todo lo que otro le hizo (aprobado como testimonio, ocultado,
 * restaurado, borrado), y solo recibe lo que la sincronizacion cambio.
 */
export function aplicarParches(
  lista: SocialComment[],
  parches: Array<{ id: string; parche: Partial<SocialComment>; completo: SocialComment }>,
): SocialComment[] {
  const porId = new Map(lista.map((c) => [c.id, c]));
  const resultado = [...lista];
  for (const { id, parche, completo } of parches) {
    const actual = porId.get(id);
    if (!actual) {
      resultado.push({ ...completo });
      continue;
    }
    const aplicable: Record<string, unknown> = { ...parche };
    if (actual.classifiedAt) {
      for (const clave of CLAVES_DE_REVISION) delete aplicable[clave];
    }
    if (actual.respuestaAutomatica) delete aplicable.respuestaAutomatica;
    const indice = resultado.indexOf(actual);
    resultado[indice] = { ...actual, ...(aplicable as Partial<SocialComment>) };
  }
  return resultado;
}
