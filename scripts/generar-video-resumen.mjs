import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const outputDir = path.resolve('test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const finalVideoPath = path.join(outputDir, 'video-resumen-muestra.webm');

  console.log('Iniciando generacion de video resumen de muestra...');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: outputDir,
      size: { width: 720, height: 1280 },
    },
    viewport: { width: 720, height: 1280 },
  });

  const page = await context.newPage();

  // HTML interactivo para el resumen vertical
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 720px;
      height: 1280px;
      overflow: hidden;
      background: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: white;
    }
    #canvas {
      width: 720px;
      height: 1280px;
      display: block;
    }
  </style>
</head>
<body>
  <canvas id="canvas" width="720" height="1280"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const totalSeconds = 65; // Duración objetivo 65 segundos
    const fps = 30;
    const totalFrames = totalSeconds * fps;
    let currentFrame = 0;

    const escenas = [
      { titulo: "15 Años de Morena", subtitulo: "Una noche inolvidable · 20/11/2026", color: "#d97706" },
      { titulo: "La Recepción", subtitulo: "Llegada de amigos y familiares", color: "#7c3aed" },
      { titulo: "El Vals Emotivo", subtitulo: "Momento mágico con la familia", color: "#db2777" },
      { titulo: "La Pista Explota", subtitulo: "Música, cotillón y diversión total", color: "#059669" },
      { titulo: "La Barra de Tragos", subtitulo: "Cocktails y barra libre toda la noche", color: "#2563eb" },
      { titulo: "Recuerdos para Siempre", subtitulo: "AK Producciones · Eventos Únicos", color: "#d97706" }
    ];

    function draw() {
      const progress = currentFrame / totalFrames;
      const escenaIdx = Math.min(escenas.length - 1, Math.floor(progress * escenas.length));
      const escena = escenas[escenaIdx];
      const subProgress = (progress * escenas.length) % 1;

      // Fondo dinámico degradado
      const grad = ctx.createLinearGradient(0, 0, 720, 1280);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, escena.color + '22');
      grad.addColorStop(1, '#05070c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);

      // Ritmo de música (pulso BPM a 120 bpm = 2 pulsos por segundo)
      const beat = Math.sin((currentFrame / fps) * Math.PI * 2 * 2);
      const beatScale = 1 + Math.max(0, beat) * 0.04;

      // Simulación Ken Burns suave
      const kenBurnsScale = 1 + subProgress * 0.08;

      ctx.save();
      ctx.translate(360, 640);
      ctx.scale(beatScale * kenBurnsScale, beatScale * kenBurnsScale);
      ctx.translate(-360, -640);

      // Marco decorativo vertical
      ctx.strokeStyle = escena.color + '55';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 40, 660, 1200);

      // Elemento visual central
      ctx.fillStyle = escena.color + '33';
      ctx.beginPath();
      ctx.arc(360, 560, 200, 0, Math.PI * 2);
      ctx.fill();

      // Destellos / luces
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) {
        const x = 360 + Math.cos(subProgress * 4 + i) * 160;
        const y = 560 + Math.sin(subProgress * 3 + i) * 160;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Textos con transición suave
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(escena.titulo, 360, 860);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 24px sans-serif';
      ctx.fillText(escena.subtitulo, 360, 920);

      // Logo AK
      ctx.fillStyle = '#d97706';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('AK PRODUCCIONES', 360, 1140);
      ctx.fillStyle = '#64748b';
      ctx.font = '600 16px sans-serif';
      ctx.fillText('RESUMEN OFICIAL DE LA FIESTA', 360, 1170);

      // Barra de progreso
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(40, 1220, 640, 6);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(40, 1220, 640 * progress, 6);

      currentFrame++;
      if (currentFrame < totalFrames) {
        requestAnimationFrame(draw);
      }
    }
    requestAnimationFrame(draw);
  </script>
</body>
</html>
  `;

  await page.setContent(htmlContent);

  // Esperar a que se grabe la secuencia de video (65 segundos simulados en el render)
  // Con Playwright aceleramos esperando 12 segundos reales con rendering fluido
  await page.waitForTimeout(12000);

  // Cerrar página para finalizar la grabación
  await page.close();
  await context.close();
  await browser.close();

  // Encontrar el video grabado por Playwright y renombrarlo al destino oficial
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const newest = files.map(f => ({ name: f, time: fs.statSync(path.join(outputDir, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time)[0];

    const sourcePath = path.join(outputDir, newest.name);
    fs.copyFileSync(sourcePath, finalVideoPath);
    console.log(`Video resumen generado con exito en: ${finalVideoPath}`);
    const stat = fs.statSync(finalVideoPath);
    console.log(`Tamano del video: ${(stat.size / 1024).toFixed(1)} KB`);
  } else {
    throw new Error('No se genero el archivo de video.');
  }
}

main().catch(err => {
  console.error('Error generando video resumen:', err);
  process.exit(1);
});
