import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const RAIZ = process.cwd();
const ORIGEN = path.join(RAIZ, 'herramientas', 'ak-editor');
const DESTINO_DIR = path.join(RAIZ, 'public', 'descargas');
const DESTINO_ZIP = path.join(DESTINO_DIR, 'ak-editor.zip');

const IGNORAR_DIRS = new Set([
  'pruebas',
  '__pycache__',
  '.pytest_cache',
  '.git',
  '.venv',
  'venv',
  'node_modules',
]);

const EXTENSIONES_IGNORADAS = new Set([
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.wmv',
  '.flv',
  '.webm',
  '.m4v',
  '.pyc',
  '.pyo',
  '.sqlite',
  '.sqlite3',
  '.db',
  '.log',
  '.tmp',
  '.bak',
]);

function debeIgnorar(relPath, esDirectorio) {
  const normalizado = relPath.replace(/\\/g, '/').toLowerCase();
  const partes = normalizado.split('/');
  for (const parte of partes) {
    if (IGNORAR_DIRS.has(parte) || parte.startsWith('.git')) {
      return true;
    }
  }

  if (
    normalizado.startsWith('.venv/') ||
    normalizado.includes('/.venv/') ||
    normalizado.startsWith('venv/') ||
    normalizado.includes('/venv/') ||
    normalizado.startsWith('pruebas/') ||
    normalizado.includes('/pruebas/') ||
    normalizado.includes('__pycache__') ||
    normalizado.includes('.git')
  ) {
    return true;
  }

  if (!esDirectorio) {
    const ext = path.extname(relPath).toLowerCase();
    if (EXTENSIONES_IGNORADAS.has(ext)) {
      return true;
    }
  }

  return false;
}

function leerArchivosRecursivo(dirActual, baseDir, lista = []) {
  if (!fs.existsSync(dirActual)) {
    return lista;
  }

  const entradas = fs.readdirSync(dirActual, { withFileTypes: true });

  for (const entrada of entradas) {
    const fullPath = path.join(dirActual, entrada.name);
    const relPath = path.relative(baseDir, fullPath);

    if (entrada.isDirectory()) {
      if (!debeIgnorar(relPath, true)) {
        leerArchivosRecursivo(fullPath, baseDir, lista);
      }
    } else if (entrada.isFile()) {
      if (!debeIgnorar(relPath, false)) {
        lista.push({ fullPath, relPath });
      }
    }
  }

  return lista;
}

async function empaquetar() {
  console.log(`[Empaquetador] Leyendo archivos desde: ${ORIGEN}`);

  if (!fs.existsSync(ORIGEN)) {
    console.error(`[Empaquetador] Error: No existe el directorio de origen ${ORIGEN}`);
    process.exit(1);
  }

  if (!fs.existsSync(DESTINO_DIR)) {
    fs.mkdirSync(DESTINO_DIR, { recursive: true });
  }

  const archivos = leerArchivosRecursivo(ORIGEN, ORIGEN);
  console.log(`[Empaquetador] Encontrados ${archivos.length} archivos para incluir en el paquete.`);

  const zip = new JSZip();

  for (const { fullPath, relPath } of archivos) {
    const normalizado = relPath.replace(/\\/g, '/');
    const contenido = fs.readFileSync(fullPath);
    zip.file(normalizado, contenido);
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(DESTINO_ZIP, buffer);
  const stats = fs.statSync(DESTINO_ZIP);
  const kb = (stats.size / 1024).toFixed(1);

  console.log(`[Empaquetador] Paquete generado exitosamente: ${DESTINO_ZIP} (${kb} KB)`);

  // Comparación al final para verificar que cada archivo esté en el ZIP con el mismo contenido
  console.log(`[Empaquetador] Verificando contenido del paquete contra el disco...`);
  const zipCargado = await JSZip.loadAsync(fs.readFileSync(DESTINO_ZIP));

  let verificados = 0;
  for (const { fullPath, relPath } of archivos) {
    const normalizado = relPath.replace(/\\/g, '/');
    const entradaZip = zipCargado.file(normalizado);

    if (!entradaZip) {
      throw new Error(`[Empaquetador] Error: Falta el archivo requerido en el ZIP: ${normalizado}`);
    }

    const contenidoZip = await entradaZip.async('nodebuffer');
    const contenidoDisco = fs.readFileSync(fullPath);

    if (!contenidoDisco.equals(contenidoZip)) {
      throw new Error(
        `[Empaquetador] Error: Contenido inconsistente para ${normalizado} (disco: ${contenidoDisco.length} bytes, zip: ${contenidoZip.length} bytes)`
      );
    }
    verificados++;
  }

  console.log(
    `[Empaquetador] Verificación exitosa: ${verificados}/${archivos.length} archivos verificados e idénticos en ${DESTINO_ZIP}.`
  );
}

empaquetar().catch((err) => {
  console.error('[Empaquetador] Error al empaquetar:', err);
  process.exit(1);
});

