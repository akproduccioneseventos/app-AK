'use server';

import { getAccesoById, type AccesoPersonal } from '@/app/actions/accesos-personal';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';

export type AccesoPersonalPortalView = {
  acceso: AccesoPersonal;
  fiesta?: {
    id: string;
    nombreEvento: string;
  };
};

export async function getAccesoPersonalPortalView(
  tokenId: string,
): Promise<AccesoPersonalPortalView | null> {
  const acceso = await getAccesoById(tokenId);
  if (!acceso) return null;
  if (!acceso.fiestaId) return { acceso };

  const fiesta = await getFiestaById(acceso.fiestaId);
  if (!fiesta) return null;

  return {
    acceso,
    fiesta: {
      id: fiesta.id,
      nombreEvento: fiesta.configuracion.nombreEvento,
    },
  };
}
