import {
  agregarVariantesBufet,
  menuItemToSimulatorService,
  BUFFET_PRICE_SURCHARGE,
  getMenuItemSellingPrice,
} from '@/lib/simulator/catalog';
import {
  getCateringSortScore,
  getCateringDisplayName,
  calculateSimulatorPricing,
  type SimulatorDetailedService,
} from '@/lib/simulator/pricing';
import { toSentenceCase } from '@/lib/utils/text';
import type { FullMenu, MenuItem } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import type { ArmadoRapidoConfig } from '@/types/armado-rapido';

describe('Buffet Pricing (+200 pesos uruguayos)', () => {
  const baseDishes: MenuItem[] = [
    {
      id: 'dish_main_18',
      name: 'ASADO COMPLETO C/ GUARNICIÓN',
      type: 'Plato Principal',
      totalDishCost: 350,
      profitMargin: 120,
      suggestedSellingPrice: 770,
    },
    {
      id: 'dish_main_2',
      name: 'POLLO ARROLLADO C/ GUARNICIÓN',
      type: 'Plato Principal',
      totalDishCost: 189.4,
      profitMargin: 137,
      suggestedSellingPrice: 449,
    },
    {
      id: 'dish_main_17',
      name: 'CORDERO ASADO C/ GUARNICIÓN',
      type: 'Plato Principal',
      totalDishCost: 400,
      profitMargin: 120,
      suggestedSellingPrice: 880,
    },
    {
      id: 'dish_main_7',
      name: 'CERDO ARROLLADO C/ GUARNICIÓN',
      type: 'Plato Principal',
      totalDishCost: 280,
      profitMargin: 120,
      suggestedSellingPrice: 620,
    },
  ];

  const mockMenus: FullMenu[] = [
    {
      id: 'menu_principales_maestro',
      name: 'Catálogo Maestro de Platos Principales',
      items: [...baseDishes],
    },
  ];

  it('las variantes de mesa buffet deben costar SIEMPRE exactamente 200 pesos más que el plato base', () => {
    const menusConVariantes = agregarVariantesBufet(mockMenus);
    const menuMaestro = menusConVariantes.find((m) => m.id === 'menu_principales_maestro');
    expect(menuMaestro).toBeDefined();

    const items = menuMaestro!.items;
    const buffetVariants = items.filter((item) => item.id.endsWith('_virtual_buffet'));

    expect(buffetVariants).toHaveLength(4);

    // Nombres en formato limpio especificados
    expect(buffetVariants.map((v) => v.name).sort()).toEqual([
      'Asado completo con mesa buffet',
      'Cerdo arrollado con mesa buffet',
      'Cordero asado con mesa buffet',
      'Pollo arrollado con mesa buffet',
    ]);

    for (const variante of buffetVariants) {
      const baseId = variante.id.replace('_virtual_buffet', '');
      const platoBase = items.find((item) => item.id === baseId);
      expect(platoBase).toBeDefined();

      const basePrice = getMenuItemSellingPrice(platoBase!);
      const variantPrice = getMenuItemSellingPrice(variante);

      expect(variantPrice).toBe(basePrice + BUFFET_PRICE_SURCHARGE);
      expect(variante.suggestedSellingPrice).toBe(basePrice + 200);
    }
  });

  it('al pasar por menuItemToSimulatorService usa el precio aumentado en 200 para precioPorPersona, precioVenta y precioBase', () => {
    const menusConVariantes = agregarVariantesBufet(mockMenus);
    const menuMaestro = menusConVariantes.find((m) => m.id === 'menu_principales_maestro');
    const asadoBuffet = menuMaestro!.items.find((item) => item.name === 'Asado completo con mesa buffet')!;
    const asadoBase = menuMaestro!.items.find((item) => item.id === 'dish_main_18')!;

    const baseService = menuItemToSimulatorService(asadoBase);
    const buffetService = menuItemToSimulatorService(asadoBuffet);

    expect(buffetService.precioPorPersona).toBe(baseService.precioPorPersona + 200);
    expect(buffetService.precioVenta).toBe(baseService.precioVenta + 200);
    expect(buffetService.precioBase).toBe(baseService.precioBase + 200);
  });
});

