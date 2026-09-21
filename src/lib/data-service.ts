/**
 * @fileOverview A centralized service for reading and writing data.
 * Firestore is the single source of truth for all environments.
 */
"use server";

import { syncToFirestore, readFromFirestore } from "./firebase-sync";
import { readGenericJsonFile, syncGenericJsonFile, leerGenericJsonParaGuardarEncima } from "./generic-json-store";
import { isSafeTopLevelJsonFile } from "./backup/backup-registry";
import * as logger from "./logger";

const BACKUP_EXCLUDED_FILES = new Set(["_backup-snapshots.json"]);

export interface WriteDataOptions {
  skipAutoBackup?: boolean;
}

function shouldUseLocalJsonOnly(): boolean {
  return process.env.AK_USE_LOCAL_JSON_ONLY === "true";
}

function shouldAllowLocalJsonWrites(): boolean {
  return (
    shouldUseLocalJsonOnly() &&
    process.env.AK_ALLOW_LOCAL_JSON_WRITES === "true"
  );
}

async function scheduleAutoBackupAfterWrite(
  normalizedFilePath: string,
  options?: WriteDataOptions,
): Promise<void> {
  if (options?.skipAutoBackup || BACKUP_EXCLUDED_FILES.has(normalizedFilePath))
    return;

  const backupTask = Promise.all([
    import("@/app/actions/backup"),
    import("./backup/internal-token"),
  ])
    .then(([{ triggerAutoBackup }, { AUTO_BACKUP_INTERNAL_TOKEN }]) =>
      triggerAutoBackup(AUTO_BACKUP_INTERNAL_TOKEN),
    )
    .catch((err) =>
      logger.warn("[data-service] Auto-backup trigger failed:", err),
    );

  try {
    const nextServer = (await import("next/server")) as any;
    if (typeof nextServer.after === "function") {
      nextServer.after(backupTask);
      return;
    }
  } catch (error) {
    logger.warn(
      "[data-service] Post-response context unavailable for auto-backup:",
      error,
    );
  }

  void backupTask;
}

async function readLocalJsonFallback<T>(
  normalizedFilePath: string,
): Promise<T | null> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const localCandidates = [
      path.join(process.cwd(), "data", normalizedFilePath),
      path.join(process.cwd(), "src", "data", normalizedFilePath),
    ];
    for (const localPath of localCandidates) {
      try {
        const raw = await fs.readFile(localPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (!logger.isBuildTime()) {
          logger.warn(
            `[readData] FALLBACK JSON usado para "${normalizedFilePath}"; Firestore vacio o no disponible.`,
          );
        }
        return parsed as T;
      } catch {
        // try next candidate
      }
    }
  } catch {
    // local filesystem fallback unavailable
  }
  return null;
}

async function writeLocalJsonFallback<T>(
  normalizedFilePath: string,
  data: T,
): Promise<void> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const localCandidates = [
      path.join(process.cwd(), "data", normalizedFilePath),
      path.join(process.cwd(), "src", "data", normalizedFilePath),
    ];
    for (const localPath of localCandidates) {
      try {
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, JSON.stringify(data, null, 2), "utf-8");
      } catch {
        // ignore write error for this candidate, try others
      }
    }
  } catch (e) {
    logger.error(
      `[writeLocalJsonFallback] Error escribiendo copia local de "${normalizedFilePath}":`,
      e,
    );
  }
}

/**
 * LEER SABIENDO SI DE VERDAD SE PUDO LEER.
 *
 * **Lo encontro Codex el 17 de septiembre de 2026.** `readData` nunca falla a la vista: si la
 * base no contesta, prueba los respaldos y, si tampoco, **devuelve la lista vacia**. Para casi
 * toda la app eso esta bien —una pantalla vacia es mejor que una pantalla rota—, pero para el
 * respaldo es lo peor que puede pasar: guarda cero fiestas **como si la empresa no tuviera
 * ninguna**, lo marca completo, y la rotacion borra la copia buena.
 *
 * Por eso ahora hay una version que ademas del dato dice **si hubo falla**. La de siempre queda
 * igual para todos los demas.
 */
