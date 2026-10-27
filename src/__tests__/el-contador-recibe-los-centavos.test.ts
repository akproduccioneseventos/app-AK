/**
 * @jest-environment node
 */
import { armarResumenParaElContador } from '@/lib/contabilidad/resumen-para-el-contador';
import type { ProfitAndLossData } from '@/app/actions/reportes';

describe('El contador recibe los centavos (Orden 249)', () => {
  describe('Con montos enteros (ej: 100)', () => {
    const datos: ProfitAndLossData = {
      ingresos: {
        total: 100,
        detalle: [
          { id: 'i1', fecha: '2026-10-01T10:00:00.000Z', concepto: 'Cobro simple', monto: 100 },
        ],
      },
      costos: {
        total: 0,
        detalle: [],
      },
      gananciaNeta: 100,
      margen: 1,
    };

    it('la suma de las filas del CSV coincide con el resultado del reporte y con el texto', () => {
      const resumen = armarResumenParaElContador(datos, 'octubre de 2026');
      const filas = resumen.csv.split('\n').slice(1);
      const sumaCsv = filas.reduce((acc, fila) => {
        const partes = fila.split(';');
        const montoStr = partes[partes.length - 1];
        const montoNum = parseFloat(montoStr);
        expect(Number.isNaN(montoNum)).toBe(false);
        return acc + montoNum;
      }, 0);

      expect(sumaCsv).toBe(100);
      expect(sumaCsv).toBe(datos.gananciaNeta);
      expect(resumen.texto).toContain('Cobrado: $ 100 (1 cobros)');
      expect(resumen.texto).toContain('Gastado: $ 0,00 (0 gastos)');
      expect(resumen.texto).toContain('Resultado: $ 100,00');
    });
  });

  describe('Con gasto de 60.30', () => {
    const datos: ProfitAndLossData = {
      ingresos: {
        total: 100,
        detalle: [
          { id: 'i1', fecha: '2026-10-01T10:00:00.000Z', concepto: 'Cobro de evento', monto: 100 },
        ],
      },
      costos: {
        total: 60.30,
        detalle: [
          { id: 'c1', fecha: '2026-10-05T12:00:00.000Z', concepto: 'Insumos', categoria: 'Cocina', monto: 60.30 },
        ],
      },
      gananciaNeta: 39.70,
      margen: 0.397,
    };

    it('la suma de las filas del CSV coincide con el resultado del reporte y con el texto', () => {
      const resumen = armarResumenParaElContador(datos, 'octubre de 2026');
      const filas = resumen.csv.split('\n').slice(1);
      const montos = filas.map((fila) => {
        const partes = fila.split(';');
        const montoStr = partes[partes.length - 1];
        const monto = parseFloat(montoStr);
        expect(Number.isNaN(monto)).toBe(false);
        return monto;
      });

      const sumaCsv = Number(montos.reduce((a, b) => a + b, 0).toFixed(2));
      expect(sumaCsv).toBe(39.70);
      expect(sumaCsv).toBe(datos.gananciaNeta);
      expect(resumen.texto).toContain('Cobrado: $ 100 (1 cobros)');
      expect(resumen.texto).toContain('Gastado: $ 60,30 (1 gastos)');
      expect(resumen.texto).toContain('Resultado: $ 39,70');
    });

    it('los gastos tienen signo negativo en el CSV y formato decimal con punto sin separador de miles', () => {
      const resumen = armarResumenParaElContador(datos, 'octubre de 2026');
      const filas = resumen.csv.split('\n').slice(1);
      const filaGasto = filas.find(f => f.startsWith('"Gasto"'));
      expect(filaGasto).toBeDefined();
      const columnas = filaGasto!.split(';');
      const montoGastoStr = columnas[columnas.length - 1];
      expect(montoGastoStr).toBe('-60.30');
      expect(parseFloat(montoGastoStr)).toBe(-60.30);
    });
  });

  describe('Con dos gastos de 60.30 (60.30 + 60.30 = 120.60)', () => {
    const datos: ProfitAndLossData = {
      ingresos: {
        total: 200,
        detalle: [
          { id: 'i1', fecha: '2026-10-01T10:00:00.000Z', concepto: 'Cobro de evento', monto: 200 },
        ],
      },
      costos: {
        total: 120.60,
        detalle: [
          { id: 'c1', fecha: '2026-10-05T12:00:00.000Z', concepto: 'Bebidas lote 1', categoria: 'Barra', monto: 60.30 },
          { id: 'c2', fecha: '2026-10-06T12:00:00.000Z', concepto: 'Bebidas lote 2', categoria: 'Barra', monto: 60.30 },
        ],
      },
      gananciaNeta: 79.40,
      margen: 0.397,
    };

    it('la suma de las filas del CSV coincide con el resultado del reporte y con el texto', () => {
      const resumen = armarResumenParaElContador(datos, 'octubre de 2026');
      const filas = resumen.csv.split('\n').slice(1);
      const montos = filas.map((fila) => {
        const partes = fila.split(';');
        const montoStr = partes[partes.length - 1];
        const monto = parseFloat(montoStr);
        expect(Number.isNaN(monto)).toBe(false);
        return monto;
      });

      const sumaCsv = Number(montos.reduce((a, b) => a + b, 0).toFixed(2));
      expect(sumaCsv).toBe(79.40);
      expect(sumaCsv).toBe(datos.gananciaNeta);
      expect(resumen.texto).toContain('Cobrado: $ 200 (1 cobros)');
      expect(resumen.texto).toContain('Gastado: $ 120,60 (2 gastos)');
      expect(resumen.texto).toContain('Resultado: $ 79,40');
    });
  });

  describe('Escape de comillas en conceptos y categorías', () => {
    it('escapa comillas dobles correctamente como "" en el CSV', () => {
      const datos: ProfitAndLossData = {
        ingresos: {
          total: 500,
          detalle: [
            { id: 'i1', fecha: '2026-10-01T10:00:00.000Z', concepto: 'Servicio "DJ" especial', monto: 500 },
          ],
        },
        costos: {
          total: 100,
          detalle: [
            { id: 'c1', fecha: '2026-10-02T10:00:00.000Z', concepto: 'Alquiler de "Luces & Sonido"', categoria: 'Técnica "Pro"', monto: 100 },
          ],
        },
        gananciaNeta: 400,
        margen: 0.8,
      };

      const resumen = armarResumenParaElContador(datos, 'octubre de 2026');
      expect(resumen.csv).toContain('"Servicio ""DJ"" especial"');
      expect(resumen.csv).toContain('"Alquiler de ""Luces & Sonido"""');
      expect(resumen.csv).toContain('"Técnica ""Pro"""');
    });
  });

  describe('Lectura numérica de columnas en planilla', () => {
    it('parsea el CSV separando por ; y comprueba que parseFloat(montoStr) no sea NaN y coincida', () => {
      const datos: ProfitAndLossData = {
        ingresos: {
          total: 1500,
          detalle: [
            { id: 'i1', fecha: '2026-10-01T10:00:00.000Z', concepto: 'Entrada general', monto: 1500 },
          ],
        },
        costos: {
          total: 60.30,
          detalle: [
            { id: 'c1', fecha: '2026-10-02T10:00:00.000Z', concepto: 'Hielo', categoria: 'Bar', monto: 60.30 },
          ],
        },
        gananciaNeta: 1439.70,
        margen: 0.9598,
      };

      const resumen = armarResumenParaElContador(datos, 'octubre de 2026');
      const lineas = resumen.csv.trim().split('\n');
      expect(lineas.length).toBe(3);

      const cabecera = lineas[0].split(';');
      expect(cabecera).toEqual(['"Tipo"', '"Fecha"', '"Concepto"', '"Categoría"', '"Monto"']);

      // Fila 1: Ingreso
      const partesIngreso = lineas[1].split(';');
      expect(partesIngreso).toHaveLength(5);
      const montoIngresoStr = partesIngreso[4];
      const parsedIngreso = parseFloat(montoIngresoStr);
      expect(Number.isNaN(parsedIngreso)).toBe(false);
      expect(parsedIngreso).toBe(1500);

      // Fila 2: Costo
      const partesCosto = lineas[2].split(';');
      expect(partesCosto).toHaveLength(5);
      const montoCostoStr = partesCosto[4];
      const parsedCosto = parseFloat(montoCostoStr);
      expect(Number.isNaN(parsedCosto)).toBe(false);
      expect(parsedCosto).toBe(-60.30);
    });
  });
});
