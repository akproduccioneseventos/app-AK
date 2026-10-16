import fs from 'fs';
import path from 'path';

const PALABRAS_PROHIBIDAS = [
  'camara', 'estacion', 'sesion', 'pagina', 'musica', 'cancion', 'decoracion',
  'iluminacion', 'organizacion', 'informacion', 'confirmacion', 'invitacion',
  'configuracion', 'coordinacion', 'comunicacion', 'instalacion', 'recuperacion',
  'ubicacion', 'conexion', 'operacion', 'seccion', 'presentacion', 'recepcion',
  'ambientacion', 'automatizacion', 'exportacion', 'contratacion', 'telefono',
  'codigo', 'numero', 'ultimo', 'unico', 'rapido', 'minimo', 'publico',
  'tactil', 'modulo', 'titulo', 'galeria', 'energia', 'tecnologia', 'salon',
  'menu', 'dia', 'dias', 'anos', 'ninos', 'cumpleanos', 'manana', 'contrasena',
  'sena', 'senal', 'tambien', 'aqui', 'aca', 'ahi', 'despues', 'todavia',
  'mas', 'esta listo', 'estan', 'sera', 'veran', 'ocurrio', 'quedo', 'llego',
  'cargo', 'guardo', 'envio', 'encontro', 'perdio', 'aprobo', 'actualizo',
  'armo', 'podes', 'tenes', 'volve', 'elegi', 'abri', 'Atencion', 'Belen', 'Analia'
];

const PALABRAS_QUE_SON_CLAVE = new Set([
  'galeria',
  'cumpleanos', // tipo de fiesta usado como clave (FiestaEventPreset)
  'camara',
  'musica',
  'decoracion',
  'publico',
  'atencion',
  'Organizacion',
  'XV anos',
  'bogue',
]);

function listarArchivosDelProyecto(baseDir: string = process.cwd()): string[] {
  const carpetas = ['src/app', 'src/components', 'src/lib', 'src/data'];
  const encontrados: string[] = [];

  function recorrer(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(baseDir, full).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'node_modules' || entry.name === '.next' || rel.startsWith('src/data/fiestas')) continue;
        recorrer(full);
      } else if (entry.isFile()) {
        if (rel === 'src/data/testimonials.json' || rel.startsWith('src/data/social-history-recovered') || rel === 'src/lib/presentacion/fotos-por-tipo.ts' || rel === 'src/lib/multiagent/mapa-app.generado.ts' || rel === 'src/lib/parse-budget-text.ts' || rel === 'src/lib/multiagent/memory-store.ts' || rel === 'src/lib/entretenimiento/animaciones-con-locucion.ts' || entry.name.includes('.test.') || entry.name.includes('.spec.')) continue;
        if (/\.(ts|tsx|json)$/i.test(entry.name)) encontrados.push(rel);
      }
    }
  }

  carpetas.forEach(c => recorrer(path.join(baseDir, c)));
  return encontrados;
}

const archivosDelProyecto = listarArchivosDelProyecto();

const archivosRevisados = [
  'src/data/blog-posts.ts',
  'src/data/galeria-publica.json',
  'src/lib/salon-helper.ts',
  'src/lib/youtube/ak-channel.ts',
  'src/lib/zona-digital-adolescentes.ts',
  'src/app/evento/fotocabina/[fiestaId]/page.tsx',
  'src/app/evento/touchpix/[fiestaId]/page.tsx',
  'src/app/evento/espejo-magico/[fiestaId]/page.tsx',
  'src/app/evento/plataforma-360/[fiestaId]/page.tsx',
  'src/app/evento/bogue/[fiestaId]/page.tsx',
  'src/app/evento/barra/[fiestaId]/page.tsx',
  'src/app/evento/buzon/[fiestaId]/page.tsx',
  'src/app/evento/dj/[fiestaId]/page.tsx',
  'src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx',
  'src/app/(app)/settings/account/page.tsx',
  'src/app/(app)/fiestas/nueva/portal-cliente/cierre-final/page.tsx',
  'src/app/(app)/fiestas/nueva/social-fiesta-pro/cierre-final/page.tsx',
  'src/app/(app)/fiestas/nueva/social-fiesta-pro/page.tsx',
  'src/components/presupuestos/BudgetPrintTemplate.tsx',
  'src/components/payments/mercadopago-result-client.tsx',
  'src/components/pwa-install-button.tsx',
  'src/components/public-footer.tsx',
  'src/components/landing/ServicesSection.tsx',
  'src/components/landing/StatsSection.tsx',
  'src/components/landing/HeroSection.tsx',
  'src/components/app-shell.tsx',
  'src/app/portal-cliente/[id]/muro-social/page.tsx',
  'src/app/evento/mi-mesa/[fiestaId]/page.tsx',
  'src/app/evento/galeria/[fiestaId]/page.tsx',
  'src/app/portal/page.tsx',
  'src/lib/seo/paginas-publicas.ts',
  'src/app/simulador-ak/page.tsx',
  'src/lib/invitacion-config-defaults.ts',
  'src/components/invitacion/templates/AllegriaTemplate.tsx',
  'src/components/invitacion/templates/GraziaTemplate.tsx',
  'src/components/public/AsistenteVirtual.tsx',
  'src/app/evento/[id]/video-recuerdo/video-recuerdo-client.tsx',
];

