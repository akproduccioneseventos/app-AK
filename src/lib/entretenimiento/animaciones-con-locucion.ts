/**
 * Módulo de Animaciones con Locución para Espejo Mágico (estilo Mirror Me).
 *
 * Cada paso del flujo (saludar, pedir pose, cuenta regresiva, despedida)
 * cuenta con una animación visual atractiva en pantalla acompañada
 * de locución sintetizada en voz alta para interactuar con los invitados.
 */

export type MomentoAnimacion = 'saludo' | 'pose' | 'cuenta' | 'despedida';

export interface AnimacionConLocucion {
  id: string;
  cuando: MomentoAnimacion;
  textoHablado: string;
  animacion: string;
  titulo: string;
  subtitulo?: string;
  emoji?: string;
  tiposFiesta?: string[];
}

export const ANIMACIONES_CON_LOCUCION: AnimacionConLocucion[] = [
  {
    id: 'bienvenida-elegante',
    cuando: 'saludo',
    textoHablado: '¡Hola! Te doy la bienvenida al espejo mágico. Tocá la pantalla para empezar a brillar.',
    animacion: 'animate-pulse scale-105 transition-all duration-700',
    titulo: '¡TOCÁ LA PANTALLA!',
    subtitulo: 'Acercate y comenzá la magia',
    emoji: '✨',
    tiposFiesta: ['general', 'boda', '15anos', 'corporativo'],
  },
  {
    id: 'pose-estrella',
    cuando: 'pose',
    textoHablado: '¡Qué elegancia! Mirá al espejo y mostrá tu pose de estrella.',
    animacion: 'animate-bounce transition-transform duration-500',
    titulo: '¡MOSTRÁ TU MEJOR POSE!',
    subtitulo: 'Sonreí, estás por salir espectacular',
    emoji: '📸',
    tiposFiesta: ['general', '15anos', 'boda', 'cumpleanos'],
  },
  {
    id: 'cuenta-emocion',
    cuando: 'cuenta',
    textoHablado: '¡Tres, dos, uno, sonrisa inolvidable!',
    animacion: 'animate-ping duration-700',
    titulo: '¡PREPARATE!',
    subtitulo: 'La foto se toma en un segundo',
    emoji: '🎉',
    tiposFiesta: ['general', '15anos', 'cumpleanos'],
  },
  {
    id: 'despedida-vip',
    cuando: 'despedida',
    textoHablado: '¡Quedó espectacular! Escaneá el código QR en pantalla y llevate tu recuerdo ya.',
    animacion: 'animate-fade-in transition-opacity duration-1000',
    titulo: '¡FOTO ESPECTACULAR!',
    subtitulo: 'Escaneá el QR para descargar tu foto',
    emoji: '🌟',
    tiposFiesta: ['general', 'boda', '15anos', 'corporativo'],
  },
  {
    id: 'saludo-boda',
    cuando: 'saludo',
    textoHablado: 'Bienvenidos a celebrar este gran amor. ¡Una foto para recordar esta noche mágica!',
    animacion: 'animate-pulse scale-110 duration-700',
    titulo: '¡NOCHE DE CELEBRACIÓN!',
    subtitulo: 'Dejales tu mejor recuerdo a los novios',
    emoji: '💍',
    tiposFiesta: ['boda'],
  },
  {
    id: 'pose-divertida',
    cuando: 'pose',
    textoHablado: '¡Momento divertido! Hacé una mueca o pose graciosa con tus amigos.',
    animacion: 'animate-spin-slow duration-1000',
    titulo: '¡POSE DIVERTIDA!',
    subtitulo: '¡Soltate y disfrutá!',
    emoji: '🤪',
    tiposFiesta: ['cumpleanos', '15anos'],
  },
];

/**
 * Obtiene las animaciones con locución permitidas para la fiesta,
 * filtradas opcionalmente por allowedTemplateIds configurados.
 */
export function obtenerAnimacionesParaFiesta(
  allowedTemplateIds?: string[],
  tipoCelebracion?: string
): AnimacionConLocucion[] {
  let lista = ANIMACIONES_CON_LOCUCION;

  if (tipoCelebracion) {
    const tipoNorm = tipoCelebracion.toLowerCase();
    const filtradasPorTipo = lista.filter(
      (a) => !a.tiposFiesta || a.tiposFiesta.includes(tipoNorm) || a.tiposFiesta.includes('general')
    );
    if (filtradasPorTipo.length > 0) {
      lista = filtradasPorTipo;
    }
  }

  if (allowedTemplateIds && allowedTemplateIds.length > 0) {
    const filtradas = lista.filter((a) => allowedTemplateIds.includes(a.id));
    if (filtradas.length > 0) {
      lista = filtradas;
    }
  }

  return lista;
}

/**
 * Obtiene la animación con locución activa para el momento actual del espejo.
 */
export function obtenerAnimacionPorMomento(
  momento: MomentoAnimacion,
  allowedTemplateIds?: string[],
  tipoCelebracion?: string
): AnimacionConLocucion | undefined {
  const disponibles = obtenerAnimacionesParaFiesta(allowedTemplateIds, tipoCelebracion).filter(
    (a) => a.cuando === momento
  );
  if (disponibles.length > 0) {
    return disponibles[0];
  }
  return ANIMACIONES_CON_LOCUCION.find((a) => a.cuando === momento);
}