describe('Orden Estricto de Catering en Presupuesto y Nombres en Sentence Case', () => {
  it('getCateringSortScore ordena en el orden: 1º Vajilla/mantelería/mobiliario, 2º Entradas, 3º Plato principal, 4º Niños y adolescentes, 5º Postres', () => {
    const vajilla = { nombre: 'Vajilla completa', subcategoria: 'Catering' };
    const manteleria = { nombre: 'Mantelería completa', subcategoria: 'Catering' };
    const mobiliario = { nombre: 'Mobiliario completo (mesas y sillas)', subcategoria: 'Catering' };
    const entrada = { id: 'dish_entrada_1', nombre: 'ARROLLADITOS PRIMAVERA', subcategoria: 'Entradas' };
    const tapas = { nombre: 'Tapas saborizadas', subcategoria: 'Entrada fría' };
    const principal = { id: 'dish_main_18', nombre: 'ASADO COMPLETO C/ GUARNICIÓN', subcategoria: 'Plato Principal' };
    const principalBuffet = { id: 'dish_main_18_virtual_buffet', nombre: 'Asado completo con mesa buffet', subcategoria: 'Plato Principal' };
    const menuInfantil = { id: 'dish_child_1', nombre: 'Hamburguesas con fritas', subcategoria: 'Menú Infantil' };
    const postre = { nombre: 'Mesa dulce con torta', subcategoria: 'Postre' };

    expect(getCateringSortScore(vajilla)).toBe(1);
    expect(getCateringSortScore(manteleria)).toBe(1);
    expect(getCateringSortScore(mobiliario)).toBe(1);
    expect(getCateringSortScore(entrada)).toBe(2);
    expect(getCateringSortScore(tapas)).toBe(2);
    expect(getCateringSortScore(principal)).toBe(3);
    expect(getCateringSortScore(principalBuffet)).toBe(3);
    expect(getCateringSortScore(menuInfantil)).toBe(4);
    expect(getCateringSortScore(postre)).toBe(5);

    const desordenados = [postre, principalBuffet, menuInfantil, vajilla, entrada, manteleria, principal];
    const ordenados = [...desordenados].sort((a, b) => getCateringSortScore(a) - getCateringSortScore(b));

    expect(ordenados[0].nombre).toBe('Vajilla completa');
    expect(ordenados[1].nombre).toBe('Mantelería completa');
    expect(ordenados[2].nombre).toBe('ARROLLADITOS PRIMAVERA');
    expect(ordenados[3].nombre).toBe('Asado completo con mesa buffet');
    expect(ordenados[4].nombre).toBe('ASADO COMPLETO C/ GUARNICIÓN');
    expect(ordenados[5].nombre).toBe('Hamburguesas con fritas');
    expect(ordenados[6].nombre).toBe('Mesa dulce con torta');
  });

  it('getCateringDisplayName formatea correctamente con el prefijo adecuado y sentence case', () => {
    const entrada = { id: 'dish_entrada_1', nombreServicio: 'ARROLLADITOS PRIMAVERA', subcategoria: 'Entradas' };
    const principalGuarnicion = { id: 'dish_main_18', nombreServicio: 'ASADO COMPLETO C/ GUARNICIÓN', subcategoria: 'Plato Principal' };
    const principalBuffet = { id: 'dish_main_18_virtual_buffet', nombreServicio: 'Asado completo con mesa buffet', subcategoria: 'Plato Principal' };
    const infantil = { id: 'dish_child_1', nombreServicio: 'HAMBURGUESAS CON FRITAS', subcategoria: 'Menú Infantil' };
    const vajilla = { nombreServicio: 'VAJILLA COMPLETA', subcategoria: 'Catering' };
    const manteleria = { nombreServicio: 'MANTELERIA COMPLETA', subcategoria: 'Catering' };
    const mobiliario = { nombreServicio: 'MOBILIARIO COMPLETO', subcategoria: 'Catering' };

    expect(getCateringDisplayName(entrada, 'Servicio de catering')).toBe('Entrada: Arrolladitos primavera');
    expect(getCateringDisplayName(principalGuarnicion, 'Servicio de catering')).toBe('Plato principal: Asado completo con guarnición');
    expect(getCateringDisplayName(principalBuffet, 'Servicio de catering')).toBe('Plato principal: Asado completo con mesa buffet');
    expect(getCateringDisplayName(infantil, 'Servicio de catering')).toBe('Menú de niños y adolescentes: Hamburguesas con fritas');
    expect(getCateringDisplayName(vajilla, 'Servicio de catering')).toBe('Vajilla completa');
    expect(getCateringDisplayName(manteleria, 'Servicio de catering')).toBe('Mantelería completa');
    expect(getCateringDisplayName(mobiliario, 'Servicio de catering')).toBe('Mobiliario completo');
  });

  it('calculateSimulatorPricing ordena los items de catering de forma estricta', () => {
    const config: ArmadoRapidoConfig = {
      descuentoGeneral: 10,
      paquetes: [],
      menus: [],
      platosVisibles: [],
      serviceDependencies: [],
      mostrarPrecios: true,
    };

    const servicios: ServicioEmpresa[] = [
      {
        id: 'serv_postre',
        nombre: 'Mesa dulce',
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering',
        subcategoria: 'Postres',
        calculationMethod: 'porPersona',
        precioPorPersona: 150,
      },
      {
        id: 'dish_main_18',
        nombre: 'ASADO COMPLETO C/ GUARNICIÓN',
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering',
        subcategoria: 'Plato Principal',
        calculationMethod: 'porPersona',
        precioPorPersona: 770,
      },
      {
        id: 'serv_vajilla',
        nombre: 'Vajilla completa',
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering',
        subcategoria: 'Catering',
        calculationMethod: 'porPersona',
        precioPorPersona: 80,
      },
      {
        id: 'dish_entrada_1',
        nombre: 'ARROLLADITOS PRIMAVERA',
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering',
        subcategoria: 'Entradas',
        calculationMethod: 'porPersona',
        precioPorPersona: 120,
      },
      {
        id: 'dish_child_1',
        nombre: 'Hamburguesas con fritas',
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering',
        subcategoria: 'Menú Infantil',
        calculationMethod: 'porPersona',
        precioPorPersona: 300,
      },
    ];

    const result = calculateSimulatorPricing({
      config,
      services: servicios,
      adultos: 50,
      ninosYAdolescentes: 10,
      selectedServices: servicios.map((s) => ({ id: s.id })),
      annualAdjustmentPercentage: 0,
    });

    const cateringItems = result.agrupados['Servicio de catering'];
    expect(cateringItems).toBeDefined();
    expect(cateringItems.map((i) => i.id)).toEqual([
      'serv_vajilla',     // 1: Vajilla
      'dish_entrada_1',   // 2: Entrada
      'dish_main_18',     // 3: Plato principal
      'dish_child_1',     // 4: Menú infantil
      'serv_postre',      // 5: Postre
    ]);
  });
});

