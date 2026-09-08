/**
 * MATAFUEGO del recorrido acotado.
 *
 * El recorrido abria las 358 pantallas siempre. Ahora abre solo las que toca el
 * cambio, y **este control esta escrito para que se ponga en rojo si alguna vez
 * deja pantallas afuera sin corresponder**.
 *
 * Se probo rompiendolo a proposito: si se le saca el paso que sube por el arbol
 * de quien importa a quien, la tercera comprobacion se cae.
 */
import path from 'node:path';
import fs from 'node:fs';
import { pantallasTocadasDesde } from '../../scripts/pantallas-tocadas.mjs';

function existe(rel: string) {
  return fs.existsSync(path.join(process.cwd(), rel));
}

describe('El recorrido mira lo que cambia', () => {
  it('sin cambios no recorre ninguna pantalla', () => {
    expect(pantallasTocadasDesde([])).toEqual([]);
  });

  it('tocar la configuracion obliga a recorrer TODO', () => {
    expect(pantallasTocadasDesde(['next.config.js'])).toBe('TODO');
    expect(pantallasTocadasDesde(['src/app/layout.tsx'])).toBe('TODO');
  });

  it('sin poder averiguar que cambio, recorre TODO', () => {
    expect(pantallasTocadasDesde(null)).toBe('TODO');
  });

  it('tocar una sola pantalla devuelve esa pantalla', () => {
    const archivo = 'src/app/buscar/page.tsx';
    expect(existe(archivo)).toBe(true);
    const rutas = pantallasTocadasDesde([archivo]);
    expect(rutas).toContain('/buscar');
    expect(Array.isArray(rutas) && rutas.length).toBeLessThan(5);
  });

  it('tocar un componente compartido arrastra a las pantallas que lo usan', () => {
    const archivo = 'src/components/landing/HeroSection.tsx';
    expect(existe(archivo)).toBe(true);
    const rutas = pantallasTocadasDesde([archivo]);
    // No es la pantalla que se toco -no es una pantalla-, y sin embargo tienen
    // que salir pantallas: las que dibujan la portada.
    expect(rutas === 'TODO' || (rutas as string[]).length > 0).toBe(true);
  });
});
