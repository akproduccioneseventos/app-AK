import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();

const ARCHIVOS_21_CABECERA = [
  'src/app/(app)/customers/reporte/page.tsx',
  'src/app/(app)/empresa/activos-fijos/reporte/page.tsx',
  'src/app/(app)/empresa/insumos/reporte/page.tsx',
  'src/app/(app)/empresa/menus/reporte/page.tsx',
  'src/app/(app)/empresa/servicios/reporte/page.tsx',
  'src/app/(app)/fiestas/nueva/carga-operativa/pdf/page.tsx',
  'src/app/(app)/fiestas/nueva/catering/hoja-de-cocina/page.tsx',
  'src/app/(app)/fiestas/nueva/decoracion/pdf/page.tsx',
  'src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page.tsx',
  'src/app/(app)/fiestas/nueva/gestion-documental/cambio-fecha/page.tsx',
  'src/app/(app)/fiestas/nueva/gestion-documental/cancelacion-parcial/page.tsx',
  'src/app/(app)/fiestas/nueva/gestion-documental/contrato-salon/page.tsx',
  'src/app/(app)/fiestas/nueva/gestion-documental/contrato-servicio/page.tsx',
  'src/app/(app)/fiestas/nueva/itinerario/pdf/page.tsx',
  'src/app/(app)/fiestas/nueva/musica/pdf/page.tsx',
  'src/app/(app)/fiestas/nueva/personal/recibos/page.tsx',
  'src/app/(app)/fiestas/nueva/resumen-imprimible/page.tsx',
  'src/app/(app)/presupuestos/reporte/page.tsx',
  'src/app/(app)/proveedores/reporte/page.tsx',
  'src/app/evento/impresion/[fiestaId]/page.tsx',
  'src/app/portal/[fiestaId]/contrato/page.tsx',
];

describe('Orden 178: Los documentos impresos conservan su cabecera', () => {
  it('en globals.css la regla de impresión no oculta las cabeceras documentales', () => {
    const css = fs.readFileSync(path.join(RAIZ, 'src/app/globals.css'), 'utf8');
    expect(css).toContain('header:not(.cabecera-documento)');
  });

  it.each(ARCHIVOS_21_CABECERA)('el documento %s tiene su header con la clase cabecera-documento', (relPath) => {
    const fullPath = path.join(RAIZ, relPath);
    expect(fs.existsSync(fullPath)).toBe(true);
    const content = fs.readFileSync(fullPath, 'utf8');
    expect(content).toMatch(/<header[^>]*className=["'][^"']*cabecera-documento/);
  });
});
