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
const pantalla = leer('src/app/marketing/demo-tecnologia/page.tsx');

describe('La demo de tecnología', () => {
  it('pregunta si hay sesión del equipo al abrir', () => {
    expect(pantalla).toMatch(/import \{ getSessionStatus \} from '@\/app\/actions\/session'/);
    expect(pantalla).toMatch(/getSessionStatus\(\)\.then\(setHayEquipo\)/);
    // y si la consulta falla, se trata como visitante, no como equipo
    expect(pantalla).toMatch(/\.catch\(\(\) => setHayEquipo\(false\)\)/);
  });

  it('los tres botones de crear demo sólo salen para el equipo', () => {
    const iBotones = pantalla.indexOf("handleCreateDemo('xv')");
    const antes = pantalla.slice(0, iBotones);
    const condicion = antes.lastIndexOf('hayEquipo === true &&');
    expect(condicion).toBeGreaterThan(-1);
    // la condición abre el bloque que contiene los tres botones, sin cerrarlo antes
    const bloque = pantalla.slice(condicion, pantalla.indexOf(") : (", iBotones));
    expect(bloque).toContain("handleCreateDemo('xv')");
    expect(bloque).toContain("handleCreateDemo('boda')");
    expect(bloque).toContain("handleCreateDemo('tecnologia-total')");
    // ningún botón de crear queda afuera de la condición
    expect(pantalla.match(/handleCreateDemo\('/g)).toHaveLength(3);
  });

  it('el visitante ve una línea que explica que la demo la arma el equipo', () => {
    expect(pantalla).toMatch(/hayEquipo === false/);
    expect(pantalla).toMatch(/la arma el equipo de AK durante la reunión/);
  });

  it('crear la demo sigue pidiendo sesión del equipo (no se hizo pública)', () => {
    const acciones = leer('src/app/actions/fiesta/fiesta.actions.ts');
    const cuerpo = acciones.slice(acciones.indexOf('export async function createDemoFiesta'));
    expect(cuerpo.slice(0, 400)).toContain('await requireAppSession()');
  });
});
