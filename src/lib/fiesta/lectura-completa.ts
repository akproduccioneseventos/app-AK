/**
 * La marca de "lectura interna" de la fiesta (25 de septiembre de 2026).
 *
 * `getFiestaById` le recorta la fiesta a quien no es del equipo (`recortar-para-afuera.ts`).
 * Las acciones del servidor que atienden al invitado —validar su credencial, anotar su pedido—
 * necesitan la fiesta entera aunque el que llama no tenga sesión. Pasan esta marca.
 *
 * Es un `Symbol`: desde el navegador **no se puede mandar**, porque no viaja en los argumentos
 * de una acción del servidor. Mismo patrón que `getScheduledMessages(internalToken)`.
 */
export const LECTURA_COMPLETA: unique symbol = Symbol('lectura-completa-de-la-fiesta');
