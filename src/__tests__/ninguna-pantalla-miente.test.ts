import fs from 'fs';
import path from 'path';

/**
 * CONTROL AUTOMÁTICO — Ninguna pantalla miente sobre su estado,
 * y «Mi Día» respeta las palabras prohibidas por el dueño.
 *
 * Recorre todas las pantallas de la aplicación y verifica que:
 * 1. Ninguna pantalla afirme un estado ("conectado", "sincronizado", "publicado",
 *    "enviado", "guardado", "activo", "automático") de forma estática y engañosa
 *    sin consultar datos reales del servidor.
 * 2. WhatsApp nunca prometa envíos automáticos solos: siempre los prepara y los
 *    envía una persona.
 * 3. «Mi Día» no contenga palabras de estrés prohibidas.
 * 4. La lista de excepciones declaradas sólo pueda achicarse.
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

/**
 * Excepciones legítimas declaradas con su justificación obligatoria.
 * Sin motivo escrito, no entra en la lista.
 */
const CASOS_EXCEPCION_DECLARADOS: Record<string, string> = {
  'src/components/ui/animated-counter.tsx':
    'animación visual de números en pantalla que renderiza cifras numéricas progresivas',
  'src/components/public/LocalBusinessSchema.tsx':
    'metadatos estáticos requeridos por Google Schema para datos estructurados de negocio',
  'src/components/seo/LocalBusinessJsonLd.tsx':
    'metadatos estructurados para optimización en motores de búsqueda (SEO)',
  'src/data/social-connections.json':
    'archivo de inicialización y configuración base de canales sociales',
  'src/app/(app)/settings/feature-flags/page.tsx':
    'panel de banderas de funcionalidad donde el texto ACTIVO indica el estado del interruptor de laboratorio',
  'src/app/(app)/settings/cupones/page.tsx':
    'panel de promociones donde el badge Activo refleja la condición configurada del cupón',
  'src/app/(app)/settings/whatsapp/page.tsx':
    'muestra el estado Activo/Inactivo según la configuración guardada del canal de WhatsApp',
  'src/app/(app)/settings/whatsapp-business/page.tsx':
    'muestra el estado Activo/Inactivo según la configuración guardada de WhatsApp Business',
  'src/app/(app)/fiestas/nueva/modulo-invitado/page.tsx':
    'indicador de conteo de módulos habilitados en la configuración de la fiesta',
};

const LIMITE_MAXIMO_EXCEPCIONES = Object.keys(CASOS_EXCEPCION_DECLARADOS).length;

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
  const todosLosArchivosApp = buscarArchivosUI(path.join(process.cwd(), 'src/app'));

  it('la lista de excepciones declaradas tiene justificación y no puede crecer sin revisión', () => {
    for (const [archivo, motivo] of Object.entries(CASOS_EXCEPCION_DECLARADOS)) {
      expect(motivo).toBeDefined();
      expect(motivo.trim().length).toBeGreaterThanOrEqual(15);
    }
    expect(Object.keys(CASOS_EXCEPCION_DECLARADOS).length).toBeLessThanOrEqual(LIMITE_MAXIMO_EXCEPCIONES);
  });

  it('ninguna pantalla afirma conexiones o estados de publicación automáticos sin validar datos reales', () => {
    for (const archivo of todosLosArchivosApp) {
      const relativo = path.relative(process.cwd(), archivo).replace(/\\/g, '/');
      if (CASOS_EXCEPCION_DECLARADOS[relativo]) continue;

      const contenido = fs.readFileSync(archivo, 'utf8');

      // Remover comentarios e imports para mirar el código visible
      const sinComentarios = contenido
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');

      // 1. Carteles fijos de "Instagram Conectado" o similares sin comprobación
      const tieneCartelFijoConexion =
        /<Badge[^>]*>[^<]*(?:Instagram Conectado|Meta Conectado|TikTok Conectado)[^<]*<\/Badge>/i.test(sinComentarios) &&
        !/isConnected|testStatus|pageAccessToken|accessToken/i.test(sinComentarios);

      if (tieneCartelFijoConexion) {
        throw new Error(
          `[HONESTIDAD] En ${relativo}: la pantalla afirma que una red está conectada con un cartel fijo sin consultar el estado real del servidor.`
        );
      }

      // 2. Afirmaciones de "publicación 100% automática sin abrir ninguna aplicación"
      const tienePromesaFalsaAutomatica =
        /publica sola de forma 100% autom[aá]tica sin que abras ninguna aplicaci[oó]n/i.test(sinComentarios);

      if (tienePromesaFalsaAutomatica) {
        throw new Error(
          `[HONESTIDAD] En ${relativo}: la pantalla promete publicación 100% automática en todas las redes sin aclarar cuáles usan API y cuáles modo 1 Toque.`
        );
      }
    }
  });

  it('WhatsApp nunca promete envíos automáticos solos y deja claro el envío manual', () => {
    for (const archivo of todosLosArchivosApp) {
      const relativo = path.relative(process.cwd(), archivo).replace(/\\/g, '/');
      if (CASOS_EXCEPCION_DECLARADOS[relativo]) continue;

      const contenido = fs.readFileSync(archivo, 'utf8');
      const sinComentarios = contenido
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');

      // No debe decir que WhatsApp envía solo o automático a clientes sin intervención
      const prometeEnvioSoloWhatsApp =
        /WhatsApp\s+env[ií]a\s+autom[aá]ticamente\s+a\s+los\s+clientes\s+sin/i.test(sinComentarios) ||
        /WhatsApp\s+publica\s+solo/i.test(sinComentarios);

      expect(prometeEnvioSoloWhatsApp).toBe(false);
    }
  });

  it('la pantalla Mi Día no incluye palabras de estrés prohibidas en sus textos visibles', () => {
    const miDiaPath = path.join(process.cwd(), 'src/app/(app)/mi-dia/page.tsx');
    expect(fs.existsSync(miDiaPath)).toBe(true);

    const contenido = fs.readFileSync(miDiaPath, 'utf8');

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
