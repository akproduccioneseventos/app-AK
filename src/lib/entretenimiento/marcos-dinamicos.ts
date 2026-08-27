/**
 * Generador de marcos dinámicos con los datos del evento.
 *
 * En vez de requerir imágenes PNG fijas cargadas a mano, dibuja marcos
 * elegantes y animados directamente sobre el canvas usando los datos
 * de la fiesta (nombre del homenajeado, motivo, fecha y paleta de color).
 */

export type EstiloMarcoDinamico = 'elegante' | 'quince' | 'boda' | 'infantil' | 'neon_glam' | 'ninguno';

export interface OpcionesMarcoDinamico {
  estilo?: EstiloMarcoDinamico;
  nombreAgasajado?: string;
  nombreEvento?: string;
  fechaEvento?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  progresoAnimacion?: number; // 0 a 1 para efectos de brillo y confeti
}

/**
 * Dibuja un marco dinámico generado en el canvas con tipografía y detalles temáticos.
 */
export function dibujarMarcoDinamico(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  opciones: OpcionesMarcoDinamico
): void {
  const {
    estilo = 'elegante',
    nombreAgasajado,
    nombreEvento,
    fechaEvento,
    colorPrimario = '#d4af37',
    colorSecundario = '#18181b',
    progresoAnimacion = 0,
  } = opciones;

  if (estilo === 'ninguno') return;

  ctx.save();

  const nombreMostrar = (nombreAgasajado?.trim() || nombreEvento?.trim() || '').toUpperCase();

  if (estilo === 'elegante') {
    // Marco dorado/plata doble línea con esquinas ornamentales
    ctx.strokeStyle = colorPrimario;
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, ancho - 40, alto - 40);

    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, ancho - 72, alto - 72);

    // Destellos dorados en las esquinas
    const tamanoEsquina = 60;
    ctx.fillStyle = colorPrimario;
    // Esquinas
    ctx.fillRect(20, 20, tamanoEsquina, 4);
    ctx.fillRect(20, 20, 4, tamanoEsquina);
    ctx.fillRect(ancho - 20 - tamanoEsquina, 20, tamanoEsquina, 4);
    ctx.fillRect(ancho - 24, 20, 4, tamanoEsquina);
    ctx.fillRect(20, alto - 24, tamanoEsquina, 4);
    ctx.fillRect(20, alto - 20 - tamanoEsquina, 4, tamanoEsquina);
    ctx.fillRect(ancho - 20 - tamanoEsquina, alto - 24, tamanoEsquina, 4);
    ctx.fillRect(ancho - 24, alto - 20 - tamanoEsquina, 4, tamanoEsquina);

    // Banda inferior sutil con el nombre
    if (nombreMostrar) {
      const gradPie = ctx.createLinearGradient(0, alto - 120, 0, alto);
      gradPie.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradPie.addColorStop(0.7, 'rgba(15, 15, 18, 0.85)');
      gradPie.addColorStop(1, 'rgba(15, 15, 18, 0.95)');
      ctx.fillStyle = gradPie;
      ctx.fillRect(0, alto - 120, ancho, 120);

      ctx.fillStyle = colorPrimario;
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nombreMostrar, ancho / 2, alto - 68);

      if (fechaEvento) {
        ctx.fillStyle = '#e4e4e7';
        ctx.font = '500 20px sans-serif';
        ctx.fillText(fechaEvento, ancho / 2, alto - 32);
      }
    }
  } else if (estilo === 'quince') {
    // Marco estilo 15 Años: tono lila/rosa con flores sutiles y confeti
    const colorBorde = colorPrimario || '#ec4899';
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 18;
    ctx.strokeRect(18, 18, ancho - 36, alto - 36);

    // Confeti sutil animado
    ctx.fillStyle = '#f472b6';
    for (let i = 0; i < 15; i++) {
      const px = (i * 137 + progresoAnimacion * 200) % (ancho - 60) + 30;
      const py = (i * 93 + progresoAnimacion * 300) % 100 + 30;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (nombreMostrar) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(ancho / 2 - 260, alto - 110, 520, 80);
      ctx.strokeStyle = colorBorde;
      ctx.lineWidth = 3;
      ctx.strokeRect(ancho / 2 - 260, alto - 110, 520, 80);

      ctx.fillStyle = '#831843';
      ctx.font = 'italic 700 38px "Dancing Script", cursive, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nombreMostrar, ancho / 2, alto - 70);
    }
  } else if (estilo === 'boda') {
    // Marco de bodas: blanco satinado, tipografía fina y corona botánica
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 24;
    ctx.strokeRect(16, 16, ancho - 32, alto - 32);

    ctx.strokeStyle = colorPrimario || '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(34, 34, ancho - 68, alto - 68);

    if (nombreMostrar) {
      ctx.fillStyle = 'rgba(24, 24, 27, 0.88)';
      ctx.fillRect(ancho / 2 - 300, alto - 100, 600, 76);

      ctx.fillStyle = colorPrimario || '#d4af37';
      ctx.font = 'bold 32px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nombreMostrar, ancho / 2, alto - 62);
    }
  } else if (estilo === 'neon_glam') {
    // Marco de neón con resplandor
    ctx.strokeStyle = colorPrimario || '#a855f7';
    ctx.lineWidth = 20;
    ctx.shadowColor = colorPrimario || '#a855f7';
    ctx.shadowBlur = 30;
    ctx.strokeRect(16, 16, ancho - 32, alto - 32);

    ctx.shadowBlur = 0; // Restaurar
    if (nombreMostrar) {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
      ctx.fillRect(0, alto - 100, ancho, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nombreMostrar, ancho / 2, alto - 50);
    }
  }

  ctx.restore();
}
