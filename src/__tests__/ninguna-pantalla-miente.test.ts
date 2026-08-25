import fs from 'fs';
import path from 'path';

/**
 * CONTROL AUTOMÁTICO — Ninguna pantalla miente sobre su estado,
 * y «Mi Día» respeta las palabras prohibidas por el dueño.
 */

const PALABRAS_PROHIBIDAS_MI_DIA = [
  'riesgo',
  'urgente',
  'crítico',
  'critico',
  'vencido',
  'alerta',
  'atrasado',
  'pendiente',
];

const CASOS_EXCEPCION_DECLARADOS: Record<string, string> = {
  'src/components/ui/animated-counter.tsx': 'animación visual de números en pantalla',
  'src/components/public/LocalBusinessSchema.tsx': 'metadatos estáticos para Google Schema',
  'src/components/seo/LocalBusinessJsonLd.tsx': 'metadatos estructurados para SEO',
  'src/data/social-connections.json': 'archivo de configuración y datos iniciales de redes',
};

function buscarArchivosUI(dir: string): string[] {
  let resultados: string[] = [];
  if (!fs.existsSync(dir)) return resultados;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      resultados = resultados.concat(buscarArchivosUI(fullPath));
    } else if (item.isFile() && (item.name.endsWith('.tsx') || item.name.endsWith('.ts'))) {
      resultados.push(fullPath);
    }
  }
  return resultados;
}

describe('Control de Honestidad: Ninguna pantalla miente sobre su estado', () => {
  const archivos = [
    ...buscarArchivosUI(path.join(process.cwd(), 'src/app/(app)/settings/social-connections')),
    ...buscarArchivosUI(path.join(process.cwd(), 'src/app/(app)/empresa/redes-sociales')),
    ...buscarArchivosUI(path.join(process.cwd(), 'src/app/(app)/contabilidad/crm/marketing-ads')),
  ];

  it('las pantallas de conexiones sociales y redes no afirman conexión sin verificar credenciales', () => {
    for (const archivo of archivos) {
      const relativo = path.relative(process.cwd(), archivo).replace(/\\/g, '/');
      if (CASOS_EXCEPCION_DECLARADOS[relativo]) continue;

      const contenido = fs.readFileSync(archivo, 'utf8');

      const tieneCartelFijoMentiroso =
        /<Badge[^>]*>[^<]*Instagram Conectado[^<]*<\/Badge>/i.test(contenido) &&
        !/isConnected|testStatus|pageAccessToken/i.test(contenido);

      expect(tieneCartelFijoMentiroso).toBe(false);
    }
  });

  it('la pantalla Mi Día no incluye palabras de estrés prohibidas en sus textos visibles', () => {
    const miDiaPath = path.join(process.cwd(), 'src/app/(app)/mi-dia/page.tsx');
    expect(fs.existsSync(miDiaPath)).toBe(true);

    const contenido = fs.readFileSync(miDiaPath, 'utf8');

    // Remover comentarios e imports antes de revisar textos visibles
    const sinComentarios = contenido
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');

    for (const palabra of PALABRAS_PROHIBIDAS_MI_DIA) {
      const regex = new RegExp(`['"\`][^'"\`]*\\b${palabra}\\b[^'"\`]*['"\`]`, 'i');
      const match = regex.exec(sinComentarios);
      expect(match).toBeNull();
    }
  });

  it('las pantallas de fiestas no incluyen tableros internos de programador desactualizados', () => {
    const post445Path = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/integracion-post-445/page.tsx');
    const cierre100Path = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/cierre-100/page.tsx');

    expect(fs.existsSync(post445Path)).toBe(false);
    expect(fs.existsSync(cierre100Path)).toBe(false);
  });
});
