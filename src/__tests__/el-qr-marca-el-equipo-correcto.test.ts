/**
 * Carga de equipos con QR (ak-equipo:<id>).
 * Comprueba:
 * - un id existente marca cargado
 * - escaneado dos veces, marca retornado
 * - un id ajeno no marca nada
 */

import { procesarEscaneoQREquipo } from '@/lib/logistica/qr-carga';
import type { CargaOperativaCategoria } from '@/types/fiesta';

describe('el QR marca el equipo correcto', () => {
  const categoriasIniciales: CargaOperativaCategoria[] = [
    {
      id: 'cat_luces',
      nombre: 'Iluminación',
      items: [
        {
          id: 'item_cabezales',
          origenId: 'equipo_cabezal_movil',
          nombre: 'Cabezal Móvil Beam 7R',
          cantidad: '4',
          cargado: false,
          retornado: false,
        },
        {
          id: 'item_laser',
          origenId: 'equipo_laser_rgb',
          nombre: 'Láser RGB 3W',
          cantidad: '1',
          cargado: false,
          retornado: false,
        },
      ],
    },
  ];

  it('un id existente marca cargado', () => {
    const res = procesarEscaneoQREquipo(
      'ak-equipo:equipo_cabezal_movil',
      categoriasIniciales,
    );

    expect(res.encontrado).toBe(true);
    expect(res.accion).toBe('cargado');
    expect(res.itemModificado?.cargado).toBe(true);
    expect(res.itemModificado?.retornado).toBe(false);

    // El otro item sigue intacto
    const laser = res.categoriasActualizadas[0].items.find(
      (i) => i.origenId === 'equipo_laser_rgb',
    );
    expect(laser?.cargado).toBe(false);
  });

  it('escaneado dos veces, marca retornado', () => {
    // Primer escaneo: marca cargado
    const primerPaso = procesarEscaneoQREquipo(
      'ak-equipo:equipo_cabezal_movil',
      categoriasIniciales,
    );
    expect(primerPaso.accion).toBe('cargado');

    // Segundo escaneo sobre las categorías ya actualizadas: marca retornado
    const segundoPaso = procesarEscaneoQREquipo(
      'ak-equipo:equipo_cabezal_movil',
      primerPaso.categoriasActualizadas,
    );

    expect(segundoPaso.encontrado).toBe(true);
    expect(segundoPaso.accion).toBe('retornado');
    expect(segundoPaso.itemModificado?.cargado).toBe(true);
    expect(segundoPaso.itemModificado?.retornado).toBe(true);
  });

  it('un id ajeno no marca nada y avisa el error', () => {
    const res = procesarEscaneoQREquipo(
      'ak-equipo:equipo_inexistente_999',
      categoriasIniciales,
    );

    expect(res.encontrado).toBe(false);
    expect(res.accion).toBeUndefined();
    expect(res.itemModificado).toBeUndefined();
    expect(res.error).toBeDefined();

    // Ningún item fue modificado
    const cabezal = res.categoriasActualizadas[0].items.find(
      (i) => i.origenId === 'equipo_cabezal_movil',
    );
    expect(cabezal?.cargado).toBe(false);
    expect(cabezal?.retornado).toBe(false);
  });
});
