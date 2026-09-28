/**
 * Mejoras del 27/09/2026 para la noche del evento:
 * - la cámara dice qué tocar según lo que falló, no "revisá los permisos" para todo;
 * - el tótem se prende con el permiso que ya trae el enlace del panel, sin iniciar sesión;
 * - la fotocabina arranca con el botón a la vista y las opciones plegadas.
 */
import fs from 'fs';
import path from 'path';
import { explicarFallaDeCamara } from '@/lib/entertainment/falla-de-camara';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
const falla = (name: string) => Object.assign(new Error('x'), { name });

describe('la cámara dice qué tocar', () => {
  it('distingue permiso, cámara que falta y cámara ocupada', () => {
    const permiso = explicarFallaDeCamara(falla('NotAllowedError'));
    const falta = explicarFallaDeCamara(falla('NotFoundError'));
    const ocupada = explicarFallaDeCamara(falla('NotReadableError'));
    expect(permiso).toMatch(/permiso/i);
    expect(falta).toMatch(/conectada/i);
    expect(ocupada).toMatch(/ocupada/i);
    expect(new Set([permiso, falta, ocupada]).size).toBe(3);
    // "No se encontr" es la señal de fiesta perdida que mira la prueba de la noche: el aviso de
    // cámara no puede empezar igual, o la estación parece rota cuando sólo falta la cámara.
    for (const aviso of [permiso, falta, ocupada]) expect(aviso).not.toMatch(/No se encontr/i);
    expect(explicarFallaDeCamara('cualquier cosa')).toMatch(/cámara/);
  });

  it.each([
    'src/app/evento/fotocabina/[fiestaId]/page.tsx',
    'src/app/evento/plataforma-360/[fiestaId]/page.tsx',
    'src/app/evento/touchpix/[fiestaId]/page.tsx',
    'src/app/evento/espejo-magico/[fiestaId]/page.tsx',
  ])('%s usa la explicación con el error de verdad', (archivo) => {
    const codigo = leer(archivo);
    expect(codigo).toMatch(/explicarFallaDeCamara\(err\)/);
    expect(codigo).not.toMatch(/No se pudo acceder a la cámara\. (Por favor, )?[Rr]evis/);
  });
});

describe('el tótem usa el permiso del enlace', () => {
  const codigo = leer('src/app/evento/totem/[fiestaId]/[totemId]/page.tsx');
  it('arranca con el permiso del enlace y no pide sesión si lo tiene', () => {
    expect(codigo).toMatch(/useSearchParams\(\)\.get\('access'\)/);
    expect(codigo).toMatch(/useState\(permisoDelEnlace\)/);
    expect(codigo).toMatch(/if \(permisoDelEnlace\) return;\s*let vigente/);
  });
  it('el panel arma el enlace del tótem con ese permiso', () => {
    expect(leer('src/lib/entertainment/station-config.ts')).toMatch(
      /case 'totems':\s*return withQuery\(`\/evento\/totem\/\$\{fiestaId\}\/totem-1`, \{ access: accessToken \}\)/
    );
  });
});

describe('la fotocabina saca la foto en un toque', () => {
  const codigo = leer('src/app/evento/fotocabina/[fiestaId]/page.tsx');
  it('las opciones arrancan plegadas y el botón va antes que ellas', () => {
    expect(codigo).toMatch(/useState\(false\);[^\n]*|const \[mostrarOpciones, setMostrarOpciones\] = useState\(false\)/);
    const boton = codigo.indexOf('data-testid="boton-sacar-foto"');
    const opciones = codigo.indexOf('{mostrarOpciones && (');
    const stickers = codigo.indexOf('data-testid="selector-stickers"');
    expect(boton).toBeGreaterThan(0);
    expect(opciones).toBeGreaterThan(boton);
    expect(stickers).toBeGreaterThan(opciones);
  });
});
