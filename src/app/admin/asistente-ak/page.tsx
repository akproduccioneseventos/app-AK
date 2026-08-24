import { redirect } from 'next/navigation';

/**
 * Esta direccion mostraba un cartel de "En Mantenimiento" que decia que el
 * asistente estaba desactivado por conflictos de dependencias.
 *
 * **Era mentira.** La asistente funciona: vive en `/multiagente` y se configura en
 * `/settings/ai-assistant`. La pantalla vieja no esta en el menu, pero cualquiera
 * que llegue por un enlace guardado se llevaba la impresion de que no anda.
 *
 * Se deja la direccion viva y llevando al lugar correcto, en vez de borrarla, para
 * que un enlace viejo no termine en "pagina no encontrada".
 */
export default function AsistenteAkPage() {
  redirect('/multiagente');
}
