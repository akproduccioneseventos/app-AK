/**
 * QUE SE LE DICE A LA PERSONA DESPUES DE IMPORTAR UN PRESUPUESTO.
 *
 * **El caso real, del 16 de septiembre de 2026:** el presupuesto se crea y la fiesta no.
 * El aviso existia, pero se guardaba en una lista que solo se mostraba cuando la
 * importacion fallaba ENTERA. En este caso la pantalla saltaba al presupuesto nuevo y
 * **nadie se enteraba de que el evento nunca se habia creado**.
 *
 * La decision vive aca, afuera de la pantalla, para poder probarla sin abrir un navegador
 * y para que las dos salidas —entero y a medias— se vean juntas.
 */

export type ResultadoDeImportacion = {
  presupuestoId?: string;
  warnings?: string[];
};

export function queSeLeDiceAlImportar(resultado: ResultadoDeImportacion): {
  titulo: string;
  detalle: string;
  esAMedias: boolean;
} {
  const avisos = (resultado.warnings || []).filter((aviso) => typeof aviso === 'string' && aviso.trim());

  if (avisos.length > 0) {
    return {
      titulo: 'Importado, pero algo quedó a medias',
      detalle: avisos.join(' '),
      esAMedias: true,
    };
  }

  return {
    titulo: 'Presupuesto importado',
    detalle: `Se creó el presupuesto ${resultado.presupuestoId ?? ''}.`.trim(),
    esAMedias: false,
  };
}
