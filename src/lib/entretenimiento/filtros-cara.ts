/**
 * Motor de filtros de cara y efectos estilo Canva / Snapchat para estaciones de entretenimiento.
 *
 * Utiliza MediaPipe FaceLandmarker local (/models/caras/face_landmarker.task)
 * y segmentación sin tela verde.
 * 100% offline y sin llamadas a servicios de pago externos.
 */

import { recortarPersonaSinTela } from './segmentacion-fondo';

export interface PuntoFacial {
  x: number; // Coordenada normalizada 0..1 o píxeles
  y: number; // Coordenada normalizada 0..1 o píxeles
  z?: number;
}

export interface CaraDetectada {
  puntos: PuntoFacial[]; // 468 o 478 puntos MediaPipe Face Mesh
  blendshapes?: Record<string, number>; // jawOpen, eyeBlinkLeft, etc.
}

export interface OpcionesFiltroCara {
  nombreAgasajado?: string;
  tipoCelebracion?: string;
  primaryColor?: string;
  timestampMs?: number;
  ancho?: number;
  alto?: number;
}

export const FILTROS_DISPONIBLES = [
  { id: 'mis15', nombre: 'Mis 15 (Corona & Cinta)', tipo: 'quince' },
  { id: 'novios', nombre: 'Los Novios (Velo & Galera)', tipo: 'boda' },
  { id: 'cumple', nombre: 'Cumpleaños (Gorrito & Años)', tipo: 'cumple' },
  { id: 'anteojos_fiesta', nombre: 'Anteojos de Fiesta', tipo: 'general' },
  { id: 'gatito', nombre: 'Orejitas de Gatito', tipo: 'general' },
  { id: 'corazones', nombre: 'Ojos de Corazones', tipo: 'general' },
  { id: 'bigote_sombrero', nombre: 'Bigote & Sombrero', tipo: 'general' },
  { id: 'corona_flores', nombre: 'Corona de Flores', tipo: 'general' },
  { id: 'lentes_estrella', nombre: 'Lentes de Estrella Neón', tipo: 'general' },
  { id: 'ruleta_invitado', nombre: '¿Qué tipo de invitado sos?', tipo: 'general' },
  { id: 'face_swap', nombre: 'Cambio de Caras (2 personas)', tipo: 'general' },
  { id: 'fondo_efecto', nombre: 'Efectos Detrás (Confeti/Brillo)', tipo: 'general' },
];

export const OPCIONES_RULETA_INVITADO = [
  'El que no larga la pista',
  'El del brindis',
  'El que llora en el vals',
  'El rey del cotillón',
  'El catador de la barra',
  'El fotógrafo encubierto',
  'El alma de la fiesta',
  'El primero en llegar',
  'El que se lleva el centro de mesa',
  'El fanático del DJ',
  'El que repite el postre',
  'El que rompe los zapatos',
  'El madrugador que sigue de largo',
  'El que baila con la tía',
  'El organizador secreto',
  'El que busca su foto en el muro',
  'El amigo incondicional',
  'El de la selfie perfecta',
  'El animador del grupo',
  'El que pide otra vuelta',
];

let detectorCaras: any = null;
let cargandoDetector: Promise<any> | null = null;

const RUTA_WASM = '/mediapipe/wasm';
const RUTA_MODELO_CARAS = '/models/caras/face_landmarker.task';

/**
 * Carga el detector de caras FaceLandmarker una sola vez cuando el invitado
 * selecciona un filtro facial.
 */
export async function cargarDetectorDeCaras(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if (detectorCaras) return detectorCaras;

  if (!cargandoDetector) {
    cargandoDetector = (async () => {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const fileset = await vision.FilesetResolver.forVisionTasks(RUTA_WASM);
        detectorCaras = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: RUTA_MODELO_CARAS,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 6,
          outputFaceBlendshapes: true,
        });
        return detectorCaras;
      } catch (err) {
        console.warn('[FiltrosCara] No se pudo cargar el detector de caras:', err);
        detectorCaras = null;
        return null;
      }
    })();
  }

  return cargandoDetector;
}

