/**
 * Reglas del dueño (21/10/2026):
 * - "ayudante de cocina es cada 25 invitados; va primero el chef y luego los ayudantes; ejemplo 100
 *   invitados el chef y 3 ayudantes de cocina".
 * - "utilera cada 30 invitados".
 * - "barman cobra 2000 menos de 100 invitados, de 100 a 140 2800, y si pasa 150, 2 barman a 2000".
 * Antes: un ayudante cada 50 y ningún chef, un utilero cada 25, un barman cada 75 al sueldo de la
 * ficha, y "Barman" caía en "Ayudante de Barman" por estar antes en la lista.
 */
import fs from 'fs';
import path from 'path';
import { barmanPorInvitados, buscarRol, personalDeCocina, utilerosPorInvitados } from '@/lib/fiesta/personal-por-invitados';

describe('el personal sale de las reglas del dueño', () => {
  it('cocina: el chef primero y un ayudante cada 25', () => {
    expect(personalDeCocina(100)).toEqual({ chef: 1, ayudantes: 3 });
    expect(personalDeCocina(101)).toEqual({ chef: 1, ayudantes: 4 });
    expect(personalDeCocina(20)).toEqual({ chef: 1, ayudantes: 0 });
  });

  it('utileros: uno cada 30', () => {
    expect(utilerosPorInvitados(30)).toBe(1);
    expect(utilerosPorInvitados(31)).toBe(2);
    expect(utilerosPorInvitados(120)).toBe(4);
  });

  it('barra: cantidad y sueldo por invitados', () => {
    expect(barmanPorInvitados(99)).toEqual({ cantidad: 1, sueldo: 2000 });
    expect(barmanPorInvitados(100)).toEqual({ cantidad: 1, sueldo: 2800 });
    expect(barmanPorInvitados(140)).toEqual({ cantidad: 1, sueldo: 2800 });
    expect(barmanPorInvitados(151)).toEqual({ cantidad: 2, sueldo: 2000 });
  });

  it('"Barman" no cae en "Ayudante de Barman"', () => {
    const roles = [{ nombre: 'Ayudante de Barman' }, { nombre: 'Barman' }, { nombre: 'Mozo ' }];
    expect(buscarRol(roles, 'Barman')?.nombre).toBe('Barman');
    expect(buscarRol(roles, 'Mozo')?.nombre).toBe('Mozo ');
  });

  it('Codex 178: "Mozo" va al mozo de atención, nunca al de cocina', () => {
    const catalogo = ['Mozo de Cocina', 'Mozo de Atención', 'Chef', 'Ayudante de Cocina', 'Utilero', 'Barman'].map(nombre => ({ nombre }));
    expect(buscarRol(catalogo, 'Mozo')?.nombre).toBe('Mozo de Atención');
    expect(buscarRol(catalogo, 'Ayudante de Cocina')?.nombre).toBe('Ayudante de Cocina');
    expect(buscarRol(catalogo, 'Chef')?.nombre).toBe('Chef');
    // Si sólo existe el de cocina, no se inventa: mejor una vacante menos que mozos de salón en la cocina.
    expect(buscarRol([{ nombre: 'Mozo de Cocina' }], 'Mozo')).toBeUndefined();
    expect(buscarRol([{ nombre: 'Ayudante de Barman' }], 'Barman')).toBeUndefined();
  });

  it('las dos pantallas que arman el personal usan las reglas', () => {
    const leer = (a: string) => fs.readFileSync(path.join(process.cwd(), a), 'utf8');
    const fiesta = leer('src/app/actions/fiesta/fiesta.actions.ts');
    expect(fiesta).toMatch(/personalDeCocina\(guests\)/);
    expect(fiesta).toMatch(/utilerosPorInvitados\(guests\)/);
    expect(fiesta).toMatch(/addVacantes\('Barman', barra\.cantidad, barra\.sueldo\)/);
    expect(fiesta).not.toMatch(/guests \/ (50|75)/);
    const pantalla = leer('src/app/(app)/fiestas/nueva/personal/page.tsx');
    expect(pantalla).toMatch(/personalDeCocina\(/);
    expect(pantalla).toMatch(/utilerosPorInvitados\(totalGuests\)/);
    expect(pantalla).toMatch(/barra\.sueldo\)/);
    expect(pantalla).toMatch(/name\.includes\('mozo'\) && !name\.includes\('cocina'\)/);
  });
});
