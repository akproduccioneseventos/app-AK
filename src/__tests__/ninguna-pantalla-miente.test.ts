import fs from 'fs';
import path from 'path';

/**
 * CONTROL AUTOMÁTICO — Ninguna pantalla miente sobre su estado.
 *
 * La regla de oro del proyecto: si la app le muestra al usuario una palabra de estado
 * confirmatorio ("Conectado", "Sincronizado", "Publicado", "Enviado", "Guardado", "Activo"),
 * tiene que ser a partir de un dato real que vino del servidor o de una condición dinámica,
 * nunca de un texto fijo escrito a mano que le prometa algo que la máquina no comprobó.
 *
 * Casos legítimos (ej: encabezados explicativos, botones de acción, guías o estados declarados)
 * van anotados abajo con su motivo exacto.
 */

const PALABRAS_CLAVE = [
  'conectado',
  'sincronizado',
  'publicado',
  'enviado',
  'guardado',
  'activo',
];

/**
 * Casos legítimos declarados con su motivo exacto.
 */
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

      // No debe haber un cartel estático de "Instagram conectado" que no dependa de variables o condiciones
      const tieneCartelFijoMentiroso =
        /<Badge[^>]*>[^<]*Instagram Conectado[^<]*<\/Badge>/i.test(contenido) &&
        !/isConnected|testStatus|pageAccessToken/i.test(contenido);

      expect(tieneCartelFijoMentiroso).toBe(false);
    }
  });

  it('la pantalla de asistente en admin no muestra cartel falso de mantenimiento', () => {
    const asistenteAdminPath = path.join(process.cwd(), 'src/app/admin/asistente-ak/page.tsx');
    if (fs.existsSync(asistenteAdminPath)) {
      const contenido = fs.readFileSync(asistenteAdminPath, 'utf8');
      expect(contenido).toContain("redirect('/multiagente')");
      expect(contenido).not.toContain('<CardTitle>En Mantenimiento</CardTitle>');
      expect(contenido).not.toContain('desactivado para resolver conflictos');
    }
  });

  it('las pantallas de fiestas no incluyen tableros internos de programador desactualizados', () => {
    const post445Path = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/integracion-post-445/page.tsx');
    const cierre100Path = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/cierre-100/page.tsx');

    expect(fs.existsSync(post445Path)).toBe(false);
    expect(fs.existsSync(cierre100Path)).toBe(false);
  });
});
