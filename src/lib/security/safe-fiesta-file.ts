import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

/**
 * Valida que un identificador de fiesta sea un segmento simple de ruta,
 * sin separadores ni secuencias de recorrido (`..`).
 */
export function validarFiestaIdSeguro(fiestaId: unknown): string | null {
  if (typeof fiestaId !== 'string') return null;
  const trimmed = fiestaId.trim();
  if (!trimmed || trimmed !== fiestaId) return null;
  if (trimmed === '.' || trimmed === '..') return null;
  if (
    trimmed.includes('..') ||
    trimmed.includes('/') ||
    trimmed.includes('\\') ||
    trimmed.includes('\0')
  ) {
    return null;
  }
  if (path.basename(trimmed) !== trimmed) return null;
  return trimmed;
}

/**
 * Carpetas locales permitidas por módulo, siempre acotadas al `safeFiestaId`.
 */
export function getFiestaLocalAllowedDirs(
  kind: 'buzon' | 'social-gallery' | 'recuerdos' | 'documentos',
  safeFiestaId: string,
): string[] {
  const cwd = process.cwd();
  switch (kind) {
    case 'buzon':
      return [
        path.resolve(cwd, 'src', 'data', 'buzon-uploads', safeFiestaId),
        path.resolve(cwd, 'src', 'data', 'buzon', safeFiestaId),
        path.resolve(cwd, 'data', 'buzon', safeFiestaId),
        path.resolve(cwd, 'public', 'uploads', 'buzon', safeFiestaId),
      ];
    case 'social-gallery':
      return [
        path.resolve(cwd, 'src', 'data', 'social-gallery', safeFiestaId),
        path.resolve(cwd, 'data', 'social-gallery', safeFiestaId),
        path.resolve(cwd, 'public', 'uploads', 'social-gallery', safeFiestaId),
      ];
    case 'recuerdos':
      return [
        path.resolve(cwd, 'src', 'data', 'social-gallery', safeFiestaId),
        path.resolve(cwd, 'data', 'social-gallery', safeFiestaId),
        path.resolve(cwd, 'public', 'uploads', 'social-gallery', safeFiestaId),
        path.resolve(cwd, 'src', 'data', 'buzon-uploads', safeFiestaId),
        path.resolve(cwd, 'src', 'data', 'buzon', safeFiestaId),
        path.resolve(cwd, 'data', 'buzon', safeFiestaId),
        path.resolve(cwd, 'public', 'uploads', 'buzon', safeFiestaId),
      ];
    case 'documentos':
      return [
        path.resolve(cwd, 'src', 'data', 'documentos-varios-fiesta', safeFiestaId),
      ];
  }
}

function isInsideDir(candidate: string, resolvedDir: string): boolean {
  const prefix = resolvedDir.endsWith(path.sep) ? resolvedDir : `${resolvedDir}${path.sep}`;
  return candidate.startsWith(prefix);
}

/**
 * Resuelve todos los caminos locales únicos válidos dentro de `allowedDirs` para una
 * referencia de archivo, en orden de prioridad. Devuelve `[]` si la referencia intenta
 * escapar o contiene secuencias no permitidas.
 */
export function resolverCandidatosSegurosDeFiesta(
  rawInput: string,
  allowedDirs: readonly string[],
  options?: { apiPrefix?: string },
): string[] {
  if (typeof rawInput !== 'string') return [];
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.includes('\0')) return [];

  let normalizedInput = trimmed;
  if (options?.apiPrefix && normalizedInput.startsWith(options.apiPrefix)) {
    normalizedInput = normalizedInput.slice(options.apiPrefix.length);
    if (!normalizedInput || normalizedInput.includes('/') || normalizedInput.includes('\\')) {
      return [];
    }
  }

  if (normalizedInput.split(/[/\\]+/).some((seg) => seg.startsWith('.'))) {
    return [];
  }

  const cwd = process.cwd();
  const candidates: string[] = [];
  const seen = new Set<string>();
  const addCandidate = (candidatePath: string) => {
    if (!seen.has(candidatePath)) {
      seen.add(candidatePath);
      candidates.push(candidatePath);
    }
  };

  for (const dir of allowedDirs) {
    const resolvedDir = path.resolve(dir);

    if (normalizedInput.startsWith('/uploads/')) {
      const fromPublic = path.resolve(cwd, 'public', normalizedInput.slice(1));
      if (isInsideDir(fromPublic, resolvedDir)) {
        addCandidate(fromPublic);
      }
      continue;
    }

    if (path.isAbsolute(normalizedInput)) {
      const absCandidate = path.resolve(normalizedInput);
      if (isInsideDir(absCandidate, resolvedDir)) {
        addCandidate(absCandidate);
      }
      continue;
    }

    const fromCwd = path.resolve(cwd, normalizedInput);
    if (isInsideDir(fromCwd, resolvedDir)) {
      addCandidate(fromCwd);
    }

    const fromDir = path.resolve(resolvedDir, normalizedInput);
    if (isInsideDir(fromDir, resolvedDir)) {
      addCandidate(fromDir);
    }
  }

  return candidates;
}

