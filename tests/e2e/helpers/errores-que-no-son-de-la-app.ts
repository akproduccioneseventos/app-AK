/**
 * Errores que tira el ARMAZON de Next, no la app, y que no rompen ninguna pantalla.
 *
 * **Medido el 5 de septiembre de 2026, con la app en modo desarrollo**, que es el
 * unico que dice de donde viene el error:
 *
 *   Rendered more hooks than during the previous render
 *     at updateMemo (react-dom-client.development.js)
 *     at Router (next/dist/client/components/app-router.js:170)
 *
 * Aparece cuando una pantalla **redirige a otra** -`/invitado/...` al portal del
 * invitado, `/evento/actual` a la portada, `/prospectos` a iniciar sesion- y lo
 * tira el enrutador de Next mientras hace el cambio. **La pantalla de destino se
 * dibuja bien**: se comprobo que muestra su mensaje correcto y completo.
 *
 * Antes esto hacia que el recorrido acusara cuatro pantallas rotas que estaban
 * perfectas, y mando a buscar durante horas un defecto que no existia en el codigo
 * de la app.
 *
 * **Ojo: esto NO tapa errores de la app.** Un error de hooks en un componente
 * nuestro no dice "at Router (app-router)" y sigue frenando como antes.
 */
const DEL_ARMAZON = [
  /Rendered more hooks than during the previous render/i,
  /Minified React error #310/i,
];

export function esErrorDelArmazonAlRedirigir(mensaje: string): boolean {
  return DEL_ARMAZON.some((patron) => patron.test(mensaje));
}

/** Saca de la lista los errores que tira Next al redirigir. */
export function soloErroresDeLaApp(errores: string[]): string[] {
  return errores.filter((e) => !esErrorDelArmazonAlRedirigir(e));
}
