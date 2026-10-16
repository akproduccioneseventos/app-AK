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
  'camara',
  'musica',
  'decoracion',
  'publico',
  'atencion',
  'Organizacion',
  'XV anos',
  'bogue',
]);

const ARCHIVOS_A_CONTROLAR = [
  'src/data/blog-posts.ts',
  'src/data/galeria-publica.json',
  'src/lib/salon-helper.ts',
  'src/lib/youtube/ak-channel.ts',
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
  'src/components/presupuestos/BudgetPrintTemplate.tsx',
  'src/components/payments/mercadopago-result-client.tsx',
  'src/components/pwa-install-button.tsx',
  'src/components/public-footer.tsx',
  'src/components/landing/ServicesSection.tsx',
  'src/components/landing/StatsSection.tsx',
];

function esIdentificadorTecnico(str: string, line: string): boolean {
  const val = str.trim();
  if (!val) return true;

  // Slugs o IDs técnicos con guiones (sin espacios): ej. "como-elegir-el-menu", "boton-reintentar-camara"
  if (val.includes('-') && !val.includes(' ')) {
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
  if (/\.(png|jpg|jpeg|svg|webp|mp4|json|ts|tsx|css|js)$/i.test(val)) {
    return true;
  }
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('mailto:') || val.startsWith('tel:')) {
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

  // Claves técnicas sueltas
  if (!val.includes(' ') && (PALABRAS_QUE_SON_CLAVE.has(val) || val === 'organizacion' || val === 'menu' || val === 'ambientacion' || val === 'salon' || val === 'titulo')) {
    return true;
  }

  return false;
}

describe('Ortografía de la app con tildes y eñes (Orden 176)', () => {
  it('los archivos prioritarios y de cara al usuario tienen las palabras corregidas', () => {
    const fallas: Array<{ file: string; line: number; palabra: string; texto: string }> = [];

    const regexes = PALABRAS_PROHIBIDAS.map(palabra => {
      const escaped = palabra.replace(/\s+/g, '\\s+');
      return {
        palabra,
        re: new RegExp(`(?<![a-záéíóúüñA-ZÁÉÍÓÚÜÑ])${escaped}(?![a-záéíóúüñA-ZÁÉÍÓÚÜÑ])`, 'i')
      };
    });

    for (const relFile of ARCHIVOS_A_CONTROLAR) {
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
            let strVal = match[2].replace(/\$\{.*?\}/g, ' ');
            stringMatches.push(strVal);
          }

          // JSX text
          const jsxRegex = />([^<]+)</g;
          while ((match = jsxRegex.exec(line)) !== null) {
            let val = match[1].replace(/\{.*?\}/g, ' ').trim();
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
});