/**
 * Resuelve una referencia de archivo local únicamente dentro de `allowedDirs`.
 * Devuelve `null` si la referencia intenta escapar o no pertenece a ninguna carpeta permitida.
 */
export function resolverRutaSeguraDeFiesta(
  rawInput: string,
  allowedDirs: readonly string[],
  options?: { apiPrefix?: string },
): string | null {
  const candidates = resolverCandidatosSegurosDeFiesta(rawInput, allowedDirs, options);
  return candidates[0] ?? null;
}

/**
 * Lee un archivo local verificando que resuelve y permanece (incluso tras `realpath`)
 * dentro de una de las carpetas permitidas para esa fiesta.
 */
export async function leerArchivoSeguroDeFiesta(
  rawInput: string,
  allowedDirs: readonly string[],
  options?: { apiPrefix?: string },
): Promise<Buffer> {
  const candidates = resolverCandidatosSegurosDeFiesta(rawInput, allowedDirs, options);
  if (candidates.length === 0) {
    throw new Error('Ruta local no permitida');
  }

  let resolvedRealDirs: string[] | null = null;
  const getRealDirs = async (): Promise<string[]> => {
    if (resolvedRealDirs !== null) return resolvedRealDirs;
    const dirs: string[] = [];
    for (const dir of allowedDirs) {
      try {
        dirs.push(await fs.realpath(path.resolve(dir)));
      } catch {
        // La carpeta puede no existir; seguimos probando las demás.
      }
    }
    resolvedRealDirs = dirs;
    return dirs;
  };

  let lastError: unknown = null;

  for (const candidate of candidates) {
    let realFile: string;
    try {
      realFile = await fs.realpath(candidate);
    } catch (error) {
      lastError = error;
      continue;
    }

    const realDirs = await getRealDirs();
    const insideRealDir = realDirs.some((realDir) => isInsideDir(realFile, realDir));
    if (!insideRealDir) {
      throw new Error('Ruta local no permitida');
    }

    return fs.readFile(realFile);
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  const notFoundError = new Error('Archivo no encontrado') as NodeJS.ErrnoException;
  notFoundError.code = 'ENOENT';
  throw notFoundError;
}

/**
 * Sólo permite descargas HTTPS desde los dominios oficiales de Firebase Storage.
 */
export function isStorageUrlAllowed(rawUrl: string): boolean {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    const hostname = url.hostname.toLowerCase();
    return (
      hostname === 'firebasestorage.googleapis.com' ||
      hostname === 'storage.googleapis.com' ||
      hostname === 'firebasestorage.app' ||
      hostname.endsWith('.firebasestorage.app')
    );
  } catch {
    return false;
  }
}

/**
 * Descarga un archivo desde Firebase Storage con validación de dominio, límite de tamaño
 * y corte por tiempo (`AbortController`).
 */
export async function fetchStorageWithTimeout(
  rawUrl: string,
  maxBytes: number,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<{ buffer: Buffer; contentType: string | null }> {
  if (!isStorageUrlAllowed(rawUrl)) {
    throw new Error('URL no permitida por seguridad');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: 'error',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const contentLengthHeader = response.headers?.get?.('content-length');
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error('El archivo excede el límite permitido');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) {
      throw new Error('El archivo excede el límite permitido');
    }

    return {
      buffer,
      contentType: response.headers?.get?.('content-type') ?? null,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Variante conveniente que devuelve directamente el `Buffer` descargado.
 */
export async function fetchStorageBufferWithTimeout(
  rawUrl: string,
  maxBytes: number,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<Buffer> {
  const { buffer } = await fetchStorageWithTimeout(rawUrl, maxBytes, timeoutMs);
  return buffer;
}