// Control de disparo reactivo (boca abierta / confeti)
let ultimoDisparoBoca = 0;

/**
 * Evalúa si las expresiones faciales disparan efectos reactivos.
 * Respeta el umbral de 0.5 y la pausa de 1 segundo (1000ms) entre disparos.
 */
export function evaluarEfectoReactivo(
  blendshapes: Record<string, number> = {},
  timestampMs: number = Date.now()
): { confetiBoca: boolean; destelloOjo: boolean; cambiarFiltro: boolean } {
  // jawOpen: confeti o corazones saliendo de la boca
  const valorJawOpen = blendshapes['jawOpen'] ?? blendshapes['jaw_open'] ?? 0;
  let confetiBoca = false;

  if (valorJawOpen > 0.5) {
    if (timestampMs - ultimoDisparoBoca >= 1000) {
      confetiBoca = true;
      ultimoDisparoBoca = timestampMs;
    }
  }

  // Guiño de ojo (eyeBlinkLeft o eyeBlinkRight > 0.5)
  const ojoIzq = blendshapes['eyeBlinkLeft'] ?? 0;
  const ojoDer = blendshapes['eyeBlinkRight'] ?? 0;
  const destelloOjo = (ojoIzq > 0.5 && ojoDer < 0.3) || (ojoDer > 0.5 && ojoIzq < 0.3);

  // Cejas levantadas (browInnerUp > 0.5)
  const cejas = blendshapes['browInnerUp'] ?? 0;
  const cambiarFiltro = cejas > 0.5;

  return { confetiBoca, destelloOjo, cambiarFiltro };
}

/**
 * Resuelve la opción seleccionada por la ruleta de Instagram.
 * Gira durante 3000ms y luego queda fija.
 */
export function obtenerOpcionRuleta(
  tiempoMs: number,
  nombreAgasajado?: string
): string {
  const lista = [...OPCIONES_RULETA_INVITADO];
  if (nombreAgasajado && nombreAgasajado.trim()) {
    lista.unshift(`El favorito de ${nombreAgasajado.trim()}`);
  }

  const duracionGiro = 3000;
  if (tiempoMs < duracionGiro) {
    const indice = Math.floor((tiempoMs / 120) % lista.length);
    return lista[indice];
  }

  // Final del giro: resultado estable basado en semilla
  const semilla = Math.abs(Math.floor(tiempoMs / duracionGiro));
  return lista[semilla % lista.length];
}

/**
 * Determina si se puede activar el filtro de Face Swap (requiere exactamente 2 caras).
 */
export function puedeHacerFaceSwap(cantidadCaras: number): boolean {
  return cantidadCaras === 2;
}

/**
 * Dibuja un filtro facial sobre el canvas siguiendo hasta 6 caras.
 * Si no hay caras, no dibuja nada y preserva el lienzo exactamente igual.
 */
