import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();
const leer = (p: string) => fs.readFileSync(path.join(RAIZ, p), 'utf8');

/**
 * Lo que corre solo no puede correr de más.
 *
 * Estas cuatro cosas pasaron los cinco controles de salud sin despeinarse: compila,
 * los tipos están en cero y las pruebas daban verde. Se veían sólo mirando **qué
 * pasa cuando dos personas del equipo tienen la aplicación abierta al mismo tiempo**.
 *
 * Por eso quedan congeladas acá: si alguien las deshace, esto avisa.
 */
describe('Lo automático no sale dos veces', () => {
  it('un posteo ya publicado no se vuelve a publicar solo', () => {
    const publicador = leer('src/lib/presencia-digital/publicador.ts');

    // La puerta de entrada corta el reenvío cuando el posteo ya salió.
    expect(publicador).toMatch(/targetPost\.status === 'Publicado'/);

    // Y la vuelta programada relee el estado justo antes de mandar, porque entre
    // que armó la lista y le toca el turno a este posteo, otra pestaña pudo haberlo
    // publicado.
    expect(publicador).toMatch(/alDia\.status !== 'Programado'/);
  });

  it('la nota del blog se pide por un solo camino, no por dos', () => {
    const disparador = leer('src/components/marketing/marketing-automation-trigger.tsx');

    // El segundo camino generaba la nota otra vez y la pagaba otra vez.
    expect(disparador).not.toContain("fetch('/api/marketing/automation'");
    expect(disparador).toContain('dispararTareasVencidasDeFondo');
  });

  it('las tareas de fondo las dispara un administrador, no cualquiera del equipo', () => {
    const acciones = leer('src/app/actions/tareas-automaticas.actions.ts');
    const cuerpo = acciones.slice(acciones.indexOf('export async function dispararTareasVencidasDeFondo'));

    expect(cuerpo).toContain('requireAdminSession');
  });

  it('nada de lo que corre solo le escribe al prospecto', () => {
    const acciones = leer('src/app/actions/tareas-automaticas.actions.ts');

    // Toda llamada a la automatización de marketing tiene que apagar el recontacto
    // a mano: viene prendido por defecto, y manda mensajes a prospectos reales.
    const llamadas = acciones.match(/runMarketingAutomation\([^)]*\)/g) ?? [];
    expect(llamadas.length).toBeGreaterThan(0);
    for (const llamada of llamadas) {
      expect(llamada).toContain('includeRecontacto: false');
    }
  });
});
