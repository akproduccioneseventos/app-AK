/**
 * @fileOverview Quién manda sobre la voz en vivo del Asistente AK (orden 146). Guarda UN solo intento
 * vigente, con identidad propia, y es la única fuente de verdad de "hay una conversación en curso":
 * el botón, el panel y el corte miran lo mismo.
 *
 * - Cortar, cerrar o desmontar ANTES de la primera espera ya cancela: el intento se aborta y lo que
 *   llegue tarde (ficha, micrófono, socket) se descarta sin avisar a nadie.
 * - Un inicio que falló o se cerró NO queda guardado como sesión activa: el siguiente toque inicia
 *   un intento nuevo (un solo pedido), sin un toque invisible de limpieza.
 * - Dos inicios seguidos: sólo vive el último; las respuestas fuera de orden se descartan.
 */
import {
  iniciarVozEnVivo,
  type EstadoVozEnVivo,
  type OpcionesVozEnVivo,
  type SesionVozEnVivo,
} from '@/lib/asistente/sesion-voz-en-vivo';

export interface OpcionesControlVozEnVivo {
  onEstado: (estado: EstadoVozEnVivo, info?: { segundosMaximos?: number }) => void;
  onTexto?: (texto: string, quien: 'asistente' | 'persona') => void;
  onError?: (mensaje: string) => void;
  /** Para pruebas: el iniciador y las piezas del navegador reemplazables. */
  iniciar?: typeof iniciarVozEnVivo;
  piezas?: OpcionesVozEnVivo['piezas'];
}

export interface ControlVozEnVivo {
  /** Si hay un intento vigente lo corta; si no, inicia uno nuevo. */
  alternar: () => Promise<void>;
  /** Corta el intento vigente (conectando o en vivo). `silencioso`: sin avisar el estado (desmontar). */
  cortar: (silencioso?: boolean) => boolean;
  hayIntento: () => boolean;
}

interface Intento {
  control: AbortController;
  sesion: SesionVozEnVivo | null;
}

export function crearControlVozEnVivo(op: OpcionesControlVozEnVivo): ControlVozEnVivo {
  const iniciar = op.iniciar || iniciarVozEnVivo;
  let actual: Intento | null = null;

  const cortar = (silencioso = false) => {
    const intento = actual;
    actual = null;
    if (!intento) return false;
    intento.control.abort();
    intento.sesion?.detener();
    if (!silencioso) op.onEstado('cerrada');
    return true;
  };

  const alternar = async () => {
    if (actual) {
      cortar();
      return;
    }
    const intento: Intento = { control: new AbortController(), sesion: null };
    actual = intento;
    const vigente = () => actual === intento;
    op.onEstado('conectando');
    const sesion = await iniciar({
      senal: intento.control.signal,
      piezas: op.piezas,
      onEstado: (estado, info) => {
        if (!vigente()) return;
        // Cerró o falló por su cuenta: ya no hay intento vigente, el próximo toque empieza de nuevo.
        if (estado === 'cerrada') actual = null;
        op.onEstado(estado, info);
      },
      onTexto: (texto, quien) => { if (vigente()) op.onTexto?.(texto, quien); },
      onError: (mensaje) => { if (vigente()) op.onError?.(mensaje); },
    });
    // Llegó tarde: lo cortaron o hay otro intento. Se suelta todo lo que haya abierto.
    if (!vigente()) {
      sesion.detener();
      return;
    }
    intento.sesion = sesion;
  };

  return { alternar, cortar, hayIntento: () => actual !== null };
}
