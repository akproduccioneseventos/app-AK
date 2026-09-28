/**
 * Qué le pasó a la cámara, dicho para el operador (27/09/2026).
 *
 * Antes todas las estaciones decían "revisá los permisos" para cualquier falla, y el
 * operador tocaba los permisos cuando el problema era un cable suelto o que otra
 * pestaña tenía la cámara tomada. El navegador sí distingue la causa por el nombre
 * del error: acá se traduce a qué tocar.
 */
export function explicarFallaDeCamara(err: unknown): string {
  const nombre = err && typeof err === 'object' && 'name' in err ? String((err as { name: unknown }).name) : '';
  switch (nombre) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'El navegador no dio permiso para usar la cámara. Tocá el candado de la barra de direcciones, permití la cámara y recargá.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No se encontró ninguna cámara. Revisá que esté conectada y recargá la pantalla.';
    case 'NotReadableError':
    case 'AbortError':
      return 'La cámara está ocupada por otro programa u otra pestaña. Cerralo y volvé a intentar.';
    default:
      if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
        return 'Este navegador no puede usar la cámara. Abrí la pantalla con Chrome y con una dirección https.';
      }
      return 'No se pudo acceder a la cámara. Revisá que esté conectada y que el navegador tenga permiso, y volvé a intentar.';
  }
}
