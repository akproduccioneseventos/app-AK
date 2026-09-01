import { armarHojaDeCocina } from '@/lib/catering/hoja-de-cocina';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * La hoja de cocina de la noche del evento.
 *
 * Lo que se comprueba no es que el codigo exista: es que **los numeros esten
 * bien**, porque de estos numeros depende que la gente coma.
 *
 * Las dos cuentas que ya salieron mal antes en otras pantallas:
 *
 * 1. **Las porciones por grupo.** El plato principal se cuenta por adultos y el
 *    infantil por chicos. Si se cuentan todos para todo, se cocina de mas o de
 *    menos.
 * 2. **Los platos especiales se cuentan por PERSONA, no por fila.** Una familia
 *    de cinco celiacos figuraba como un solo plato especial y cuatro se quedaban
 *    sin comer.
 */

function fiestaCon(invitados: unknown[] = []): FiestaEnPlanificacion {
  return {
    id: 'f1',
    configuracion: { nombreEvento: 'Los 15 de Valentina', fechaEvento: '2026-10-15' },
    invitados,
  } as unknown as FiestaEnPlanificacion;
}

const PLATOS = [
  { nombre: 'Tabla de fiambres', categoria: 'Entrada' },
  { nombre: 'Lomo al champignon', categoria: 'Plato Principal' },
  { nombre: 'Nuggets con papas', categoria: 'Menú Infantil' },
  { nombre: 'Torta de la quinceañera', categoria: 'Postre' },
];

describe('la hoja de cocina', () => {
  it('cuenta las porciones por grupo, no todas iguales', () => {
    const hoja = armarHojaDeCocina(fiestaCon(), PLATOS, { adultos: 100, chicos: 20 });

    const porNombre = (n: string) => hoja.platos.find((p) => p.nombre.startsWith(n));

    expect(porNombre('Tabla')?.porciones).toBe(120); // entrada: todos
    expect(porNombre('Lomo')?.porciones).toBe(100); // principal: adultos
    expect(porNombre('Nuggets')?.porciones).toBe(20); // infantil: chicos
    expect(porNombre('Torta')?.porciones).toBe(120); // postre: todos
  });

  it('ordena los platos por el momento del servicio, no como vengan', () => {
    const desordenados = [PLATOS[3], PLATOS[1], PLATOS[0]];
    const hoja = armarHojaDeCocina(fiestaCon(), desordenados, { adultos: 10, chicos: 0 });

    expect(hoja.platos.map((p) => p.momento)).toEqual(['Entrada', 'Plato Principal', 'Postre']);
  });

  it('cuenta los platos especiales por PERSONA: una familia de cinco son cinco', () => {
    const hoja = armarHojaDeCocina(
      fiestaCon([
        { rsvp: 'Confirmado', dietaryRestriction: 'Celiaco', partySize: 5 },
        { rsvp: 'Confirmado', dietaryRestriction: 'Vegano', partySize: 1 },
        { rsvp: 'Confirmado', dietaryRestriction: 'Ninguna', partySize: 3 },
        { rsvp: 'Pendiente', dietaryRestriction: 'Vegano', partySize: 2 },
      ]),
      PLATOS,
      { adultos: 100, chicos: 0 },
    );

    const celiacos = hoja.especiales.find((e) => e.restriccion === 'Celiaco');
    expect(celiacos?.personas).toBe(5);

    // El vegano que todavia no confirmo NO se cuenta: se cocina para los que vienen.
    const veganos = hoja.especiales.find((e) => e.restriccion === 'Vegano');
    expect(veganos?.personas).toBe(1);

    // Y el que no tiene restriccion no aparece como plato especial.
    expect(hoja.especiales.some((e) => e.restriccion === 'Ninguna')).toBe(false);
  });

  it('avisa en criollo cuando falta cargar algo, en vez de dar numeros en cero', () => {
    const sinPlatos = armarHojaDeCocina(fiestaCon(), [], { adultos: 50, chicos: 0 });
    expect(sinPlatos.avisos.join(' ')).toMatch(/no hay platos cargados/i);

    const sinInvitados = armarHojaDeCocina(fiestaCon(), PLATOS, { adultos: 0, chicos: 0 });
    expect(sinInvitados.avisos.join(' ')).toMatch(/no hay cantidad de invitados/i);
  });
});
