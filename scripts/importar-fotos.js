/**
 * Script para importación masiva de fotos al catálogo de AK Producciones.
 * 
 * Uso:
 *   node scripts/importar-fotos.js [--categoria "Nombre Categoria"] [--fiesta "Tipo Fiesta"]
 * 
 * Instrucciones:
 *   1. Colocá tus fotos de eventos reales en la carpeta `data/importar-fotos/`.
 *   2. Ejecutá este script.
 *   3. El script optimizará las fotos, las guardará en el catálogo y las moverá a `procesadas/`.
 */

const fs = require('fs');
const path = require('path');

// ── Rutas ──────────────────────────────────────────────────────────────────
const IMPORT_DIR = path.join(process.cwd(), 'data', 'importar-fotos');
const PROCESSED_DIR = path.join(IMPORT_DIR, 'procesadas');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'media', 'catalogo-servicios');
const JSON_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'catalogo-fotos.json');

// ── Categorización Inteligente por Nombre de Archivo ───────────────────────
const CATEGORIES_KEYWORDS = [
  { keywords: ['deco', 'decoracion', 'mesa', 'centro', 'ambientacion', 'arreglo', 'flores', 'lila', 'rosa', 'dorada'], label: 'Decoración' },
  { keywords: ['catering', 'comida', 'plato', 'recepcion', 'canapes', 'bocados', 'asado', 'cena'], label: 'Catering' },
  { keywords: ['torta', 'postre', 'dulce', 'candy', 'chocolates', 'reposteria', 'pastel'], label: 'Repostería' },
  { keywords: ['barra', 'trago', 'cocktail', 'licor', 'barman', 'bebida', 'copas'], label: 'Barra de Tragos' },
  { keywords: ['discoteca', 'dj', 'pista', 'luces', 'iluminacion', 'pantalla', 'sonido', 'led', 'audio', 'bolas'], label: 'Discoteca' },
  { keywords: ['glitter', 'maquillaje', 'brillo', 'neon', 'pintura'], label: 'Glitter Bar' },
  { keywords: ['cabina', 'photobooth', 'foto', 'video', 'camara', 'vogue', 'espejo', 'plataforma', '360'], label: 'Fotografía y Cabina' },
  { keywords: ['souvenir', 'cotillon', 'regalo', 'tarjeta', 'invitacion'], label: 'Souvenirs y Cotillón' },
];

function guessCategory(filename) {
  const name = filename.toLowerCase();
  for (const item of CATEGORIES_KEYWORDS) {
    if (item.keywords.some(kw => name.includes(kw))) {
      return item.label;
    }
  }
  return 'General';
}

