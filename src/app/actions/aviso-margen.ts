'use server';

import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { requireAppSession } from '@/lib/auth/require-session';
import {
  calcularAvisoMargenHistorico,
  type AvisoMargenHistorico,
} from '@/lib/costos/aviso-margen-historico';

/**
 * El aviso de margen para un presupuesto que se esta armando.
 *
 * Por que pide sesion: le dice al equipo cuanto se paso de lo estimado en
 * fiestas anteriores. **Eso no lo puede ver el cliente**, y la pantalla del
 * presupuesto tambien se comparte con el por enlace publico.
 */
export async function getAvisoMargenParaPresupuesto(params: {
  tipoEvento?: string;
  salon?: string;
  invitados?: number;
}): Promise<AvisoMargenHistorico | null> {
  await requireAppSession();

  // Con archivadas incluidas: las fiestas viejas son justamente las que sirven
  // para comparar.
  const fiestas = await getFiestas(true);
  return calcularAvisoMargenHistorico(fiestas, params);
}
