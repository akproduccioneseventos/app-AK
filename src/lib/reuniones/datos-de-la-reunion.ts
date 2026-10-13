import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * Con quien y donde es una reunion de una fiesta, con los campos que EXISTEN.
 *
 * Los avisos y el calendario leian `reunion.lugar`, `reunion.conQuien` y
 * `configuracion.nombreCliente`: ninguno existe en los tipos, asi que el lugar y el contacto
 * salian siempre de la alternativa o vacios. Una reunion (`Reunion`) solo tiene titulo, fecha,
 * hora, notas y acuerdos; el lugar y el cliente son los de la fiesta.
 */
export function datosDeLaReunion(fiesta: FiestaEnPlanificacion): { lugar: string; contacto: string } {
  const cfg = fiesta.configuracion;
  return {
    lugar: (cfg?.nombreLugar || '').trim(),
    contacto: (cfg?.clienteNombre || cfg?.protagonista1Nombre || cfg?.nombreEvento || '').trim(),
  };
}
