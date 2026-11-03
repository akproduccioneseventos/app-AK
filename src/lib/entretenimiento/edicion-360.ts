export type EstiloEdicion360 = 'lento_y_vuelta' | 'solo_camara_lenta' | 'normal';

/**
 * Normaliza cualquier variante de texto para el estilo de edición 360
 * (ej: "Lento y vuelta", "Sólo cámara lenta", "Solo camara lenta", "Normal").
 */
export function normalizarEstiloEdicion360(estilo?: EstiloEdicion360 | string): EstiloEdicion360 {
  const norm = String(estilo || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (norm === 'normal') return 'normal';
  if (norm.includes('solo') || norm === 'solo_camara_lenta') return 'solo_camara_lenta';
  return 'lento_y_vuelta';
}

/**
 * Construye la secuencia de índices de cuadro para renderizar el video 360 editado.
 *
 * Receta:
 * 1. Tramo 1 (Arranque normal): 0 al 25% de los cuadros originales a 1x sin repetir.
 * 2. Transición suave de entrada a cámara lenta (~0.4s, interpolando velocidad de 1x a 1/3x).
 * 3. Tramo 2 (Cámara lenta): del 25% al 75% a 1/3 de velocidad (cuadros repetidos unas 3 veces).
 * 4. Transición suave de salida (~0.4s, volviendo de 1/3x a 1x).
 * 5. Tramo 3 (Vuelta a normal): último 25% a velocidad real 1x sin repetir.
 * 6. Tramo 4 (Ida y vuelta / boomerang): si estilo === 'lento_y_vuelta', agrega los últimos
 *    1.5 segundos en orden inverso.
 *
 * Para grabaciones de 10 a 15 segundos (300 a 450 cuadros a 30 fps), la duración
 * final resultante queda acotada entre 12 y 20 segundos.
 */
export function armarLineaDeTiempo360(
  cantidadCuadros: number,
  fps: number = 30,
  estilo: EstiloEdicion360 | string = 'lento_y_vuelta'
): number[] {
  if (!cantidadCuadros || cantidadCuadros <= 0) return [];
  if (cantidadCuadros === 1) return [0];

  const estiloNorm = normalizarEstiloEdicion360(estilo);
  if (estiloNorm === 'normal') {
    return Array.from({ length: cantidadCuadros }, (_, i) => i);
  }

  // Casos borde con muy pocos cuadros: devolver secuencia simple sin crashear
  if (cantidadCuadros < 8) {
    return Array.from({ length: cantidadCuadros }, (_, i) => i);
  }

  const c1 = Math.floor(cantidadCuadros * 0.25);
  const c2 = Math.floor(cantidadCuadros * 0.75);

  const forward: number[] = [];

  // 1. Tramo 1 (Arranque normal): 0 al 25% a velocidad real 1x (sin repetir)
  for (let i = 0; i < c1; i++) {
    forward.push(i);
  }

  // 2. Transición suave de entrada a cámara lenta (~0.4s)
  const duracionTransicionSec = 0.4;
  const transicionFramesMax = Math.round(duracionTransicionSec * fps);
  const rangoMedio = c2 - c1;
  // En grabaciones normales dura ~0.4s (12 cuadros a 30 fps);
  // en grabaciones cortas se acota proporcionalmente al tamaño del tramo medio
  const transicionCuadros = Math.max(1, Math.min(transicionFramesMax, Math.floor(rangoMedio * 0.15)));

  const transInStart = c1;
  const transInEnd = c1 + transicionCuadros;
  const transOutStart = c2 - transicionCuadros;
  const transOutEnd = c2;

  for (let i = transInStart; i < transInEnd; i++) {
    const p = transicionCuadros > 1 ? (i - transInStart) / (transicionCuadros - 1) : 1;
    const repeticiones = Math.max(1, Math.min(3, Math.round(1 + p * 2)));
    for (let r = 0; r < repeticiones; r++) {
      forward.push(i);
    }
  }

  // 3. Tramo 2 (Cámara lenta pura): del 25% al 75%
  // Mantiene cada cuadro repetido unas 3 veces en el centro de manera fluida
  const esBoomerang = estiloNorm === 'lento_y_vuelta';
  const duracionGrabadaSec = cantidadCuadros / fps;
  const cuadrosBoomerangDeseados = esBoomerang ? Math.round(1.5 * fps) : 0;

  // Calculamos la duración final objetivo en segundos según la duración grabada:
  // - Para grabaciones cortas (ej. 2s grabados): ~3s a 4s (90 a 120 cuadros)
  // - Para 10s grabados (300 cuadros): ~14-15s (420-450 cuadros)
  // - Para 12s grabados (360 cuadros): ~16-17s (480-510 cuadros)
  // - Para 15s grabados (450 cuadros): ~18-19s (540-570 cuadros)
  let targetTotalSegundos: number;
  if (duracionGrabadaSec <= 2.5) {
    targetTotalSegundos = Math.max(duracionGrabadaSec * 1.2, duracionGrabadaSec * 1.75);
  } else if (duracionGrabadaSec <= 5) {
    targetTotalSegundos = 3.5 + (duracionGrabadaSec - 2.5) * 1.6;
  } else if (duracionGrabadaSec <= 10) {
    const p = (duracionGrabadaSec - 5) / 5;
    targetTotalSegundos = 7.5 + p * (14.5 - 7.5);
  } else if (duracionGrabadaSec <= 12) {
    const p = (duracionGrabadaSec - 10) / 2;
    targetTotalSegundos = 14.5 + p * (16.5 - 14.5);
  } else if (duracionGrabadaSec <= 15) {
    const p = (duracionGrabadaSec - 12) / 3;
    targetTotalSegundos = 16.5 + p * (18.5 - 16.5);
  } else {
    targetTotalSegundos = Math.min(19.5, 18.5 + (duracionGrabadaSec - 15) * 0.2);
  }

  // Para solo_camara_lenta (sin boomerang), ajustamos para mantener el rango 12s a 20s en grabaciones de 10 a 15s
  if (!esBoomerang && duracionGrabadaSec >= 10 && duracionGrabadaSec <= 15) {
    targetTotalSegundos = Math.max(12.5, targetTotalSegundos - 1.5);
  }

  const targetTotalFrames = Math.round(targetTotalSegundos * fps);
  const targetForwardFrames = Math.max(cantidadCuadros, targetTotalFrames - cuadrosBoomerangDeseados);

  const pureSlowIndices: number[] = [];
  for (let i = transInEnd; i < transOutStart; i++) {
    pureSlowIndices.push(i);
  }

  // Cuadros restantes fijos después de pureSlow
  let transOutCuadrosEstimados = 0;
  for (let i = transOutStart; i < transOutEnd; i++) {
    const p = transicionCuadros > 1 ? (i - transOutStart) / (transicionCuadros - 1) : 1;
    transOutCuadrosEstimados += Math.max(1, Math.min(3, Math.round(3 - p * 2)));
  }
  const tramo3Cuadros = cantidadCuadros - c2;
  const framesDespuesDePureSlow = transOutCuadrosEstimados + tramo3Cuadros;

  // Calculamos el espacio disponible para la zona lenta pura
  const framesDisponibles = Math.max(
    pureSlowIndices.length,
    targetForwardFrames - forward.length - framesDespuesDePureSlow
  );

  if (pureSlowIndices.length > 0) {
    if (pureSlowIndices.length * 3 <= framesDisponibles) {
      // Si entran todos con 3 repeticiones
      for (const idx of pureSlowIndices) {
        forward.push(idx, idx, idx);
      }
    } else {
      // Cada cuadro arranca con 1 repetición base sin saltear ninguno
      const repeticionesPorCuadro = new Array(pureSlowIndices.length).fill(1);
      let extrasDisponibles = Math.min(
        pureSlowIndices.length * 2,
        Math.max(0, framesDisponibles - pureSlowIndices.length)
      );

      // Centro del tramo medio
      const centroFrame = (transInEnd + transOutStart - 1) / 2;

      // Ordenamos por distancia al centro (los más cercanos al centro tienen prioridad de repetición)
      const ordenadosPorDistancia = pureSlowIndices
        .map((frame, idx) => ({ idx, dist: Math.abs(frame - centroFrame) }))
        .sort((a, b) => a.dist - b.dist);

      // Asignamos +2 extras (llegando a 3 repeticiones) a los cuadros más cercanos al centro
      // para asegurar que los cuadros clave (ej: 140, 150, 160) se repitan exactamente 3 veces
      let k = 0;
      while (extrasDisponibles >= 2 && k < ordenadosPorDistancia.length) {
        const item = ordenadosPorDistancia[k];
        repeticionesPorCuadro[item.idx] += 2;
        extrasDisponibles -= 2;
        k++;
      }

      // Si sobra 1 repetición extra, se la damos al siguiente cuadro más cercano
      if (extrasDisponibles > 0 && k < ordenadosPorDistancia.length) {
        const item = ordenadosPorDistancia[k];
        repeticionesPorCuadro[item.idx] += 1;
        extrasDisponibles -= 1;
      }

      // Empujamos los cuadros de pureSlow en orden secuencial
      for (let i = 0; i < pureSlowIndices.length; i++) {
        const frameIdx = pureSlowIndices[i];
        const reps = repeticionesPorCuadro[i];
        for (let r = 0; r < reps; r++) {
          forward.push(frameIdx);
        }
      }
    }
  }

  // 4. Transición suave de salida (~0.4s, volviendo de 1/3x a 1x)
  for (let i = transOutStart; i < transOutEnd; i++) {
    const p = transicionCuadros > 1 ? (i - transOutStart) / (transicionCuadros - 1) : 1;
    const repeticiones = Math.max(1, Math.min(3, Math.round(3 - p * 2)));
    for (let r = 0; r < repeticiones; r++) {
      forward.push(i);
    }
  }

  // 5. Tramo 3 (Vuelta a normal): último 25% a velocidad real 1x (sin repetir)
  for (let i = c2; i < cantidadCuadros; i++) {
    forward.push(i);
  }

  // 6. Tramo 4 (Ida y vuelta / boomerang)
  if (esBoomerang) {
    const nBoomerang = Math.min(forward.length, Math.round(1.5 * fps));
    const tramoInverso = forward.slice(-nBoomerang).reverse();
    forward.push(...tramoInverso);
  }

  return forward;
}