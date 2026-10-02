import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

async function main() {
  console.log('--- Generando video resumen de muestra con fotos reales (Orden 106 Bloque 14) ---');

  // 1. Cargar fotos reales desde metadata.json
  const metadataPath = path.join(process.cwd(), 'src/data/social-gallery/metadata.json');
  if (!fs.existsSync(metadataPath)) {
    throw new Error('No se encontró metadata.json');
  }

  const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const fotosReales = meta
    .filter((p) => p.imageUrl && p.imageUrl.startsWith('data:image/jpeg'))
    .slice(0, 24)
    .map((p, idx) => ({
      id: p.id || `foto-${idx}`,
      imageUrl: p.imageUrl,
      authorName: p.authorName || 'Invitado',
      timestamp: p.timestamp || new Date().toISOString(),
    }));

  console.log(`Cargadas ${fotosReales.length} fotos reales de la fiesta.`);

  // 2. Iniciar Chromium con Playwright
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 720, height: 1280 },
  });

  // 3. Ejecutar renderizado en el navegador con MediaRecorder
  const videoBufferBase64 = await page.evaluate(async (data) => {
    const { fotos, titulo, fecha, duracionSegundos } = data;
    const width = 720;
    const height = 1280;
    const fps = 30;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    // Cargar todas las fotos en memoria
    const loadedImgs = await Promise.all(
      fotos.map((f) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = f.imageUrl;
        });
      })
    );

    const validImgs = loadedImgs.filter(Boolean);
    if (validImgs.length === 0) throw new Error('No valid images loaded');

    // Iniciar MediaRecorder
    const stream = canvas.captureStream(fps);
    const chunks = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3500000 });
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const stopPromise = new Promise((resolve) => {
      recorder.onstop = resolve;
    });

    recorder.start();

    const introSegundos = 3;
    const outroSegundos = 3;
    const tiempoFotos = duracionSegundos - introSegundos - outroSegundos;
    const tiempoPorFoto = tiempoFotos / validImgs.length;
    const totalFrames = Math.round(duracionSegundos * fps);

    function dibujarFotogramaKenBurns(img, progresoSlide, opacidad = 1.0) {
      if (opacidad <= 0) return;
      ctx.save();
      ctx.globalAlpha = opacidad;

      // 1. Fondo desenfocado de la misma foto cubriendo todo el canvas vertical 9:16
      const bgScale = Math.max(width / img.width, height / img.height) * 1.15;
      const bgW = img.width * bgScale;
      const bgH = img.height * bgScale;
      const bgX = (width - bgW) / 2;
      const bgY = (height - bgH) / 2;

      ctx.save();
      ctx.filter = 'blur(20px) brightness(0.4)';
      ctx.drawImage(img, bgX, bgY, bgW, bgH);
      ctx.restore();

      // 2. Foto principal centrada con zoom Ken Burns continuo (1.0 -> 1.10)
      const kenBurns = 1.0 + progresoSlide * 0.10;
      const panY = (progresoSlide - 0.5) * 20;

      const fitScale = Math.min((width * 0.92) / img.width, (height * 0.76) / img.height);
      const mainScale = fitScale * kenBurns;
      const mainW = img.width * mainScale;
      const mainH = img.height * mainScale;
      const mainX = (width - mainW) / 2;
      const mainY = (height * 0.45 - mainH / 2) + panY;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      ctx.drawImage(img, mainX, mainY, mainW, mainH);

      ctx.restore();
    }

    // Renderizar fotogramas
    for (let f = 0; f < totalFrames; f++) {
      const t = f / fps;

      // Fondo base
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      if (t < introSegundos) {
        // INTRO
        const introProg = t / introSegundos;
        const alpha = introProg < 0.2 ? introProg / 0.2 : introProg > 0.8 ? (1 - introProg) / 0.2 : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.textAlign = 'center';

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('✨ TU VIDEO DE LA FIESTA ✨', width / 2, height * 0.42);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 44px sans-serif';
        ctx.fillText(titulo, width / 2, height * 0.49);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 24px sans-serif';
        ctx.fillText(fecha, width / 2, height * 0.55);
        ctx.restore();
      } else if (t < duracionSegundos - outroSegundos) {
        // FOTOS CON KEN BURNS Y CROSSFADE
        const tiempoEnFotos = t - introSegundos;
        const fotoIdx = Math.min(
          Math.floor(tiempoEnFotos / tiempoPorFoto),
          validImgs.length - 1
        );
        const tiempoEnFotoActual = tiempoEnFotos - (fotoIdx * tiempoPorFoto);
        const progFoto = tiempoEnFotoActual / tiempoPorFoto;
        const duracionCrossfade = Math.min(0.4, tiempoPorFoto * 0.25);
        const tiempoRestante = tiempoPorFoto - tiempoEnFotoActual;

        const imgActual = validImgs[fotoIdx];
        dibujarFotogramaKenBurns(imgActual, progFoto, 1.0);

        if (tiempoRestante < duracionCrossfade && fotoIdx + 1 < validImgs.length) {
          const transProg = 1 - (tiempoRestante / duracionCrossfade);
          const imgSig = validImgs[fotoIdx + 1];
          dibujarFotogramaKenBurns(imgSig, 0, transProg);
        }

        // Overlays
        ctx.save();
        const topGrad = ctx.createLinearGradient(0, 0, 0, 180);
        topGrad.addColorStop(0, 'rgba(2, 6, 23, 0.85)');
        topGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, 180);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(titulo, width / 2, 70);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(fecha, width / 2, 105);

        const botGrad = ctx.createLinearGradient(0, height - 160, 0, height);
        botGrad.addColorStop(0, 'rgba(2, 6, 23, 0)');
        botGrad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, height - 160, width, 160);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('AK PRODUCCIONES EVENTOS', width / 2, height - 60);
        ctx.restore();
      } else {
        // OUTRO
        const outroProg = (t - (duracionSegundos - outroSegundos)) / outroSegundos;
        const alpha = outroProg < 0.2 ? outroProg / 0.2 : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.textAlign = 'center';

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('MOMENTOS INOLVIDABLES', width / 2, height * 0.44);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 46px sans-serif';
        ctx.fillText('AK PRODUCCIONES', width / 2, height * 0.50);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('akproducciones.uy', width / 2, height * 0.56);
        ctx.restore();
      }

      if (f % 30 === 0) {
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    recorder.stop();
    await stopPromise;

    const blob = new Blob(chunks, { type: mimeType });
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, {
    fotos: fotosReales,
    titulo: 'XV de Valentina - Resumen Oficial',
    fecha: '15 de diciembre de 2026',
    duracionSegundos: 60,
  });

  await browser.close();

  // 4. Guardar archivo en test-results/video-resumen-muestra.webm
  const outputDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'video-resumen-muestra.webm');
  const buffer = Buffer.from(videoBufferBase64, 'base64');
  fs.writeFileSync(outputPath, buffer);

  console.log(`¡Video resumen generado con éxito! Guardado en: ${outputPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error('Error generando video resumen:', err);
  process.exit(1);
});
