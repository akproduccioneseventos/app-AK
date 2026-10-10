import fs from 'fs';
import path from 'path';
import { claveDeConsolidado, normalizarUnidad } from '@/lib/compras/unidades';

/**
 * Orden 72 — Bloque 3: Claves de agrupación a las que les falta una parte.
 * Cubre la pantalla /fiestas/nueva/resumen-planificacion
 *
 * La lista de compras juntaba los renglones por nombre y proveedor sin la unidad,
 * por lo que 200 g y 2 kg se sumaban erróneamente.
 * `claveDeConsolidado` garantiza que la unidad normalizada forme parte de la clave,
 * evitando que cosas que se miden distinto colisionen o que se pierda la unidad base.
 */

describe('Orden 72 - Bloque 3: Las claves de agrupación no mienten', () => {
  const rootDir = process.cwd();

  it('resumen-planificacion agrupa con consolidarCompras, que arma la clave con claveDeConsolidado', () => {
    // Desde la orden 139 la cuenta vive en una sola funcion que usan las dos pantallas.
    const pantalla = path.join(rootDir, 'src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx');
    const funcion = path.join(rootDir, 'src/lib/compras/consolidar-compras.ts');
    expect(fs.existsSync(pantalla)).toBe(true);
    expect(fs.readFileSync(pantalla, 'utf8')).toMatch(/consolidarCompras\(\s*crudos/);
    const contenido = fs.readFileSync(funcion, 'utf8');
    expect(contenido).toContain("claveDeConsolidado");
    expect(contenido).toMatch(/const key = claveDeConsolidado\(/);
  });

  it('claveDeConsolidado incluye la unidad normalizada para no mezclar unidades distintas', () => {
    // Distintas unidades incompatibles generan distintas claves
    const keyUnidad = claveDeConsolidado('Manteca', 'Distribuidora', 'unidad');
    const keyKilo = claveDeConsolidado('Manteca', 'Distribuidora', 'kg');
    const keyBandeja = claveDeConsolidado('Manteca', 'Distribuidora', 'bandeja');

    expect(keyUnidad).not.toBe(keyKilo);
    expect(keyUnidad).not.toBe(keyBandeja);
    expect(keyKilo).not.toBe(keyBandeja);

    // Unidades compatibles de peso se normalizan a la misma unidad base 'kg'
    const keyGramo = claveDeConsolidado('Manteca', 'Distribuidora', 'g');
    expect(keyGramo).toBe(keyKilo);

    // Unidades compatibles de volumen se normalizan a la misma unidad base 'l'
    const keyMililitro = claveDeConsolidado('Leche', 'Distribuidora', 'ml');
    const keyLitro = claveDeConsolidado('Leche', 'Distribuidora', 'litro');
    expect(keyMililitro).toBe(keyLitro);
  });

  it('si la clave ignorara la unidad, fallaría distinguiendo unidades incompatibles', () => {
    // Si alguien armara la clave a mano solo con nombre y proveedor:
    const claveSinUnidad = (nombre: string, proveedor: string) => `${nombre.toLowerCase()}-${proveedor.toLowerCase()}`;

    // Dos renglones con distinta unidad darían la misma clave erróneamente:
    expect(claveSinUnidad('Manteca', 'Distribuidora')).toBe(claveSinUnidad('Manteca', 'Distribuidora'));

    // En cambio claveDeConsolidado NO permite que 'unidad' y 'kg' se agrupen juntos:
    expect(claveDeConsolidado('Manteca', 'Distribuidora', 'unidad')).not.toBe(
      claveDeConsolidado('Manteca', 'Distribuidora', 'kg')
    );
  });
});