export function dibujarFiltroDeCara(
  ctx: CanvasRenderingContext2D,
  videoOImagen: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  filtroId: string,
  caras: CaraDetectada[] = [],
  opciones: OpcionesFiltroCara = {}
): boolean {
  if (!filtroId || caras.length === 0) {
    return false;
  }

  const {
    nombreAgasajado,
    primaryColor = '#ec4899',
    timestampMs = Date.now(),
  } = opciones;

  const canvasWidth = ctx.canvas?.width || 1280;
  const canvasHeight = ctx.canvas?.height || 720;

  // Filtro Face Swap: requiere exactamente 2 caras
  if (filtroId === 'face_swap') {
    if (!puedeHacerFaceSwap(caras.length)) {
      return false; // No se ofrece si no hay exactamente 2 caras
    }
    intercambiarCaras(ctx, caras[0], caras[1], canvasWidth, canvasHeight);
    return true;
  }

  // Filtro de Efecto en el Fondo con segmentación inteligente
  if (filtroId === 'fondo_efecto') {
    return dibujarEfectoFondo(ctx, canvasWidth, canvasHeight, timestampMs, primaryColor);
  }

  let filtroAplicado = false;

  // Hasta 6 caras simultáneas
  for (const cara of caras.slice(0, 6)) {
    const pts = cara.puntos;
    if (!pts || pts.length < 4) continue;

    // Normalizar puntos a coordenadas de píxel si vienen normalizados (0..1)
    const px = (p: PuntoFacial) => (p.x <= 1 ? p.x * canvasWidth : p.x);
    const py = (p: PuntoFacial) => (p.y <= 1 ? p.y * canvasHeight : p.y);

    // Puntos anatómicos de referencia
    // Si viene una cara sintética con pocos puntos, usamos los que estén
    const frente = pts[10] || pts[0];
    const barbilla = pts[152] || pts[pts.length - 1];
    const ojoIzq = pts[33] || pts[1] || pts[0];
    const ojoDer = pts[263] || pts[2] || pts[pts.length - 1];
    const nariz = pts[4] || pts[Math.floor(pts.length / 2)];

    const xOjoIzq = px(ojoIzq);
    const yOjoIzq = py(ojoIzq);
    const xOjoDer = px(ojoDer);
    const yOjoDer = py(ojoDer);

    const centroX = (xOjoIzq + xOjoDer) / 2;
    const centroY = (yOjoIzq + yOjoDer) / 2;

    const dx = xOjoDer - xOjoIzq;
    const dy = yOjoDer - yOjoIzq;
    const distanciaOjos = Math.sqrt(dx * dx + dy * dy) || 80;
    const angulo = Math.atan2(dy, dx); // Inclinación de la cabeza

    const escala = distanciaOjos / 90;

    ctx.save();
    ctx.translate(centroX, centroY);
    ctx.rotate(angulo);
    ctx.scale(escala, escala);

    // 1. EVALUAR EFECTOS REACTIVOS (jawOpen, guiño)
    const reactivo = evaluarEfectoReactivo(cara.blendshapes, timestampMs);
    if (reactivo.confetiBoca) {
      dibujarExplosionConfeti(ctx, 0, 70); // Sale desde la boca
    }

    switch (filtroId) {
      case 'mis15': {
        // Corona/Tiara sobre la cabeza
        dibujarCorona(ctx, 0, -85, '#f59e0b', '#fbbf24');

        // Cinta con el nombre del agasajado y "XV" abajo
        const nombreCinta = (nombreAgasajado && nombreAgasajado.trim()) ? nombreAgasajado.trim() : 'Mis 15 Años';
        dibujarCintaBajoCara(ctx, 0, 110, `${nombreCinta} • XV`, primaryColor);
        filtroAplicado = true;
        break;
      }

      case 'novios': {
        // Corona de bodas / Galera
        dibujarGaleraOSombrero(ctx, 0, -90);
        const textoNovios = nombreAgasajado ? `Nuestra Boda • ${nombreAgasajado}` : '¡Vivan los Novios!';
        dibujarCintaBajoCara(ctx, 0, 110, textoNovios, '#d4af37');
        filtroAplicado = true;
        break;
      }

      case 'cumple': {
        dibujarGorritoCumple(ctx, 0, -95, primaryColor);
        filtroAplicado = true;
        break;
      }

      case 'anteojos_fiesta': {
        dibujarAnteojosFiesta(ctx, 0, 0, primaryColor);
        filtroAplicado = true;
        break;
      }

      case 'gatito': {
        dibujarOrejitasGatito(ctx, 0, -80);
        dibujarNarizGatito(ctx, 0, 30);
        filtroAplicado = true;
        break;
      }

      case 'corazones': {
        dibujarCorazonesEnOjos(ctx, -38, 0);
        dibujarCorazonesEnOjos(ctx, 38, 0);
        filtroAplicado = true;
        break;
      }

      case 'bigote_sombrero': {
        dibujarGaleraOSombrero(ctx, 0, -90);
        dibujarBigote(ctx, 0, 48);
        filtroAplicado = true;
        break;
      }

      case 'corona_flores': {
        dibujarCoronaFlores(ctx, 0, -75);
        filtroAplicado = true;
        break;
      }

      case 'lentes_estrella': {
        dibujarLentesEstrellaNeon(ctx, 0, 0, primaryColor);
        filtroAplicado = true;
        break;
      }

      case 'ruleta_invitado': {
        const opcion = obtenerOpcionRuleta(timestampMs % 10000, nombreAgasajado);
        dibujarRuletaCartel(ctx, 0, -115, opcion, primaryColor);
        filtroAplicado = true;
        break;
      }

      default:
        break;
    }

    ctx.restore();
  }

  return filtroAplicado;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES DE DIBUJO VECTORIAL EN CANVAS
// ─────────────────────────────────────────────────────────────────────────────

function dibujarCorona(ctx: CanvasRenderingContext2D, x: number, y: number, color1: string, color2: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color1;
  ctx.strokeStyle = color2;
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(-50, 20);
  ctx.lineTo(-60, -30);
  ctx.lineTo(-25, -5);
  ctx.lineTo(0, -45);
  ctx.lineTo(25, -5);
  ctx.lineTo(60, -30);
  ctx.lineTo(50, 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gemas brillantes
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, -35, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(-50, -22, 4, 0, Math.PI * 2);
  ctx.arc(50, -22, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function dibujarCintaBajoCara(ctx: CanvasRenderingContext2D, x: number, y: number, texto: string, color: string) {
  ctx.save();
  ctx.translate(x, y);

  const anchoCinta = Math.max(200, texto.length * 12 + 40);
  ctx.fillStyle = color;
  ctx.fillRect(-anchoCinta / 2, -18, anchoCinta, 36);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-anchoCinta / 2 + 2, -16, anchoCinta - 4, 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 0, 0);

  ctx.restore();
}

function dibujarGaleraOSombrero(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#18181b';

  // Ala del sombrero
  ctx.beginPath();
  ctx.ellipse(0, 15, 65, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Copa
  ctx.fillRect(-35, -55, 70, 70);

  // Cinta roja
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-35, 0, 70, 12);

  ctx.restore();
}

function dibujarGorritoCumple(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.lineTo(-30, 20);
  ctx.lineTo(30, 20);
  ctx.closePath();
  ctx.fill();

  // Pompón
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, -65, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dibujarAnteojosFiesta(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';

  // Marco izquierdo
  ctx.beginPath();
  ctx.arc(-35, 0, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Marco derecho
  ctx.beginPath();
  ctx.arc(35, 0, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Puente
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(7, 0);
  ctx.stroke();
  ctx.restore();
}

function dibujarOrejitasGatito(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f472b6';

  // Oreja izquierda
  ctx.beginPath();
  ctx.moveTo(-45, 15);
  ctx.lineTo(-65, -30);
  ctx.lineTo(-20, -5);
  ctx.closePath();
  ctx.fill();

  // Oreja derecha
  ctx.beginPath();
  ctx.moveTo(45, 15);
  ctx.lineTo(65, -30);
  ctx.lineTo(20, -5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function dibujarNarizGatito(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(-8, -5);
  ctx.lineTo(8, -5);
  ctx.closePath();
  ctx.fill();

  // Bigotes
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, -2);
  ctx.lineTo(-38, -6);
  ctx.moveTo(-12, 2);
  ctx.lineTo(-40, 6);
  ctx.moveTo(12, -2);
  ctx.lineTo(38, -6);
  ctx.moveTo(12, 2);
  ctx.lineTo(40, 6);
  ctx.stroke();
  ctx.restore();
}

function dibujarCorazonesEnOjos(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ef4444';

  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-15, -15, -20, -5, 0, -22);
  ctx.bezierCurveTo(20, -5, 15, -15, 0, 5);
  ctx.fill();
  ctx.restore();
}

function dibujarBigote(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#18181b';

  ctx.beginPath();
  ctx.moveTo(-35, 5);
  ctx.quadraticCurveTo(-15, -15, 0, 0);
  ctx.quadraticCurveTo(15, -15, 35, 5);
  ctx.quadraticCurveTo(18, 12, 0, 5);
  ctx.quadraticCurveTo(-18, 12, -35, 5);
  ctx.fill();
  ctx.restore();
}

function dibujarCoronaFlores(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  const colores = ['#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#10b981'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = colores[i];
    const fx = -50 + i * 25;
    ctx.beginPath();
    ctx.arc(fx, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(fx, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function dibujarLentesEstrellaNeon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fillStyle = color;

  // Estrella izquierda
  dibujarEstrella(ctx, -38, 0, 5, 22, 10);
  // Estrella derecha
  dibujarEstrella(ctx, 38, 0, 5, 22, 10);

  ctx.restore();
}

function dibujarEstrella(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

function dibujarRuletaCartel(ctx: CanvasRenderingContext2D, x: number, y: number, texto: string, color: string) {
  ctx.save();
  ctx.translate(x, y);

  const anchoCartel = Math.max(220, texto.length * 11 + 30);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(-anchoCartel / 2, -22, anchoCartel, 44);

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(-anchoCartel / 2, -22, anchoCartel, 44);

  // Flecha indicadora apuntando a la cabeza
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, 22);
  ctx.lineTo(10, 22);
  ctx.lineTo(0, 32);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 0, 0);

  ctx.restore();
}

function dibujarExplosionConfeti(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  const colores = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#a855f7'];

  for (let i = 0; i < 25; i++) {
    ctx.fillStyle = colores[i % colores.length];
    const ang = (i * 15 * Math.PI) / 180;
    const dist = 30 + (i * 7) % 60;
    const px = Math.cos(ang) * dist;
    const py = Math.sin(ang) * dist + 15;
    ctx.fillRect(px, py, 6, 6);
  }
  ctx.restore();
}

function intercambiarCaras(
  ctx: CanvasRenderingContext2D,
  cara1: CaraDetectada,
  cara2: CaraDetectada,
  ancho: number,
  alto: number
) {
  // Face Swap entre exactamente 2 caras
  // Se obtiene la región de cada cara y se proyecta sobre la otra
  const px = (p: PuntoFacial) => (p.x <= 1 ? p.x * ancho : p.x);
  const py = (p: PuntoFacial) => (p.y <= 1 ? p.y * alto : p.y);

  const c1x = px(cara1.puntos[4] || cara1.puntos[0]);
  const c1y = py(cara1.puntos[4] || cara1.puntos[0]);
  const c2x = px(cara2.puntos[4] || cara2.puntos[0]);
  const c2y = py(cara2.puntos[4] || cara2.puntos[0]);

  const r = 60;

  try {
    const img1 = ctx.getImageData(Math.max(0, c1x - r), Math.max(0, c1y - r), r * 2, r * 2);
    const img2 = ctx.getImageData(Math.max(0, c2x - r), Math.max(0, c2y - r), r * 2, r * 2);

    ctx.putImageData(img2, Math.max(0, c1x - r), Math.max(0, c1y - r));
    ctx.putImageData(img1, Math.max(0, c2x - r), Math.max(0, c2y - r));
  } catch {
    // Si falla el intercambio en el canvas, se preserva sin cambios
  }
}

function dibujarEfectoFondo(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  timestampMs: number,
  primaryColor: string
): boolean {
  // Intentar recorte inteligente sin tela
  const recortado = recortarPersonaSinTela(ctx, ancho, alto);

  // Si no recortó (recorte apagado o no disponible en este equipo),
  // el efecto se dibuja encima (foreground) y la imagen no se corta.
  ctx.save();
  if (recortado) {
    ctx.globalCompositeOperation = 'destination-over'; // Detrás de la persona
  }

  // Dibuja confeti/lluvia festiva
  const colores = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', primaryColor];
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = colores[i % colores.length];
    const px = (i * 47 + (timestampMs / 5)) % ancho;
    const py = (i * 31 + (timestampMs / 3)) % alto;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  return true;
}
