import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import ts from 'typescript';

async function main() {
  console.log('--- Generando video resumen de muestra con fotos reales (Órdenes 106 y 111) ---');

  // 1. Cargar 24 fotos reales del catálogo de servicios (fiestas reales, no tiras de fotocabina)
  const catalogoDir = path.join(process.cwd(), 'public/media/catalogo-servicios');
  if (!fs.existsSync(catalogoDir)) {
    throw new Error('No se encontró el directorio de fotos de catálogo');
  }

  const archivos = fs.readdirSync(catalogoDir)
    .filter((f) => f.endsWith('.jpeg') && !f.toLowerCase().includes('cabina') && !f.toLowerCase().includes('strip'))
    .slice(0, 24);

  if (archivos.length < 24) {
    throw new Error(`Se esperaban al menos 24 fotos, se encontraron ${archivos.length}`);
  }

  const fotos = archivos.map((archivo, idx) => {
    const fullPath = path.join(catalogoDir, archivo);
    const buffer = fs.readFileSync(fullPath);
    const base64 = buffer.toString('base64');
    return {
      id: `foto-${idx + 1}`,
      imageUrl: `data:image/jpeg;base64,${base64}`,
      authorName: 'AK Producciones',
      timestamp: new Date(Date.now() - (24 - idx) * 15 * 60 * 1000).toISOString(),
    };
  });

  console.log(`Cargadas ${fotos.length} fotos reales de eventos.`);

  // 2. Transpilar la función oficial de la app desde src/lib/video-resumen/generar-video-resumen.ts
  const appCodePath = path.join(process.cwd(), 'src/lib/video-resumen/generar-video-resumen.ts');
  const appTsSource = fs.readFileSync(appCodePath, 'utf8');
  const transpiled = ts.transpileModule(appTsSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2020,
    },
  });

  // 3. Iniciar Chromium con Playwright
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 720, height: 1280 },
  });

  // Cargar una página básica en blanco
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Generador Video Resumen</title>
      </head>
      <body style="margin: 0; background: #000;">
      </body>
    </html>
  `);

  // 4. Inyectar el módulo oficial de la app directamente en el navegador
  const moduloInyectado = `
    ${transpiled.outputText}
    window.__generarVideoResumenApp = generarVideoResumenWebM;
    window.__appLista = true;
  `;

  await page.addScriptTag({
    type: 'module',
    content: moduloInyectado,
  });

  await page.waitForFunction(() => window.__appLista === true);

  console.log('Módulo oficial de la app cargado en la página.');
  console.log('Iniciando renderizado con la función oficial de la aplicación...');

  // 5. Invocar la función de la app en el navegador pasando las opciones
  const duracionDeseada = 66; // Entre 60 y 90 segundos como pide la orden
  const videoBase64 = await page.evaluate(async (opciones) => {
    const resultado = await window.__generarVideoResumenApp({
      titulo: opciones.titulo,
      fecha: opciones.fecha,
      fotos: opciones.fotos,
      duracionSegundos: opciones.duracionSegundos,
    });

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const urlCompleta = reader.result;
        const b64 = urlCompleta.split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(resultado.blob);
    });
  }, {
    titulo: '15 Años de Martina',
    fecha: '15 de Diciembre de 2026',
    fotos,
    duracionSegundos: duracionDeseada,
  });

  await browser.close();

  // 6. Guardar el video WebM en docs/evidencias/video-resumen-muestra.webm
  const destinoDir = path.join(process.cwd(), 'docs/evidencias');
  if (!fs.existsSync(destinoDir)) {
    fs.mkdirSync(destinoDir, { recursive: true });
  }

  const outputPath = path.join(destinoDir, 'video-resumen-muestra.webm');
  const buffer = Buffer.from(videoBase64, 'base64');
  fs.writeFileSync(outputPath, buffer);

  console.log(`Video de muestra generado con éxito en: ${outputPath}`);
  console.log(`Tamaño final: ${buffer.length} bytes`);
  console.log(`Duración: ${duracionDeseada} segundos.`);
}

main().catch((err) => {
  console.error('Error generando video de muestra:', err);
  process.exit(1);
});