/**
 * Tope de espera para LEER de la base.
 *
 * **Por que existe, y es lo que tiraba la app abajo.** Delante del servidor hay un portero
 * que corta cualquier pedido que pase de unos diez segundos. Si una lectura de la base se
 * quedaba colgada, el pedido entero llegaba a ese corte y el visitante no veia una pantalla
 * vacia: veia **el error del servidor**, con la app aparentemente caida. Asi se reporto en
 * produccion el 10 de setiembre de 2026.
 *
 * Con el tope, a los ocho segundos la lectura se da por fallada **antes** de que corte el
 * portero. Ahi entra el camino que ya existia: se prueba el otro deposito, despues la copia
 * local, y si no hay nada se devuelve el valor por defecto. La pantalla abre.
 *
 * **Se usa solo para leer, nunca para guardar.** Un guardado cortado por tiempo puede haber
 * quedado hecho igual, y decirle a alguien "no se guardo" cuando si se guardo es peor que
 * esperar: con un cobro, seria cobrarle dos veces.
 *
 * Y la falla se sigue contando como falla (`huboFalla`), para que el respaldo no guarde cero
 * fiestas como si la empresa no tuviera ninguna.
 */
const TOPE_DE_LECTURA_MS = 8000;

class LecturaDemorada extends Error {
  readonly esLecturaDemorada = true;
  constructor(queSeLeia: string) {
    super(`La base no contesto a tiempo leyendo ${queSeLeia}.`);
  }
}

/**
 * El tope es UNO para toda la lectura, no uno por intento.
 *
 * Con un tope por intento, una base colgada sumaba ocho segundos del primer deposito mas
 * ocho del segundo: dieciseis en total, o sea **mas que los diez del portero**, y el arreglo
 * no arreglaba nada. Por eso se reparte un unico plazo entre todos los intentos.
 */
function conTopeDeLectura<T>(tarea: Promise<T>, queSeLeia: string, vence: number): Promise<T> {
  const restante = Math.max(0, vence - Date.now());
  let reloj: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    tarea,
    new Promise<never>((_, rechazar) => {
      reloj = setTimeout(() => rechazar(new LecturaDemorada(queSeLeia)), restante);
    }),
  ]).finally(() => {
    if (reloj) clearTimeout(reloj);
  });
}

export async function readDataConDetalle<T>(
  filePath: string,
  defaultValue: T,
): Promise<{ valor: T; huboFalla: boolean }> {
  if (filePath.includes("..") || filePath.startsWith("/"))
    throw new Error("Invalid data file path");
  const normalizedFilePath = filePath.replace(/\\/g, "/");
  // El plazo se cuenta desde aca y lo comparten todos los intentos.
  const vence = Date.now() + TOPE_DE_LECTURA_MS;

  if (shouldUseLocalJsonOnly()) {
    const fallbackData = await readLocalJsonFallback<T>(normalizedFilePath);
    return { valor: fallbackData ?? defaultValue, huboFalla: false };
  }

  try {
    const data = await conTopeDeLectura(readFromFirestore(normalizedFilePath), normalizedFilePath, vence);
    if (data !== null && data !== undefined) {
      if (Array.isArray(defaultValue) && !Array.isArray(data))
        return { valor: defaultValue, huboFalla: false };
      return { valor: data as T, huboFalla: false };
    }
    const genericData = await conTopeDeLectura(readGenericJsonFile(normalizedFilePath), normalizedFilePath, vence);
    if (genericData !== null && genericData !== undefined) {
      if (Array.isArray(defaultValue) && !Array.isArray(genericData))
        return { valor: defaultValue, huboFalla: false };
      return { valor: genericData as T, huboFalla: false };
    }
    const fallbackData = await readLocalJsonFallback<T>(normalizedFilePath);
    if (fallbackData !== null) return { valor: fallbackData, huboFalla: false };
    // No hay dato en ningun lado y nada fallo: esto todavia no se escribio nunca.
    return { valor: defaultValue, huboFalla: false };
  } catch (e) {
    if (!logger.isBuildTime() || !logger.isDefaultCredentialError(e)) {
      logger.error(
        `[readData] Error leyendo ${normalizedFilePath} desde Firestore:`,
        logger.compactError(e),
      );
    }
    try {
      const genericData = await conTopeDeLectura(readGenericJsonFile(normalizedFilePath), normalizedFilePath, vence);
      if (genericData !== null && genericData !== undefined) {
        if (Array.isArray(defaultValue) && !Array.isArray(genericData))
          return { valor: defaultValue, huboFalla: true };
        return { valor: genericData as T, huboFalla: false };
      }
    } catch {
      // Si el segundo intento tambien se cae, sigue siendo una falla de lectura.
    }
    const fallbackData = await readLocalJsonFallback<T>(normalizedFilePath);
    // El archivo local puede estar viejo: sirve para mostrar, no para dar por buena una copia.
    if (fallbackData !== null) return { valor: fallbackData, huboFalla: true };
    return { valor: defaultValue, huboFalla: true };
  }
}

