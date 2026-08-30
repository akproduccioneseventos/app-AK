'use client';

import { KioskSetup } from '@/components/kiosk/kiosk-setup';

/**
 * La pantalla donde se elige el entretenimiento, con los iconos a la vista.
 *
 * Pedido del dueño, con sus palabras: *"iconos de cada entretenimiento, entrás,
 * se pone a qué fiesta pertenece, se configura y se trabaja sin ningún otro
 * acceso."*
 *
 * La pantalla ya existía —es la misma que arma cualquier estación— pero **no
 * tenía puerta**: había que saberse el enlace exacto de cada estación para
 * llegar. Por eso parecía que no existía. Esta es la puerta: una sola dirección
 * para todas.
 *
 * Arranca en la fotocabina porque es la que más se usa, pero se cambia tocando
 * cualquier otro icono.
 */
export default function InicioDeLasEstacionesPage() {
  return <KioskSetup defaultRole="fotocabina" />;
}
