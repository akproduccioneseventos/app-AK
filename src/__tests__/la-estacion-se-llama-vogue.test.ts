import fs from 'fs';
import path from 'path';
import { nombreVisibleDeEstacion } from '../lib/entertainment/station-config';

describe('La estación de boomerang se llama Vogue', () => {
  it('nombreVisibleDeEstacion traduce Bogue a Vogue', () => {
    expect(nombreVisibleDeEstacion('Bogue / Boomerang')).toBe('Vogue / Boomerang');
    expect(nombreVisibleDeEstacion('Estación Bogue')).toBe('Estación Vogue');
    expect(nombreVisibleDeEstacion('bogue')).toBe('bogue'); // minúscula técnica se mantiene
  });

  it('la ruta de la estación sigue existiendo por compatibilidad con QR', () => {
    const ruta = path.join(process.cwd(), 'src/app/evento/bogue/[fiestaId]/page.tsx');
    expect(fs.existsSync(ruta)).toBe(true);
  });

  it('los textos visibles y nombres de servicio en archivos clave dicen Vogue y no Bogue', () => {
    const archivosAControlar = [
      'src/lib/entertainment/station-config.ts',
      'src/app/actions/fiesta/entretenimiento.actions.ts',
      'src/app/api/manifest-estacion/route.ts',
      'src/app/actions/public-guest-portal.ts',
      'src/lib/entretenimiento/resumen-noche.ts',
      'src/app/evento/bogue/layout.tsx',
      'src/components/public/InteractiveTechShowcase.tsx',
      'src/lib/zona-digital-adolescentes.ts',
      'src/lib/technology-ak/fiesta-technology-products.ts',
      'src/lib/portfolio-experience/portfolio-experience-data.ts',
      'src/lib/commercial/portal-led-pro-visual-model.ts',
      'src/data/tecnologia-ak.ts',
      'src/app/(app)/fiestas/[id]/entretenimiento/control/page.tsx',
      'src/app/(app)/fiestas/nueva/entretenimiento/page.tsx',
      'src/app/(app)/fiestas/nueva/page.tsx',
      'src/data/servicios-empresa.json',
    ];

    for (const relPath of archivosAControlar) {
      const fullPath = path.join(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Falla si encuentra "Bogue" con mayúscula en textos / etiquetas
      // (salvo comentarios o id en minúsculas)
      const lineas = content.split('\n');
      lineas.forEach((linea, num) => {
        const trim = linea.trim();
        if (trim.startsWith('//') || trim.startsWith('/*') || trim.startsWith('*')) return;
        // Si tiene Bogue con mayúscula, revisamos si es texto visible
        if (/\bBogue\b/.test(linea)) {
          // Si es en station-config dentro del regex de reemplazo, permitimos
          if (relPath.includes('station-config.ts') && linea.includes('replace')) return;
          throw new Error(`Encontrado 'Bogue' en ${relPath}:${num + 1} -> "${trim}"`);
        }
      });
    }
  });
});