describe('Utilidad toSentenceCase', () => {
  it('convierte texto en mayúsculas a primera letra mayúscula y resto minúscula', () => {
    expect(toSentenceCase('ARROLLADITOS PRIMAVERA')).toBe('Arrolladitos primavera');
    expect(toSentenceCase('TAPAS SABORIZADAS')).toBe('Tapas saborizadas');
  });

  it('reemplaza abreviatura informal c/ por con', () => {
    expect(toSentenceCase('ASADO COMPLETO C/ GUARNICIÓN')).toBe('Asado completo con guarnición');
    expect(toSentenceCase('POLLO ARROLLADO C/ GUARNICION')).toBe('Pollo arrollado con guarnición');
  });

  it('preserva siglas técnicas en mayúsculas (DJ, LED, AK, QR, IA, VIP, TV, HD, 4K, PWA, PDF, DMX, RSVP, OFF)', () => {
    expect(toSentenceCase('SHOW DE DJ CON PANTALLA LED')).toBe('Show de DJ con pantalla LED');
    expect(toSentenceCase('LUCES DMX Y VIDEO 4K EN TV HD')).toBe('Luces DMX y video 4K en TV HD');
    expect(toSentenceCase('CONFIRMACION POR RSVP Y CODIGO QR')).toBe('Confirmacion por RSVP y codigo QR');
    expect(toSentenceCase('AREA VIP CON 50% OFF')).toBe('Area VIP con 50% OFF');
    expect(toSentenceCase('EVENTO ASISTIDO POR IA Y APP PWA')).toBe('Evento asistido por IA y app PWA');
    expect(toSentenceCase('DESCARGA EN FORMATO PDF')).toBe('Descarga en formato PDF');
    expect(toSentenceCase('CONTRATACION CON AK PRODUCCIONES')).toBe('Contratacion con AK Producciones');
  });

  it('corrige tildes esenciales (Mantelería, Menú, Guarnición)', () => {
    expect(toSentenceCase('MANTELERIA COMPLETA')).toBe('Mantelería completa');
    expect(toSentenceCase('MENU INFANTIL')).toBe('Menú infantil');
    expect(toSentenceCase('ASADO CON GUARNICION')).toBe('Asado con guarnición');
  });

  it('capitaliza correctamente cláusulas tras dos puntos', () => {
    expect(toSentenceCase('ENTRADA: ARROLLADITOS PRIMAVERA')).toBe('Entrada: Arrolladitos primavera');
    expect(toSentenceCase('PLATO PRINCIPAL: ASADO COMPLETO')).toBe('Plato principal: Asado completo');
  });

  it('maneja valores vacíos, nulos o no-strings con seguridad', () => {
    expect(toSentenceCase('')).toBe('');
    expect(toSentenceCase(null)).toBe('');
    expect(toSentenceCase(undefined)).toBe('');
  });
});