function esIdentificadorTecnico(str: string, line: string): boolean {
  const val = str.trim();
  if (!val) return true;

  // Expresiones de código interpoladas en JSX o templates (ej. {menu.name}, {status.llego ?})
  if (val.startsWith('{') || val.endsWith('}') || val.includes('${') || /(=>|===|!==|&&|\|\||\?\.|\btypeof\b|[<>{}=])/.test(val)) {
    return true;
  }
  if (/^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+/.test(val)) {
    return true;
  }

  // Slugs o IDs técnicos con guiones o guiones bajos (sin espacios): ej. "como-elegir-el-menu", "boton-reintentar-camara", "15_anos"
  if ((val.includes('-') || val.includes('_')) && !val.includes(' ')) {
    return true;
  }

  // Constantes o enums en mayúsculas: ej. "MENU", "HOME"
  if (/^[A-Z0-9_]+$/.test(val)) {
    return true;
  }

  // Rutas, URLs, imports o nombres de archivos
  if (val.startsWith('/') || val.startsWith('./') || val.startsWith('../') || val.startsWith('@/') || val.includes('/') || val.includes('\\')) {
    return true;
  }
  if (/\.(png|jpg|jpeg|svg|webp|mp4|json|ts|tsx|css|js|ico|mjs|zip|pdf)$/i.test(val)) {
    return true;
  }
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('mailto:') || val.startsWith('tel:') || val.includes('@')) {
    return true;
  }

  // Clave antes de dos puntos o tras action/section
  const keyMatch = new RegExp(`["'\`]?${val.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}["'\`]?\\s*:`);
  if (keyMatch.test(line)) {
    return true;
  }

  // Atributos de código HTML/JSX o propiedades técnicas en arrays
  const idMatch = new RegExp(`\\b(id|name|key|value|action|section|tab|sourceModule|moduleId|category|htmlFor|aria-controls|type|className|variant|href|ref|role|as|icon|target)\\s*[:=]\\s*["'\`]${val.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}["'\`]`);
  if (idMatch.test(line)) {
    return true;
  }

  // Claves pasadas a métodos comunes de colección o formulario: append('key', ...), get('key'), etc.
  const methodMatch = new RegExp(`\\b(append|get|set|has|delete|getItem|setItem|removeItem)\\s*\\(\\s*["'\`]${val.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}["'\`]`);
  if (methodMatch.test(line)) {
    return true;
  }

  // Comparaciones lógicas en código (ej. x.dias >= 0)
  if (/\b(===|!==|>=|<=)\b/.test(line)) {
    return true;
  }

  // Variables de plantillas o marcadores (ej. {{SALON}})
  if (val.includes('{{') || val.includes('}}')) {
    return true;
  }

  // Claves técnicas sueltas sin espacios
  if (!val.includes(' ') && (PALABRAS_QUE_SON_CLAVE.has(val) || val === 'organizacion' || val === 'menu' || val === 'ambientacion' || val === 'salon' || val === 'titulo' || val === 'modulo' || val === 'tecnologia' || val === 'codigo' || val === 'numero' || val === 'telefono' || val === 'conexion' || val === 'cancion' || val === 'automatizacion' || val === 'presentacion' || val === 'configuracion' || val === 'invitacion' || val === 'coordinacion' || val === 'despues' || val === 'dia' || val === 'dias' || val === 'anos' || val === 'sena' || val === 'pagina' || val === 'cargo' || val === 'ninos')) {
    return true;
  }

  return false;
}

