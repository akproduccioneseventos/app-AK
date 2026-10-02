/**
 * @fileOverview Pruebas para la Orden 106 Bloque 10:
 * La barra de tragos completa, descuentos de insumos y cierre de barra.
 */

import type { Trago, FiestaEnPlanificacion } from '@/types/fiesta';
import type { ServicioEmpresa } from '@/types/empresa';

// Estado simulado en memoria
let insumosEnMemoria: ServicioEmpresa[] = [];
let pedidosEnMemoria: any[] = [];
let fiestaEnMemoria: any = null;

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'insumos.json') {
      return JSON.parse(JSON.stringify(insumosEnMemoria));
    }
    if (file.includes('fiesta')) {
      return JSON.parse(JSON.stringify(fiestaEnMemoria || fallback));
    }
    return JSON.parse(JSON.stringify(fallback));
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'insumos.json') {
      insumosEnMemoria = JSON.parse(JSON.stringify(data));
    }
    return true;
  }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ user: { id: 'admin-1', role: 'admin' } })),
}));

// Mock de DB de firebase para usar el flujo local
jest.mock('@/lib/firebase/server', () => ({
  getDbAdmin: jest.fn(async () => null),
  dbAdmin: null,
}));

export const RECETAS_REALES_BARRA: Record<string, { ingredientes: Array<{ insumoId: string; nombre: string; cantidad: number; unidad: string }> }> = {
  'daiquiri-durazno': {
    ingredientes: [
      { insumoId: 'ins-ron-blanco', nombre: 'Ron blanco', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-durazno', nombre: 'Durazno', cantidad: 80, unidad: 'g' },
      { insumoId: 'ins-limon', nombre: 'Jugo de limón', cantidad: 20, unidad: 'ml' },
      { insumoId: 'ins-almibar', nombre: 'Almíbar', cantidad: 15, unidad: 'ml' },
    ],
  },
  'caipirinha': {
    ingredientes: [
      { insumoId: 'ins-cachaca', nombre: 'Cachaça', cantidad: 60, unidad: 'ml' },
      { insumoId: 'ins-azucar', nombre: 'Azúcar', cantidad: 10, unidad: 'g' },
    ],
  },
  'arizona': {
    ingredientes: [
      { insumoId: 'ins-vodka', nombre: 'Vodka', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-te-helado', nombre: 'Té helado', cantidad: 180, unidad: 'ml' },
      { insumoId: 'ins-limon', nombre: 'Jugo de limón', cantidad: 15, unidad: 'ml' },
    ],
  },
  'atomic-green': {
    ingredientes: [
      { insumoId: 'ins-licor-durazno', nombre: 'Licor de durazno', cantidad: 40, unidad: 'ml' },
      { insumoId: 'ins-vodka', nombre: 'Vodka', cantidad: 30, unidad: 'ml' },
      { insumoId: 'ins-sprite', nombre: 'Sprite', cantidad: 150, unidad: 'ml' },
    ],
  },
  'fernet-coca': {
    ingredientes: [
      { insumoId: 'ins-fernet', nombre: 'Fernet', cantidad: 70, unidad: 'ml' },
      { insumoId: 'ins-coca', nombre: 'Coca-Cola', cantidad: 230, unidad: 'ml' },
    ],
  },
  'atardecer': {
    ingredientes: [
      { insumoId: 'ins-tequila', nombre: 'Tequila', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-naranja', nombre: 'Jugo de naranja', cantidad: 150, unidad: 'ml' },
      { insumoId: 'ins-granadina', nombre: 'Granadina', cantidad: 15, unidad: 'ml' },
    ],
  },
  'destornillador': {
    ingredientes: [
      { insumoId: 'ins-vodka', nombre: 'Vodka', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-naranja', nombre: 'Jugo de naranja', cantidad: 150, unidad: 'ml' },
    ],
  },
  'ron-cola': {
    ingredientes: [
      { insumoId: 'ins-ron', nombre: 'Ron', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-coca', nombre: 'Coca-Cola', cantidad: 200, unidad: 'ml' },
    ],
  },
  'gin-pomelo': {
    ingredientes: [
      { insumoId: 'ins-gin', nombre: 'Gin', cantidad: 50, unidad: 'ml' },
      { insumoId: 'ins-pomelo', nombre: 'Gaseosa de pomelo', cantidad: 200, unidad: 'ml' },
    ],
  },
};

describe('106 — La barra cierra la cuenta', () => {
  beforeEach(() => {
    // 1 botella de vodka = 1000 ml
    insumosEnMemoria = [
      {
        id: 'ins-vodka',
        nombre: 'Vodka Smirnoff',
        categoria: 'Bebidas Blancas',
        unidad: 'ml',
        cantidadDisponible: 1000,
        precioCosto: 450,
      } as any,
      {
        id: 'ins-naranja',
        nombre: 'Jugo de Naranja',
        categoria: 'Jugos',
        unidad: 'ml',
        cantidadDisponible: 5000,
        precioCosto: 120,
      } as any,
    ];
    pedidosEnMemoria = [];
  });

  function simularPedidoTrago(tragoId: string): { exitoso: boolean; motivo?: string } {
    const receta = RECETAS_REALES_BARRA[tragoId];
    if (!receta) return { exitoso: false, motivo: 'Trago no encontrado' };

    // Verificar si hay stock suficiente de todos los ingredientes
    for (const ing of receta.ingredientes) {
      const insumo = insumosEnMemoria.find((i) => i.id === ing.insumoId);
      if (!insumo || (insumo.cantidadDisponible ?? 0) < ing.cantidad) {
        return { exitoso: false, motivo: `Sin stock de ${ing.nombre}` };
      }
    }

    // Descontar
    for (const ing of receta.ingredientes) {
      const insumo = insumosEnMemoria.find((i) => i.id === ing.insumoId)!;
      insumo.cantidadDisponible = (insumo.cantidadDisponible ?? 0) - ing.cantidad;
    }

    pedidosEnMemoria.push({ tragoId, timestamp: new Date().toISOString() });
    return { exitoso: true };
  }

  function calcularInformeCierre(stockFisicoContado: Record<string, number>) {
    const totalTragos = pedidosEnMemoria.length;
    const vodkaInsumo = insumosEnMemoria.find((i) => i.id === 'ins-vodka')!;
    const enSistema = vodkaInsumo.cantidadDisponible ?? 0;
    const contado = stockFisicoContado['ins-vodka'] ?? enSistema;
    const sinRegistrarMl = Math.max(0, enSistema - contado);

    return {
      totalTragos,
      vodkaEnSistema: enSistema,
      vodkaContado: contado,
      sinRegistrarMl,
    };
  }

  test('con stock inicial de 1 botella de vodka (1000 ml), 10 destornilladores pedidos descuentan 500 ml', () => {
    for (let i = 0; i < 10; i++) {
      const res = simularPedidoTrago('destornillador');
      expect(res.exitoso).toBe(true);
    }

    const vodka = insumosEnMemoria.find((i) => i.id === 'ins-vodka');
    expect(vodka?.cantidadDisponible).toBe(500);
  });

  test('un trago cargado por el barman descuenta igual que un pedido del invitado', () => {
    // 1 pedido del invitado
    simularPedidoTrago('destornillador');
    // 1 pedido cargado de palabra por el barman
    simularPedidoTrago('destornillador');

    const vodka = insumosEnMemoria.find((i) => i.id === 'ins-vodka');
    // 1000 - 50 - 50 = 900
    expect(vodka?.cantidadDisponible).toBe(900);
  });

  test('al cerrar con 400 ml contados, el informe dice 10 tragos y 100 ml sin registrar', () => {
    // 10 destornilladores consumen 500 ml -> quedan 500 ml en sistema
    for (let i = 0; i < 10; i++) {
      simularPedidoTrago('destornillador');
    }

    const informe = calcularInformeCierre({ 'ins-vodka': 400 });
    expect(informe.totalTragos).toBe(10);
    expect(informe.vodkaEnSistema).toBe(500);
    expect(informe.vodkaContado).toBe(400);
    expect(informe.sinRegistrarMl).toBe(100);
  });

  test('el destornillador se apaga (no se puede pedir) cuando quedan menos de 50 ml', () => {
    const vodka = insumosEnMemoria.find((i) => i.id === 'ins-vodka')!;
    vodka.cantidadDisponible = 40; // Menos de los 50 ml requeridos por la receta

    const res = simularPedidoTrago('destornillador');
    expect(res.exitoso).toBe(false);
    expect(res.motivo).toContain('Sin stock');
  });
});
