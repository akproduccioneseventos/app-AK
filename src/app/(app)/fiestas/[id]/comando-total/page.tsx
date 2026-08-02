import { redirect } from 'next/navigation';

/**
 * Esta pantalla se unificó en el Centro de Fiesta.
 *
 * Había seis tableros distintos para dirigir una misma fiesta, cada uno con una
 * parte de la información y ninguno completo. Quedó uno solo, pensado para la
 * noche del evento: el reloj y el cronograma, cuánta gente confirmó y cuánta
 * llegó, quién está trabajando, lo que falta hacer y los botones a cada
 * herramienta con el aparato donde va.
 *
 * Se deja la redirección en vez de borrar la ruta para que no se rompa ningún
 * enlace ya guardado o compartido.
 */
export default async function PantallaUnificada(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  redirect(`/fiestas/${encodeURIComponent(id)}/centro`);
}
