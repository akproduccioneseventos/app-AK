'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { KioskSetup, type KioskRole } from '@/components/kiosk/kiosk-setup';
import { BotonComoFunciona } from '@/components/tutorial/BotonComoFunciona';

const ROLES_VALIDOS: readonly KioskRole[] = [
  'barra',
  'muro-en-vivo',
  'plataforma-360',
  'totem',
  'fotocabina',
  'espejo-magico',
  'touchpix',
  'buzon',
  'video-vida',
  'impresion',
  'dj',
  'bogue',
];

function esRolValido(valor: string | null): valor is KioskRole {
  return valor !== null && (ROLES_VALIDOS as readonly string[]).includes(valor);
}

function InicioDeLasEstacionesContent() {
  const searchParams = useSearchParams();
  const rolParam = searchParams.get('rol');
  const rol: KioskRole = esRolValido(rolParam) ? rolParam : 'fotocabina';

  return <KioskSetup defaultRole={rol} />;
}

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
 * Arranca en la fotocabina porque es la que más se usa, o en el `?rol=`
 * indicado en la dirección, y se cambia tocando cualquier otro icono.
 */
export default function InicioDeLasEstacionesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <div className="fixed top-3 right-3 z-50">
        <BotonComoFunciona clave="recepcion" variant="dark" />
      </div>
      <InicioDeLasEstacionesContent />
    </Suspense>
  );
}
