/**
 * QUE SE LE DICE AL USUARIO AL IMPORTAR INVITADOS (Orden 61 - Pregunta 9).
 *
 * Si se importan 10 invitados y 3 fallan, NO se puede decir "Importación exitosa".
 * Se debe avisar claramente cuántos se guardaron, cuántos fallaron, y cuáles son los
 * nombres que no se pudieron guardar, conservándolos para que el usuario pueda corregirlos.
 */

export interface FilaErrorImportacion {
  nombre: string;
  motivo: string;
}

export interface ResultadoImportacionInvitados {
  totalEsperados: number;
  guardados: number;
  fallidos: FilaErrorImportacion[];
}

export function evaluarResultadoImportacionInvitados(resultado: ResultadoImportacionInvitados): {
  titulo: string;
  detalle: string;
  esCompleta: boolean;
  esAMedias: boolean;
  esFalloTotal: boolean;
} {
  const { totalEsperados, guardados, fallidos } = resultado;

  if (totalEsperados === 0) {
    return {
      titulo: 'Sin invitados para importar',
      detalle: 'No se encontraron filas válidas en la planilla.',
      esCompleta: false,
      esAMedias: false,
      esFalloTotal: false,
    };
  }

  if (guardados === totalEsperados && fallidos.length === 0) {
    return {
      titulo: 'Importación exitosa',
      detalle: `Se importaron los ${guardados} invitados correctamente a la fiesta.`,
      esCompleta: true,
      esAMedias: false,
      esFalloTotal: false,
    };
  }

  if (guardados === 0) {
    const nombres = fallidos.map((f) => f.nombre).join(', ');
    return {
      titulo: 'No se pudo importar ningún invitado',
      detalle: `Fallaron los ${totalEsperados} invitados (${nombres}). Revisá los datos y volvé a intentar.`,
      esCompleta: false,
      esAMedias: false,
      esFalloTotal: true,
    };
  }

  // Caso "a medias": se guardó una parte, pero otra falló
  const faltantes = fallidos.map((f) => `${f.nombre} (${f.motivo})`).join('; ');
  return {
    titulo: `Importación incompleta: faltaron ${fallidos.length} de ${totalEsperados}`,
    detalle: `Se guardaron ${guardados} invitados, pero no se pudieron guardar: ${faltantes}. Las filas con error quedaron en la planilla para que puedas corregirlas.`,
    esCompleta: false,
    esAMedias: true,
    esFalloTotal: false,
  };
}

