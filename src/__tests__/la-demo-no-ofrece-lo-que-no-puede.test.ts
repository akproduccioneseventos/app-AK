/**
 * La demo de tecnología no ofrece a un prospecto lo que le va a fallar (8/10/2026).
 *
 * La pantalla es pública a propósito (se la mostramos a quien consulta), pero sus tres botones
 * de "crear demo" llaman a `createDemoFiesta`, que arma una fiesta y pide sesión del equipo: al
 * prospecto siempre le salía "Sesión no autorizada". Ahora los botones sólo aparecen si quien
 * mira es del equipo (`getSessionStatus`); el prospecto ve una línea que explica que la demo la
 * arma AK en la reunión. `createDemoFiesta` sigue sin ser pública.
 *
 * Se probó rompiéndolo: sacando la condición `hayEquipo === true` los botones vuelven a salir
 * para todos y el segundo caso se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf-8');
const nextConfig = leer('next.config.js');
const presentacionLed = leer('src/app/presentacion-led/page.tsx');

describe('La demo de tecnología (consolidada en /presentacion-led en Orden 321)', () => {
  it('redirige /marketing/demo-tecnologia a /presentacion-led en next.config.js', () => {
    expect(nextConfig).toContain("source: '/marketing/demo-tecnologia'");
    expect(nextConfig).toContain("destination: '/presentacion-led'");
  });

  it('la pantalla destino pública (/presentacion-led) no ofrece botones que llamen a createDemoFiesta', () => {
    expect(presentacionLed).not.toContain('createDemoFiesta(');
    expect(presentacionLed).not.toContain('handleCreateDemo(');
  });

  it('crear la demo sigue pidiendo sesión del equipo (no se hizo pública)', () => {
    const acciones = leer('src/app/actions/fiesta/fiesta.actions.ts');
    const cuerpo = acciones.slice(acciones.indexOf('export async function createDemoFiesta'));
    expect(cuerpo.slice(0, 400)).toContain('await requireAppSession()');
  });
});
