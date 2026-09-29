/**
 * Portal del Invitado — ruta oficial.
 * Re-exporta el mismo portal que /invitacion/[fiestaId]/invitado/[guestId].
 * La ruta anterior sigue funcionando por compatibilidad con enlaces existentes.
 */
export { default } from '@/app/invitacion/[fiestaId]/invitado/[guestId]/page';
