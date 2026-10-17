import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();

/**
 * Pantalla: /evento/mi-mesa/[fiestaId]
 * De mi mesa a la app del evento (Orden 181)
 */
describe('De mi mesa a la app de la fiesta (/evento/mi-mesa/[fiestaId])', () => {
  it('la pantalla mi-mesa incluye los enlaces a /evento/hub/ y /evento/barra/ antes de buscar otro nombre', () => {
    const miMesaFile = path.join(RAIZ, 'src/app/evento/mi-mesa/[fiestaId]/page.tsx');
    expect(fs.existsSync(miMesaFile)).toBe(true);
    const contenido = fs.readFileSync(miMesaFile, 'utf8');

    expect(contenido).toContain('/evento/hub/');
    expect(contenido).toContain('/evento/barra/');
    expect(contenido).toContain('Buscar otro nombre');

    // Verificar que los botones estén antes de Buscar otro nombre en el código
    const indexHub = contenido.indexOf('/evento/hub/');
    const indexOtro = contenido.indexOf('Buscar otro nombre');
    expect(indexHub).toBeLessThan(indexOtro);
  });
});
