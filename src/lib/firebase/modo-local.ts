/**
 * Cuando la app corre con archivos locales (`AK_USE_LOCAL_JSON_ONLY=true`), algunas partes
 * —sesiones de las estaciones, mural, fotos— se apagaban, porque viven en la base y el
 * deposito de archivos. Asi el entorno de pruebas no podia probarlas (Codex, orden 114 punto 3).
 *
 * Ahora, si hay un EMULADOR de la base o del deposito (el que levanta `npm run entorno:pruebas`),
 * esas partes lo usan. Es la misma regla que ya tenia `src/lib/firebase/server.ts`. Solo se
 * acepta un emulador en esta misma maquina: nunca una base de verdad.
 */
const ES_LOCAL = /^(127\.0\.0\.1|localhost|\[::1\]):\d+$/;

function emuladorLocal(variable: string | undefined): boolean {
  return Boolean(variable && ES_LOCAL.test(variable));
}

/** Hay emulador de la base en esta maquina. */
export function hayEmuladorDeBase(): boolean {
  return emuladorLocal(process.env.FIRESTORE_EMULATOR_HOST);
}

/** Hay emulador del deposito de archivos en esta maquina. */
export function hayEmuladorDeArchivos(): boolean {
  return emuladorLocal(process.env.FIREBASE_STORAGE_EMULATOR_HOST);
}

/** Lo que vive en la base se trata como apagado: archivos locales y sin emulador. */
export function sinBaseDisponible(): boolean {
  return process.env.AK_USE_LOCAL_JSON_ONLY === 'true' && !hayEmuladorDeBase();
}

/** Lo que vive en el deposito se guarda como texto en el registro: archivos locales y sin emulador. */
export function sinDepositoDisponible(): boolean {
  return process.env.AK_USE_LOCAL_JSON_ONLY === 'true' && !hayEmuladorDeArchivos();
}
