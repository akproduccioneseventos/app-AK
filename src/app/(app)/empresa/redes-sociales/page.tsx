import { redirect } from 'next/navigation';

/**
 * Orden 192: Un solo centro de presencia digital y redes.
 * Esta ruta redirige automáticamente a la solapa de Publicaciones del Centro de Presencia y Redes.
 */
export default function RedesSocialesPage() {
  redirect('/empresa/presencia-digital?tab=publicaciones');
}
