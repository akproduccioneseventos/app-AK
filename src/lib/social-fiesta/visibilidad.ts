/**
 * Qué contenido del muro se le puede mostrar a la gente.
 *
 * **Por qué existe este archivo.** La misma regla estaba escrita a mano en nueve
 * lugares distintos: el listado público, el tótem del salón, el muro en vivo, la
 * impresión, el video del recuerdo. Nueve copias de una regla que decide si una
 * foto sin revisar aparece proyectada en la pantalla grande delante de toda la
 * fiesta. Alcanza con que una se quede vieja para que se cuele algo indebido.
 *
 * La regla: se muestra lo aprobado. Lo que está esperando revisión y lo escondido
 * no se muestra nunca. Las publicaciones viejas, de antes de que existiera la
 * moderación, no tienen estado y se consideran aprobadas.
 */

export function esAprobadoParaMostrar(post: { moderationStatus?: string } | null | undefined): boolean {
  if (!post) return false;
  return (post.moderationStatus ?? 'approved') === 'approved';
}

/** Lo mismo, para filtrar una lista entera. */
export function soloAprobados<T extends { moderationStatus?: string }>(posts: T[] | null | undefined): T[] {
  return (posts ?? []).filter(esAprobadoParaMostrar);
}