export async function readData<T>(
  filePath: string,
  defaultValue: T,
): Promise<T> {
  const { valor } = await readDataConDetalle(filePath, defaultValue);
  return valor;
}

export async function writeData<T>(
  filePath: string,
  data: T,
  sortFn?: (a: any, b: any) => number,
  options?: WriteDataOptions,
): Promise<void> {
  if (filePath.includes("..") || filePath.startsWith("/"))
    throw new Error("Invalid data file path");

  const normalizedFilePath = filePath.replace(/\\/g, "/");
  let dataToWrite: T = data;
  if (Array.isArray(data) && sortFn)
    dataToWrite = [...data].sort(sortFn) as unknown as T;

  if (shouldUseLocalJsonOnly()) {
    if (shouldAllowLocalJsonWrites()) {
      await writeLocalJsonFallback(normalizedFilePath, dataToWrite);
      return;
    }
    throw new Error(
      "La escritura esta deshabilitada en el modo local de pruebas.",
    );
  }

  try {
    await syncToFirestore(normalizedFilePath, dataToWrite);
    if (isSafeTopLevelJsonFile(normalizedFilePath)) {
      const persisted = await readFromFirestore(normalizedFilePath);
      if (persisted === null || persisted === undefined) {
        await syncGenericJsonFile(normalizedFilePath, dataToWrite);
      }
    }
    await writeLocalJsonFallback(normalizedFilePath, dataToWrite);
  } catch (err) {
    logger.error(
      `[writeData] Error escribiendo ${filePath} en Firestore:`,
      err,
    );
    throw new Error(
      `Error al guardar datos en Firestore: ${err instanceof Error ? err.message : err}`,
    );
  }

  await scheduleAutoBackupAfterWrite(normalizedFilePath, options);
}

function validateCollectionMutationInput(filePath: string, collectionName: string, documentId: string) {
  if (filePath.includes("..") || filePath.startsWith("/"))
    throw new Error("Invalid data file path");
  if (!/^[a-zA-Z0-9_-]+$/.test(collectionName))
    throw new Error("Invalid Firestore collection name");
  if (!documentId || documentId.includes("/"))
    throw new Error("Invalid Firestore document id");
}

function cleanCollectionItem<T extends object>(item: T): T {
  return JSON.parse(JSON.stringify(item)) as T;
}

async function refreshCollectionFallback(
  normalizedFilePath: string,
  options?: WriteDataOptions,
): Promise<void> {
  const persisted = await readFromFirestore(normalizedFilePath);
  if (persisted !== null && persisted !== undefined) {
    await writeLocalJsonFallback(normalizedFilePath, persisted);
  }
  await scheduleAutoBackupAfterWrite(normalizedFilePath, options);
}

export async function createDataItem<T extends object>(
  filePath: string,
  collectionName: string,
  documentId: string,
  item: T,
  options?: WriteDataOptions,
): Promise<void> {
  validateCollectionMutationInput(filePath, collectionName, documentId);
  if (shouldUseLocalJsonOnly()) {
    throw new Error("La escritura esta deshabilitada en el modo local de pruebas.");
  }

  const normalizedFilePath = filePath.replace(/\\/g, "/");
  const { dbAdmin } = await import("./firebase/server");
  if (!dbAdmin) throw new Error("Firestore no esta disponible.");
  await dbAdmin.collection(collectionName).doc(documentId).create({
    ...cleanCollectionItem(item),
    _syncedAt: new Date().toISOString(),
  });
  await refreshCollectionFallback(normalizedFilePath, options);
}