// ── Procesamiento Principal ────────────────────────────────────────────────
async function main() {
  console.log('🚀 Iniciando importación masiva de fotos al catálogo...');

  // Crear directorios si no existen
  if (!fs.existsSync(IMPORT_DIR)) {
    fs.mkdirSync(IMPORT_DIR, { recursive: true });
    console.log(`\n📂 Se creó la carpeta de importación en: ${IMPORT_DIR}`);
    console.log('👉 Colocá las fotos que querés importar en esa carpeta y volvé a ejecutar el script.');
    return;
  }

  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Leer archivos a importar
  const files = fs.readdirSync(IMPORT_DIR).filter(file => {
    const stat = fs.statSync(path.join(IMPORT_DIR, file));
    if (stat.isDirectory()) return false;
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });

  if (files.length === 0) {
    console.log(`\nℹ️  No se encontraron fotos nuevas en: ${IMPORT_DIR}`);
    console.log('👉 Colocá archivos .jpg, .png, .webp o .gif allí para importarlos.');
    return;
  }

  console.log(`📦 Encontradas ${files.length} fotos listas para procesar.`);

  // Intentar cargar la librería 'sharp' para optimización
  let sharp = null;
  try {
    sharp = require('sharp');
    console.log('⚡ Módulo sharp cargado. Se optimizarán y redimensionarán las imágenes.');
  } catch (err) {
    console.log('⚠️  Módulo sharp no instalado. Las fotos se importarán en su tamaño y calidad originales.');
    console.log('💡 Consejo: Para activar la compresión y optimización automática, ejecutá: npm install sharp');
  }

  // Leer JSON del catálogo actual
  let catalogo = [];
  if (fs.existsSync(JSON_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
      catalogo = JSON.parse(raw || '[]');
    } catch (e) {
      console.error('❌ Error al leer el catálogo existente. Se iniciará uno nuevo.', e.message);
    }
  }

  // Procesar argumentos de consola
  const args = process.argv.slice(2);
  let overrideCategory = null;
  let overrideFiesta = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--categoria' && args[i + 1]) {
      overrideCategory = args[i + 1];
    }
    if (args[i] === '--fiesta' && args[i + 1]) {
      overrideFiesta = args[i + 1];
    }
  }

  let count = 0;

  for (const filename of files) {
    const srcPath = path.join(IMPORT_DIR, filename);
    
    // Crear un nombre de archivo seguro y limpio
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    const cleanName = filename.toLowerCase().replace(/[^a-z0-9.]/g, '_');
    const destFilename = `imported_${timestamp}_${random}_${cleanName}`;
    const destPath = path.join(OUTPUT_DIR, destFilename);

    try {
      if (sharp) {
        // Redimensionar si supera los 1600px de ancho y comprimir a calidad 80
        await sharp(srcPath)
          .resize({ width: 1600, withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toFile(destPath);
      } else {
        // Copiar original sin cambios
        fs.copyFileSync(srcPath, destPath);
      }

      // Estructurar metadatos del catálogo
      const categoria = overrideCategory || guessCategory(filename);
      const id = `cat_imp_${timestamp}_${random}`;
      
      // La URL apunta a la ruta pública del servidor
      const urlPath = `/media/catalogo-servicios/${destFilename}`;

      const fotoData = {
        id,
        url: urlPath,
        titulo: filename.substring(0, filename.lastIndexOf('.')).replace(/[-_]/g, ' '),
        descripcion: `Foto de ${categoria.toLowerCase()} importada automáticamente.`,
        categoriaServicio: categoria,
        tipoFiesta: overrideFiesta || undefined,
        destacada: false,
        orden: catalogo.length,
        source: 'catalogo-servicios',
        createdAt: new Date().toISOString(),
      };

      catalogo.push(fotoData);
      
      // Mover el archivo original a procesadas
      const archivePath = path.join(PROCESSED_DIR, filename);
      // Evitar colisión de nombres en procesadas
      if (fs.existsSync(archivePath)) {
        fs.unlinkSync(srcPath); // Si ya existe en archivo, borrar el importado para limpiar
      } else {
        fs.renameSync(srcPath, archivePath);
      }

      console.log(`✅ Procesada: ${filename} -> Categoría: ${categoria}`);
      count++;
    } catch (err) {
      console.error(`❌ Error al procesar ${filename}:`, err.message);
    }
  }

  // Guardar catálogo JSON actualizado
  if (count > 0) {
    try {
      fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(catalogo, null, 2), 'utf-8');
      console.log(`\n🎉 ¡Importación finalizada con éxito!`);
      console.log(`💪 Se agregaron ${count} fotos nuevas al catálogo local.`);
      console.log(`💾 Catálogo guardado en: ${JSON_FILE_PATH}`);
      console.log(`💡 En el próximo reinicio o guardado del panel de control de AK Producciones, los cambios se sincronizarán con Firestore automáticamente.`);
    } catch (err) {
      console.error('❌ Error al guardar el archivo JSON del catálogo:', err.message);
    }
  }
}

main().catch(err => {
  console.error('💥 Ocurrió un error fatal en el script:', err);
});
