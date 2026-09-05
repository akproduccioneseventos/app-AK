/**
 * Errores que NO son de la app.
 *
 * **Correccion del 5 de septiembre de 2026.** Este archivo llego a decir que el
 * error de React al redirigir era del armazon de Next y no rompia nada. **Era
 * falso**: se habia medido en modo desarrollo, donde React se recupera. En la app
 * compilada de verdad, la pantalla del invitado mostraba **"Application error"**,
 * que es la pantalla rota que ve una persona.
 *
 * El arreglo de verdad fue hacer los redireccionamientos en la configuracion, para
 * que el navegador no tenga que cambiar de pantalla por su cuenta.
 *
 * Queda la lista vacia a proposito: **hoy no hay ningun error que haya que
 * perdonar**. Si algun dia hay que agregar uno, la regla es la de siempre: primero
 * medirlo en la app COMPILADA, no en modo desarrollo.
 */
const DEL_ARMAZON: RegExp[] = [];

export function esErrorDelArmazonAlRedirigir(mensaje: string): boolean {
  return DEL_ARMAZON.some((patron) => patron.test(mensaje));
}

export function soloErroresDeLaApp(errores: string[]): string[] {
  return errores.filter((e) => !esErrorDelArmazonAlRedirigir(e));
}
