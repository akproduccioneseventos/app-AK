import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();

const ARCHIVOS_21_CABECERA = [
  'src/components/panels/customers--reporte.tsx',
  'src/components/panels/activos-fijos--reporte.tsx',
  'src/components/panels/insumos--reporte.tsx',
  'src/components/panels/menus--reporte.tsx',
  'src/components/panels/servicios--reporte.tsx',
  'src/components/panels/pdf--carga-operativa.tsx',
  'src/components/panels/catering--hoja-de-cocina.tsx',
  'src/components/panels/pdf--decoracion.tsx',
  'src/components/panels/costos--reporte.tsx',
  'src/components/panels/doc--cambio-fecha.tsx',
  'src/components/panels/doc--cancelacion-parcial.tsx',
  'src/components/panels/doc--contrato-salon.tsx',
  'src/components/panels/doc--contrato-servicio.tsx',
  'src/components/panels/pdf--itinerario.tsx',
  'src/components/panels/pdf--musica.tsx',
  'src/components/panels/personal--recibos.tsx',
  'src/app/(app)/fiestas/nueva/orden-de-evento/page.tsx',
  'src/components/panels/presupuestos--reporte.tsx',
  'src/components/panels/proveedores--reporte.tsx',
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
