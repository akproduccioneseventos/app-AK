/**
 * MATAFUEGO — Leer la lista de invitados de una planilla.
 *
 * Cargar 200 invitados de a uno es lo que más tiempo le come al equipo, así que esto
 * tiene que entender la planilla que manda el cliente, no una planilla ideal.
 *
 * La prueba de navegador que traía esta función **no comprobaba nada**: abría una
 * pantalla interna que en el entorno de pruebas no ve las fiestas de prueba, tardaba
 * 95 segundos y se caía por tiempo. Esto corre en milésimas y sí comprueba.
 */
import { leerPlanillaDeInvitados } from '@/lib/invitados/leer-planilla';

describe('La planilla de invitados se entiende', () => {
  it('lee una planilla con comas y encabezado', () => {
    const r = leerPlanillaDeInvitados(
      ['Nombre,Mesa,Categoria', 'Valeria Rossi,3,Adulto', 'Gonzalo Méndez,3,Adulto', 'Mateo Méndez,4,Niño'].join('\n')
    );

    expect(r.filas).toHaveLength(3);
    expect(r.validos).toBe(3);
    expect(r.filas.map((f) => f.nombre)).toEqual(['Valeria Rossi', 'Gonzalo Méndez', 'Mateo Méndez']);
    expect(r.filas[2].categoria).toBe('Niño/Adolescente');
    expect(r.filas[0].tableNumber).toBe('3');
  });

  it('entiende el encabezado sin importar mayúsculas ni acentos', () => {
    for (const encabezado of ['NOMBRE', 'nombre y apellido', 'Invitado', 'Persona']) {
      const r = leerPlanillaDeInvitados(`${encabezado}\nAna Pérez`);
      // Jest no acepta un mensaje en expect: el encabezado va en el propio valor.
      expect(`${encabezado} -> ${r.filas[0]?.nombre}`).toBe(`${encabezado} -> Ana Pérez`);
    }
  });

  it('entiende punto y coma y tabulaciones, no sólo comas', () => {
    expect(leerPlanillaDeInvitados('Nombre;Mesa\nAna Pérez;5').filas[0].tableNumber).toBe('5');
    expect(leerPlanillaDeInvitados('Nombre\tMesa\nAna Pérez\t5').filas[0].tableNumber).toBe('5');
  });

  it('AVISA qué fila está mal en vez de guardar a medias', () => {
    const r = leerPlanillaDeInvitados(['Nombre,Mesa', 'Ana Pérez,1', ',2', 'Luis Gómez,3'].join('\n'));

    expect(r.filasSinNombre).toEqual([3]);
    expect(r.filas.find((f) => f.filaNum === 3)?.error).toContain('Fila 3');
    expect(r.validos).toBe(2);
  });

  it('marca a los repetidos, tanto dentro de la planilla como contra los ya cargados', () => {
    const r = leerPlanillaDeInvitados(
      ['Nombre', 'Ana Pérez', 'ana pérez', 'Luis Gómez'].join('\n'),
      ['Luis Gómez']
    );

    expect(r.repetidos).toBe(2);
    expect(r.filas.filter((f) => f.esRepetido).map((f) => f.nombre)).toEqual(['ana pérez', 'Luis Gómez']);
  });

  it('reconoce la restricción alimentaria escrita como la escribe la gente', () => {
    const r = leerPlanillaDeInvitados(
      ['Nombre,Restriccion', 'Ana,celiaca', 'Luis,vegetariano', 'Sol,alergia a los mariscos', 'Tom,'].join('\n')
    );

    expect(r.filas.map((f) => f.dietaryRestriction)).toEqual([
      'Celiaco',
      'Vegetariano',
      'Alergia Mariscos',
      'Ninguna',
    ]);
  });

  it('separa los acompañantes escritos con coma, punto y coma o barra', () => {
    const r = leerPlanillaDeInvitados('Nombre;Acompanantes\nAna;Luis / Sol');
    expect(r.filas[0].companionNames).toEqual(['Luis', 'Sol']);
  });

  it('una planilla sin encabezado igual se entiende: primera columna, el nombre', () => {
    const r = leerPlanillaDeInvitados('Ana Pérez,3\nLuis Gómez,4');
    expect(r.filas.map((f) => f.nombre)).toEqual(['Ana Pérez', 'Luis Gómez']);
  });

  it('una planilla vacía no rompe nada', () => {
    const r = leerPlanillaDeInvitados('   \n  \n');
    expect(r.filas).toEqual([]);
    expect(r.validos).toBe(0);
  });
});
