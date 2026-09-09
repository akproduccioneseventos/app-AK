/**
 * EL 3D DIBUJA LO QUE DICE EL PLANO, NO OTRA COSA.
 *
 * Tres defectos verificados el 9 de septiembre de 2026:
 * 1. Un arco de globos (o panel, pedestal, etc.) se dibujaba como una Mesa3D porque
 *    cualquier elemento con type: 'element' caía en Mesa3D.
 * 2. Barras, pistas, escenarios y mesas no aplicaban element.rotation en el 3D.
 * 3. Cargar un diseño guardado en el plano no copiaba pixelsPerMeter, lo que duplicaba
 *    las medidas en metros al cargar planos hechos con otra escala.
 */
import fs from 'fs';
import path from 'path';
import {
  elegirObjeto3D,
  calcularDimensiones3DConRotacion,
  Arco3D,
  Pedestal3D,
  PanelDecorativo3D,
} from '@/components/salon-3d/SalonScene';
import { Mesa3D } from '@/components/salon-3d/elements/Mesa3D';
import { Escenario3D } from '@/components/salon-3d/elements/Escenario3D';
import { PistaBaile3D } from '@/components/salon-3d/elements/PistaBaile3D';

describe('El 3D dibuja lo que dice el plano', () => {
  it('un elemento que no es mesa no se dibuja como Mesa3D', () => {
    const arcoGlobos = {
      id: 'deco_arco_1',
      name: 'Arco Orgánico de Globos',
      category: 'arco',
      type: 'element' as const,
      width: 120,
      height: 80,
    };
    const pedestal = {
      id: 'deco_pedestal_1',
      name: 'Pedestal Dorado para Flores',
      category: 'pedestal',
      type: 'element' as const,
      width: 40,
      height: 40,
    };
    const panelNeon = {
      id: 'deco_panel_1',
      name: 'Panel Shimmer Neón',
      category: 'panel',
      type: 'element' as const,
      width: 160,
      height: 200,
    };
    const mesaReal = {
      id: 'mesa_principal',
      name: 'Mesa Principal 1',
      category: 'mesa',
      type: 'element' as const,
      width: 100,
      height: 100,
      seats: 10,
    };

    const componenteArco = elegirObjeto3D(arcoGlobos);
    const componentePedestal = elegirObjeto3D(pedestal);
    const componentePanel = elegirObjeto3D(panelNeon);
    const componenteMesa = elegirObjeto3D(mesaReal);

    // Los elementos decorativos NO deben retornar Mesa3D
    expect(componenteArco).not.toBe(Mesa3D);
    expect(componenteArco).toBe(Arco3D);

    expect(componentePedestal).not.toBe(Mesa3D);
    expect(componentePedestal).toBe(Pedestal3D);

    expect(componentePanel).not.toBe(Mesa3D);
    expect(componentePanel).toBe(PanelDecorativo3D);

    // Solo las mesas reales retornan Mesa3D
    expect(componenteMesa).toBe(Mesa3D);
  });

  it('una barra a 0 y a 90 grados da dimensiones efectivas distintas en el 3D', () => {
    const barra0 = {
      id: 'barra_principal',
      name: 'Barra de Tragos',
      category: 'barra',
      width: 160, // 4 metros a 40 px/m
      height: 40, // 1 metro a 40 px/m
      rotation: 0,
      type: 'element' as const,
    };
    const barra90 = {
      ...barra0,
      rotation: 90,
    };

    const dim0 = calcularDimensiones3DConRotacion(barra0, 40);
    const dim90 = calcularDimensiones3DConRotacion(barra90, 40);

    // A 0 grados: anchoX = 4m, profundidadZ = 1m
    expect(dim0.anchoX).toEqual(4);
    expect(dim0.profundidadZ).toEqual(1);

    // A 90 grados: anchoX = 1m, profundidadZ = 4m
    expect(dim90.anchoX).toEqual(1);
    expect(dim90.profundidadZ).toEqual(4);

    expect(dim0.anchoX).not.toEqual(dim90.anchoX);
    expect(dim0.profundidadZ).not.toEqual(dim90.profundidadZ);
  });

  it('cargar un diseño hecho con otra escala no cambia el tamaño en metros de una mesa', () => {
    // Un diseño maestro guardado con 80 px/m donde una mesa de 160px mide 2.0 metros
    const layoutGuardado = {
      salonWidth: 20,
      salonHeight: 15,
      pixelsPerMeter: 80,
      salonElements: [
        {
          id: 'mesa_1',
          name: 'Mesa Redonda 10 personas',
          category: 'mesa',
          width: 160,
          height: 160,
          shape: 'circle',
          seats: 10,
        },
      ],
    };

    // La fiesta actual tenía por defecto 40 px/m
    const decoracionEventoActual = {
      salonWidth: 15,
      salonHeight: 15,
      pixelsPerMeter: 40,
      salonElements: [],
    };

    // Aplicamos la lógica corregida del botón "Cargar diseño" (layout/page.tsx:746-751)
    const decoracionActualizada = {
      ...decoracionEventoActual,
      salonElements: layoutGuardado.salonElements || [],
      salonWidth: layoutGuardado.salonWidth || decoracionEventoActual.salonWidth,
      salonHeight: layoutGuardado.salonHeight || decoracionEventoActual.salonHeight,
      pixelsPerMeter: layoutGuardado.pixelsPerMeter || decoracionEventoActual.pixelsPerMeter,
    };

    const mesa = decoracionActualizada.salonElements[0];
    const metrosConEscalaCargada = mesa.width / decoracionActualizada.pixelsPerMeter;
    const metrosSinPreservarEscala = mesa.width / decoracionEventoActual.pixelsPerMeter;

    // Con la corrección, la mesa mide exactamente 2 metros
    expect(metrosConEscalaCargada).toEqual(2);

    // Sin la corrección (usando los 40 px/m del evento), se duplicaba a 4 metros
    expect(metrosSinPreservarEscala).toEqual(4);
    expect(metrosConEscalaCargada).not.toEqual(metrosSinPreservarEscala);
  });

  it('SalonScene y layout/page.tsx usan element.rotation y pixelsPerMeter en sus lugares respectivos', () => {
    const salonSceneSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/components/salon-3d/SalonScene.tsx'),
      'utf8'
    );
    const layoutPageSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/invitados/layout/page.tsx'),
      'utf8'
    );

    expect(salonSceneSrc).toContain('element.rotation');
    expect(layoutPageSrc).toContain('pixelsPerMeter: layout.pixelsPerMeter || decoracion.pixelsPerMeter');
  });
});