export async function updateDataItem<T extends object>(
  filePath: string,
  collectionName: string,
  documentId: string,
  item: T,
  options?: WriteDataOptions,
): Promise<boolean> {
  validateCollectionMutationInput(filePath, collectionName, documentId);
  if (shouldUseLocalJsonOnly()) {
    throw new Error("La escritura esta deshabilitada en el modo local de pruebas.");
  }

  const normalizedFilePath = filePath.replace(/\\/g, "/");
  const { dbAdmin } = await import("./firebase/server");
  if (!dbAdmin) throw new Error("Firestore no esta disponible.");
  const ref = dbAdmin.collection(collectionName).doc(documentId);
  let updated = false;
  await dbAdmin.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    transaction.set(ref, {
      ...cleanCollectionItem(item),
      _syncedAt: new Date().toISOString(),
    });
    updated = true;
  });
  if (updated) await refreshCollectionFallback(normalizedFilePath, options);
  return updated;
}

export async function deleteDataItem(
  filePath: string,
  collectionName: string,
  documentId: string,
  options?: WriteDataOptions,
): Promise<boolean> {
  validateCollectionMutationInput(filePath, collectionName, documentId);
  if (shouldUseLocalJsonOnly()) {
    throw new Error("La escritura esta deshabilitada en el modo local de pruebas.");
  }

  const normalizedFilePath = filePath.replace(/\\/g, "/");
  const { dbAdmin } = await import("./firebase/server");
  if (!dbAdmin) throw new Error("Firestore no esta disponible.");
  const ref = dbAdmin.collection(collectionName).doc(documentId);
  let deleted = false;
  await dbAdmin.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    transaction.delete(ref);
    deleted = true;
  });
  if (deleted) await refreshCollectionFallback(normalizedFilePath, options);
  return deleted;
}

function deepMerge(target: any, source: any): any {
  if (Array.isArray(target) && Array.isArray(source)) {
    const merged = [...target];
    source.forEach((sourceItem, index) => {
      if (
        sourceItem &&
        typeof sourceItem === "object" &&
        "id" in sourceItem &&
        sourceItem.id
      ) {
        const targetIndex = merged.findIndex(
          (item) =>
            item &&
            typeof item === "object" &&
            "id" in item &&
            item.id === sourceItem.id,
        );
        if (targetIndex > -1) {
          merged[targetIndex] = deepMerge(merged[targetIndex], sourceItem);
        } else {
          merged.push(sourceItem);
        }
      } else if (index < merged.length) {
        merged[index] = deepMerge(merged[index], sourceItem);
      } else {
        merged.push(sourceItem);
      }
    });
    return merged;
  }
  if (
    target &&
    typeof target === "object" &&
    source &&
    typeof source === "object"
  ) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (key in target) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
  return source;
}

export async function updateDataPartial<T extends Record<string, any>>(
  filePath: string,
  partialData: Partial<T>,
  options?: WriteDataOptions,
): Promise<void> {
  if (filePath.includes("..") || filePath.startsWith("/"))
    throw new Error("Invalid data file path");

  const normalizedFilePath = filePath.replace(/\\/g, "/");

  if (shouldUseLocalJsonOnly()) {
    throw new Error(
      "La escritura esta deshabilitada en el modo local de pruebas.",
    );
  }

  try {
    await syncToFirestore(normalizedFilePath, partialData);
    if (isSafeTopLevelJsonFile(normalizedFilePath)) {
      // Si NO se pudo leer lo que habia, no se guarda: guardar encima con la mano
      // vacia borraria todo lo demas del documento. Ver el comentario largo en
      // leerGenericJsonParaGuardarEncima.
      const lectura = await leerGenericJsonParaGuardarEncima(normalizedFilePath);
      if (!lectura.sePudoLeer) {
        throw new Error(
          'No se pudo leer lo que ya estaba guardado, asi que el cambio no se guardo para no borrar el resto. Probá de nuevo en un momento.',
        );
      }
      const existing = (lectura.datos as Record<string, any>) || {};
      const merged = deepMerge(existing, partialData);
      await syncGenericJsonFile(normalizedFilePath, merged);
      await writeLocalJsonFallback(normalizedFilePath, merged);
    } else {
      const existing =
        (await readLocalJsonFallback<T>(normalizedFilePath)) || ({} as T);
      const merged = deepMerge(existing, partialData);
      await writeLocalJsonFallback(normalizedFilePath, merged);
    }
  } catch (err) {
    logger.error(
      `[updateDataPartial] Error actualizando ${filePath} en Firestore:`,
      err,
    );
    throw new Error(
      `Error al actualizar datos en Firestore: ${err instanceof Error ? err.message : err}`,
    );
  }

  await scheduleAutoBackupAfterWrite(normalizedFilePath, options);
}
