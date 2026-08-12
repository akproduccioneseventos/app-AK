import type { CrmStage } from '@/types/crm';

/**
 * Qué etapas del embudo cuentan como "terminadas".
 *
 * Los números del tablero —prospectos activos, valor del embudo, tasa de
 * conversión— dependen de saber cuál es la etapa de "firmó contrato" y cuál la de
 * "no contrató". Antes eso estaba escrito a mano como `s4` y `s5`, que son los
 * códigos de las etapas que vienen de fábrica.
 *
 * El problema: las etapas se pueden configurar. Si el dueño agrega una, cambia el
 * orden o arma su propio embudo, esos códigos dejan de corresponder y los números
 * salen mal **sin avisar**: prospectos ganados que no se cuentan como ganados,
 * valor de embudo inflado con negocios ya cerrados, y una tasa de conversión que
 * no es la real.
 *
 * Ahora se deduce de los datos: la etapa ganadora es la marcada como etapa de
 * conversión, y la perdedora la que se llama "no contrató" o similar. Si nada
 * coincide, se cae a los códigos de fábrica, que es como funcionaba antes.
 */

const PALABRAS_DE_PERDIDA = ['no contrat', 'perdid', 'descartad', 'rechaz'];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function idsDeEtapaGanadora(stages: CrmStage[]): Set<string> {
  const marcadas = stages.filter((s) => s.isConversionStage).map((s) => s.id);
  if (marcadas.length > 0) return new Set(marcadas);
  return new Set(stages.some((s) => s.id === 's4') ? ['s4'] : []);
}

export function idsDeEtapaPerdida(stages: CrmStage[]): Set<string> {
  const porNombre = stages
    .filter((s) => PALABRAS_DE_PERDIDA.some((palabra) => normalizar(s.name || '').includes(palabra)))
    .map((s) => s.id);
  if (porNombre.length > 0) return new Set(porNombre);
  return new Set(stages.some((s) => s.id === 's5') ? ['s5'] : []);
}

/** Ganadas y perdidas juntas: son las que ya no están en juego. */
export function idsDeEtapasTerminadas(stages: CrmStage[]): Set<string> {
  return new Set([...idsDeEtapaGanadora(stages), ...idsDeEtapaPerdida(stages)]);
}