describe('Ortografía de la app con tildes y eñes (Orden 176)', () => {
  it('los archivos de la app tienen las palabras corregidas', () => {
    const fallas: Array<{ file: string; line: number; palabra: string; texto: string }> = [];

    const regexes = PALABRAS_PROHIBIDAS.map(palabra => {
      const escaped = palabra.replace(/\s+/g, '\\s+');
      return {
        palabra,
        re: new RegExp(`(?<![a-záéíóúüñA-ZÁÉÍÓÚÜÑ])${escaped}(?![a-záéíóúüñA-ZÁÉÍÓÚÜÑ])`, 'i')
      };
    });

    for (const relFile of archivosRevisados) {
      const fullPath = path.join(process.cwd(), relFile);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (line.includes('//')) line = line.substring(0, line.indexOf('//'));
        line = line.replace(/\{\/\*.*?\*\/\}/g, '');
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('import ') || trimmed.startsWith('export * from')) continue;

        const stringMatches: string[] = [];

        // Para galeria-publica.json solo miramos "titulo" y "descripcion"
        if (relFile.endsWith('galeria-publica.json')) {
          const jsonMatch = /"(titulo|descripcion)":\s*"([^"]+)"/.exec(line);
          if (jsonMatch) {
            stringMatches.push(jsonMatch[2]);
          }
        } else {
          // Strings entre comillas
          const strRegex = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
          let match: RegExpExecArray | null;
          while ((match = strRegex.exec(line)) !== null) {
            let strVal = match[2].replace(/\$\{[^}]*\}/g, ' ');
            stringMatches.push(strVal);
          }

          // JSX text
          const jsxRegex = />([^<]+)</g;
          while ((match = jsxRegex.exec(line)) !== null) {
            let val = match[1].replace(/\{[^}]*\}/g, ' ').trim();
            if (val) stringMatches.push(val);
          }
        }

        for (const str of stringMatches) {
          if (esIdentificadorTecnico(str, line)) continue;

          for (const { palabra, re } of regexes) {
            if (re.test(str)) {
              if (palabra === 'esta listo' && !/(?<![a-záéíóúüñA-ZÁÉÍÓÚÜÑ])est[aá] listo(?![a-záéíóúüñA-ZÁÉÍÓÚÜÑ])/i.test(str)) {
                continue;
              }
              // Caso especial: "esta" sin tilde es correcto cuando es demostrativo
              if (palabra === 'esta' && /(esta fiesta|esta estación|esta pantalla|esta vez|esta lista)/i.test(str)) {
                continue;
              }
              if (palabra === 'cargo' && /sin cargo/i.test(str)) {
                continue;
              }

              fallas.push({
                file: relFile,
                line: i + 1,
                palabra,
                texto: str.slice(0, 80)
              });
              break;
            }
          }
        }
      }
    }

    if (fallas.length > 0) {
      console.warn(`Fallas encontradas (${fallas.length}):\n` + fallas.map(f => `${f.file}:${f.line} [${f.palabra}] -> "${f.texto}"`).join('\n'));
    }

    expect(fallas).toHaveLength(0);
  });

  // Las pantallas que se corrigieron en la orden 176 quedan dentro del control, por su ruta.
  it.each([
    ['/settings/account', 'src/app/(app)/settings/account/page.tsx'],
    ['/fiestas/nueva/portal-cliente/cierre-final', 'src/app/(app)/fiestas/nueva/portal-cliente/cierre-final/page.tsx'],
    ['/fiestas/nueva/social-fiesta-pro/cierre-final', 'src/app/(app)/fiestas/nueva/social-fiesta-pro/cierre-final/page.tsx'],
    ['/fiestas/nueva/social-fiesta-pro', 'src/app/(app)/fiestas/nueva/social-fiesta-pro/page.tsx'],
    ['zona-digital-adolescentes', 'src/lib/zona-digital-adolescentes.ts'],
  ])('la pantalla %s está dentro del control de tildes', (_ruta, archivo) => {
    expect(archivosRevisados).toContain(archivo);
  });
});
