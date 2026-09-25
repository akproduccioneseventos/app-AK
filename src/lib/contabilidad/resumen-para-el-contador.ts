import type { ProfitAndLossData } from '@/app/actions/reportes';

/**
 * EL RESUMEN DEL MES PARA EL CONTADOR (25 de septiembre de 2026, pedido del dueño).
 *
 * Se arma solo con los mismos números del reporte de ganancias (`getProfitAndLossData`): lo
 * cobrado y lo gastado del mes, renglón por renglón, más el archivo para planilla. **Lo manda
 * una persona con un toque**: es plata y sale para afuera (regla del dueño).
 *
 * El archivo usa punto y coma y montos sin separador de miles: así lo abre Excel en español sin
 * mezclar columnas.
 */
const NOMBRE_DE_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function mesAnteriorA(hoy: Date): { desde: Date; hasta: Date; nombre: string; clave: string } {
  const anio = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear();
  const mes = hoy.getMonth() === 0 ? 11 : hoy.getMonth() - 1;
  return {
    desde: new Date(anio, mes, 1, 0, 0, 0, 0),
    hasta: new Date(anio, mes + 1, 0, 23, 59, 59, 999),
    nombre: `${NOMBRE_DE_MES[mes]} de ${anio}`,
    clave: `${anio}-${String(mes + 1).padStart(2, '0')}`,
  };
}

const plata = (n: number) => `$ ${Math.round(n).toLocaleString('es-UY')}`;
const celda = (t: string) => `"${String(t ?? '').replace(/"/g, '""')}"`;

export function armarResumenParaElContador(datos: ProfitAndLossData, nombreDelMes: string): {
  asunto: string;
  texto: string;
  csv: string;
} {
  const asunto = `AK Producciones — resumen de ${nombreDelMes}`;
  const texto = [
    `Hola, te pasamos el resumen de ${nombreDelMes}.`,
    '',
    `Cobrado: ${plata(datos.ingresos.total)} (${datos.ingresos.detalle.length} cobros)`,
    `Gastado: ${plata(datos.costos.total)} (${datos.costos.detalle.length} gastos)`,
    `Resultado: ${plata(datos.gananciaNeta)}`,
    '',
    'Va adjunto el detalle renglón por renglón. Cualquier duda, avisanos.',
  ].join('\n');

  const filas = [
    ['Tipo', 'Fecha', 'Concepto', 'Categoría', 'Monto'].map(celda).join(';'),
    ...datos.ingresos.detalle.map((i) =>
      [celda('Cobro'), celda(i.fecha.slice(0, 10)), celda(i.concepto), celda(''), String(Math.round(i.monto))].join(';')),
    ...datos.costos.detalle.map((c) =>
      [celda('Gasto'), celda(c.fecha.slice(0, 10)), celda(c.concepto), celda(c.categoria), String(-Math.round(c.monto))].join(';')),
  ];
  return { asunto, texto, csv: filas.join('\n') };
}
