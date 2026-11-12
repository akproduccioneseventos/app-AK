import type { FiestaEnPlanificacion, ColorPalette } from '@/types/fiesta';

export interface EstiloVideoData {
  plantilla?: string;
  paletaColores?: ColorPalette;
  protagonista1?: string;
  protagonista2?: string;
  fechaEvento?: string;
}

export function construirEstiloJson(fiesta?: FiestaEnPlanificacion | null): EstiloVideoData {
  if (!fiesta) {
    return {};
  }

  const plantilla = fiesta.invitacionDigital?.plantilla || (fiesta.invitacionConfig?.plantillaId as any);

  const paletaColores: ColorPalette | undefined =
    fiesta.invitacionDigital?.cabecera?.paletaColores ||
    (fiesta.invitacionConfig?.colorPrincipal
      ? {
          primary: fiesta.invitacionConfig.colorPrincipal,
          secondary: fiesta.invitacionConfig.colorSecundario,
          accent: fiesta.invitacionConfig.colorAcento,
        }
      : undefined);

  const protagonista1 =
    fiesta.invitacionDigital?.cabecera?.protagonista1 ||
    fiesta.configuracion?.protagonista1Nombre ||
    fiesta.configuracion?.nombreAgasajado ||
    fiesta.invitacionConfig?.nombreHomenajeada;

  const protagonista2 =
    fiesta.invitacionDigital?.cabecera?.protagonista2 ||
    fiesta.configuracion?.protagonista2Nombre ||
    fiesta.invitacionConfig?.nombreHomenajeado2;

  const fechaEvento =
    fiesta.configuracion?.fechaEvento ||
    (fiesta as any).fechaEvento;

  return {
    plantilla,
    paletaColores,
    protagonista1,
    protagonista2,
    fechaEvento,
  };
}
