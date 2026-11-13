/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

describe('Orden 288 Bloque 4: El editor que se baja es el de ahora', () => {
  const RAIZ = process.cwd();
  const DIR_EDITOR = path.join(RAIZ, 'herramientas', 'ak-editor');
  const RUTA_ZIP = path.join(RAIZ, 'public', 'descargas', 'ak-editor.zip');

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

  function debeIgnorar(relPath: string, esDirectorio: boolean): boolean {
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

  function leerArchivosRecursivo(
    dirActual: string,
    baseDir: string,
    lista: { fullPath: string; relPath: string }[] = []
  ) {
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

  it('el archivo zip de descarga existe en public/descargas', () => {
    expect(fs.existsSync(RUTA_ZIP)).toBe(true);
  });

  it('cada archivo de herramientas/ak-editor/ (salvo los excluidos) existe en el ZIP con contenido idéntico', async () => {
    const archivosDisco = leerArchivosRecursivo(DIR_EDITOR, DIR_EDITOR);
    expect(archivosDisco.length).toBeGreaterThan(15);

    const zipBuffer = fs.readFileSync(RUTA_ZIP);
    const zip = await JSZip.loadAsync(zipBuffer);

    // Archivos clave exigidos en la Orden 288
    const archivosClave = [
      'fotos.py',
      'wfolio.py',
      'WFOLIO.md',
      'app.py',
      'video_de_vida.py',
      'redes.py',
    ];

    for (const clave of archivosClave) {
      expect(zip.file(clave)).toBeDefined();
    }

    // Verificar cada archivo del disco
    for (const { fullPath, relPath } of archivosDisco) {
      const relNorm = relPath.replace(/\\/g, '/');
      const entradaZip = zip.file(relNorm);

      expect(entradaZip).not.toBeNull();
      if (entradaZip) {
        const contenidoZip = await entradaZip.async('nodebuffer');
        const contenidoDisco = fs.readFileSync(fullPath);
        expect(contenidoZip.equals(contenidoDisco)).toBe(true);
      }
    }
  });
});

