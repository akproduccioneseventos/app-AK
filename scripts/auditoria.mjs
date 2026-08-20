import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const OUT_DIR = path.join(ROOT_DIR, 'auditoria-out');
const OUT_FILE = path.join(OUT_DIR, 'informe.md');

function asegurarDirectorio(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function leerArchivoSeguro(ruta) {
  try {
    return fs.readFileSync(ruta, 'utf8');
  } catch {
    return '';
  }
}

function listarArchivosRecursivos(dir, filtroExt = ['.ts', '.tsx', '.js', '.jsx', '.json']) {
  const resultados = [];
  if (!fs.existsSync(dir)) return resultados;

  const entradas = fs.readdirSync(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const rutaCompleta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === 'node_modules' || entrada.name === '.next' || entrada.name === '.git' || entrada.name === 'auditoria-out') {
        continue;
      }
      resultados.push(...listarArchivosRecursivos(rutaCompleta, filtroExt));
    } else if (entrada.isFile()) {
      const ext = path.extname(entrada.name);
      if (filtroExt.includes(ext)) {
        resultados.push(rutaCompleta);
      }
    }
  }
  return resultados;
}

// -------------------------------------------------------------
// PASADA 1: ¿Dejó rastro? (Tareas automáticas)
// -------------------------------------------------------------
function correrPasada1() {
  const hallazgos = [];
  const cronDir = path.join(ROOT_DIR, 'src', 'app', 'api', 'cron');
  const tareasDefPath = path.join(ROOT_DIR, 'src', 'lib', 'automatico', 'tareas-automaticas.ts');
  const tareasJsonPath = path.join(ROOT_DIR, 'data', 'tareas-automaticas.json');

  const tareasDefSource = leerArchivoSeguro(tareasDefPath);
  const marcasGuardadas = (() => {
    try {
      const raw = leerArchivoSeguro(tareasJsonPath);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();

  const cronFolders = fs.existsSync(cronDir)
    ? fs.readdirSync(cronDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
    : [];

  for (const folder of cronFolders) {
    const routeFile = path.join(cronDir, folder, 'route.ts');
    const source = leerArchivoSeguro(routeFile);
    const relFile = path.relative(ROOT_DIR, routeFile).replace(/\\/g, '/');

    // 1. ¿Está declarada en tareas-automaticas.ts?
    if (!tareasDefSource.includes(`'${folder}'`) && !tareasDefSource.includes(`"${folder}"`)) {
      hallazgos.push({
        archivo: relFile,
        linea: 1,
        detalle: `Tarea cron "${folder}" presente en src/app/api/cron/ pero NO declarada en tareas-automaticas.ts.`,
      });
    }

    // 2. ¿Deja constancia con marcarCorrida?
    if (source && !source.includes('marcarCorrida')) {
      hallazgos.push({
        archivo: relFile,
        linea: 1,
        detalle: `La ruta cron "${folder}" no llama a marcarCorrida() para dejar constancia al terminar bien.`,
      });
    }

    // 3. ¿Cuándo corrió por última vez?
    const ultima = marcasGuardadas[folder];
    if (!ultima) {
      hallazgos.push({
        archivo: relFile,
        linea: 1,
        detalle: `Tarea cron "${folder}": figura como "NUNCA CORRIÓ" (sin marca registrada en el servidor).`,
      });
    }
  }

  return {
    titulo: 'Pasada 1: ¿Dejó rastro? (Tareas automáticas)',
    total: hallazgos.length,
    hallazgos,
  };
}

// -------------------------------------------------------------
// PASADA 2: ¿Alguien lo llama? (Huérfanos)
// -------------------------------------------------------------
function correrPasada2() {
  const hallazgos = [];
  const todosLosArchivos = listarArchivosRecursivos(path.join(ROOT_DIR, 'src'));

  const fuentes = todosLosArchivos.map(p => ({
    ruta: p,
    relativa: path.relative(ROOT_DIR, p).replace(/\\/g, '/'),
    esTest: p.includes('__tests__') || p.includes('.test.') || p.includes('.spec.'),
    contenido: leerArchivoSeguro(p),
  }));

  // 1. Componentes huérfanos (sin src/components/ui/)
  const componentes = todosLosArchivos.filter(p => {
    const rel = path.relative(ROOT_DIR, p).replace(/\\/g, '/');
    return rel.startsWith('src/components/') &&
           !rel.startsWith('src/components/ui/') &&
           (rel.endsWith('.tsx') || rel.endsWith('.jsx'));
  });

  for (const compPath of componentes) {
    const baseName = path.basename(compPath, path.extname(compPath));
    const relPath = path.relative(ROOT_DIR, compPath).replace(/\\/g, '/');

    let usosProd = 0;
    let usosTest = 0;

    for (const f of fuentes) {
      if (f.relativa === relPath) continue;
      if (f.contenido.includes(baseName) || f.contenido.includes(relPath.replace(/\.tsx?$/, ''))) {
        if (f.esTest) usosTest++;
        else usosProd++;
      }
    }

    if (usosProd === 0) {
      hallazgos.push({
        archivo: relPath,
        linea: 1,
        detalle: usosTest > 0
          ? `Componente "${baseName}" solo aparece en tests (${usosTest} referencias en tests), no se usa en producción.`
          : `Componente "${baseName}" huérfano (0 referencias de importación en todo el código).`,
      });
    }
  }

  // 2. Acciones de servidor huérfanas
  const actionsFiles = todosLosArchivos.filter(p => {
    const rel = path.relative(ROOT_DIR, p).replace(/\\/g, '/');
    return rel.startsWith('src/app/actions/') && (rel.endsWith('.ts') || rel.endsWith('.tsx'));
  });

  for (const actPath of actionsFiles) {
    const relPath = path.relative(ROOT_DIR, actPath).replace(/\\/g, '/');
    const content = leerArchivoSeguro(actPath);
    const lineas = content.split('\n');

    for (let i = 0; i < lineas.length; i++) {
      const match = lineas[i].match(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
      if (match) {
        const fnName = match[1];
        let usosProd = 0;
        let usosTest = 0;

        for (const f of fuentes) {
          if (f.relativa === relPath) continue;
          if (f.contenido.includes(fnName)) {
            if (f.esTest) usosTest++;
            else usosProd++;
          }
        }

        if (usosProd === 0) {
          hallazgos.push({
            archivo: relPath,
            linea: i + 1,
            detalle: usosTest > 0
              ? `Acción "${fnName}" solo se llama en tests (${usosTest} referencias en tests), no tiene uso en pantallas.`
              : `Acción "${fnName}" huérfana (0 imports o llamadas en todo el código).`,
          });
        }
      }
    }
  }

  // 3. Pantallas page.tsx huérfanas
  const pages = todosLosArchivos.filter(p => {
    const rel = path.relative(ROOT_DIR, p).replace(/\\/g, '/');
    return rel.startsWith('src/app/') && rel.endsWith('/page.tsx');
  });

  for (const pagePath of pages) {
    const relPath = path.relative(ROOT_DIR, pagePath).replace(/\\/g, '/');
    // Normalizar ruta URL: src/app/(app)/settings/page.tsx -> /settings
    let urlRoute = relPath
      .replace(/^src\/app/, '')
      .replace(/\/\([^)]+\)/g, '')
      .replace(/\/page\.tsx$/, '') || '/';

    // Omitir portada y rutas de error/auth estándar
    if (urlRoute === '/' || urlRoute === '/login' || urlRoute === '/signup' || urlRoute === '/unauthorized') continue;

    // Buscar fragmentos clave de la ruta
    const baseSegment = urlRoute.split('/')[1] || urlRoute;
    const cleanRoute = urlRoute.replace(/\[[^\]]+\]/g, '');

    let enlacesProd = 0;
    let enlacesTest = 0;

    for (const f of fuentes) {
      if (f.relativa === relPath) continue;
      if (f.contenido.includes(`'${urlRoute}'`) ||
          f.contenido.includes(`"${urlRoute}"`) ||
          f.contenido.includes(`\`${cleanRoute}`) ||
          f.contenido.includes(`href="${urlRoute}"`) ||
          f.contenido.includes(`href='${urlRoute}'`) ||
          (cleanRoute.length > 3 && f.contenido.includes(cleanRoute))) {
        if (f.esTest) enlacesTest++;
        else enlacesProd++;
      }
    }

    if (enlacesProd === 0 && !baseSegment.startsWith('api')) {
      hallazgos.push({
        archivo: relPath,
        linea: 1,
        detalle: enlacesTest > 0
          ? `Pantalla "${urlRoute}" solo tiene enlaces en tests (${enlacesTest} tests), no está enlazada en el menú.`
          : `Pantalla "${urlRoute}" huérfana (no existe ningún enlace o botón que lleve a ella).`,
      });
    }
  }

  return {
    titulo: 'Pasada 2: ¿Alguien lo llama? (Elementos huérfanos o solo en tests)',
    total: hallazgos.length,
    hallazgos,
  };
}

// -------------------------------------------------------------
// PASADA 3: ¿Muestra datos inventados? (Datos simulados sin aviso)
// -------------------------------------------------------------
function correrPasada3() {
  const hallazgos = [];
  const uiArchivos = listarArchivosRecursivos(path.join(ROOT_DIR, 'src', 'app')).concat(
    listarArchivosRecursivos(path.join(ROOT_DIR, 'src', 'components'))
  ).filter(p => !p.includes('__tests__') && !p.includes('.test.') && !p.includes('.spec.'));

  const palabrasSimulacion = [
    /\bmock[A-Z0-9_]+/i,
    /\bdummy[A-Z0-9_]+/i,
    /\bplaceholderData\b/i,
    /\bdatosSimulados\b/i,
    /\bvaloresFalsos\b/i,
  ];

  for (const arch of uiArchivos) {
    const relPath = path.relative(ROOT_DIR, arch).replace(/\\/g, '/');
    const content = leerArchivoSeguro(arch);
    const lineas = content.split('\n');

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];

      // Ignorar atributos HTML placeholder="..." o comentarios que explican
      if (linea.includes('placeholder=') || linea.includes('//') || linea.includes('*')) continue;

      for (const regex of palabrasSimulacion) {
        if (regex.test(linea)) {
          hallazgos.push({
            archivo: relPath,
            linea: i + 1,
            detalle: `Posible dato simulado sin advertencia en UI: "${linea.trim().substring(0, 80)}"`,
          });
          break;
        }
      }
    }
  }

  return {
    titulo: 'Pasada 3: ¿Muestra datos inventados? (Simulaciones y fallbacks engañosos)',
    total: hallazgos.length,
    hallazgos,
  };
}

// -------------------------------------------------------------
// PASADA 4: ¿Se cumple lo que promete la pantalla? (Promesas automáticas)
// -------------------------------------------------------------
function correrPasada4() {
  const hallazgos = [];
  const uiArchivos = listarArchivosRecursivos(path.join(ROOT_DIR, 'src', 'app')).concat(
    listarArchivosRecursivos(path.join(ROOT_DIR, 'src', 'components'))
  ).filter(p => !p.includes('__tests__') && !p.includes('.test.') && !p.includes('.spec.'));

  const frasesPrometedoras = [
    { frase: /se env[ií]a solo/i, nombre: 'se envía solo' },
    { frase: /autom[aá]ticamente/i, nombre: 'automáticamente' },
    { frase: /todos los d[ií]as/i, nombre: 'todos los días' },
    { frase: /en tiempo real/i, nombre: 'en tiempo real' },
    { frase: /al instante/i, nombre: 'al instante' },
    { frase: /te avisamos/i, nombre: 'te avisamos' },
    { frase: /se sincroniza/i, nombre: 'se sincroniza' },
  ];

  for (const arch of uiArchivos) {
    const relPath = path.relative(ROOT_DIR, arch).replace(/\\/g, '/');
    const content = leerArchivoSeguro(arch);
    const lineas = content.split('\n');

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];
      if (linea.includes('//') || linea.includes('*') || linea.includes('console.')) continue;

      for (const { frase, nombre } of frasesPrometedoras) {
        if (frase.test(linea)) {
          hallazgos.push({
            archivo: relPath,
            linea: i + 1,
            detalle: `Promesa en pantalla ("${nombre}"): "${linea.trim().substring(0, 90)}"`,
          });
          break;
        }
      }
    }
  }

  return {
    titulo: 'Pasada 4: ¿Se cumple lo que promete la pantalla? (Promesas visibles al usuario)',
    total: hallazgos.length,
    hallazgos,
  };
}

// -------------------------------------------------------------
// EJECUCIÓN PRINCIPAL Y REPORTE
// -------------------------------------------------------------
export function ejecutarAuditoria() {
  asegurarDirectorio(OUT_DIR);

  const fechaIso = new Date().toISOString();
  const fechaHumana = new Intl.DateTimeFormat('es-UY', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'America/Montevideo',
  }).format(new Date());

  const p1 = correrPasada1();
  const p2 = correrPasada2();
  const p3 = correrPasada3();
  const p4 = correrPasada4();

  const lineasMd = [];
  lineasMd.push('# Informe de Auditoría Mecánica Continua');
  lineasMd.push('');
  lineasMd.push(`**Fecha de ejecución:** ${fechaHumana} (${fechaIso})`);
  lineasMd.push('**Método:** Conteo mecánico exacto sobre archivos de código (sin IA, cero opiniones).');
  lineasMd.push('');
  lineasMd.push('---');
  lineasMd.push('');
  lineasMd.push('## Resumen de Resultados (4 Números)');
  lineasMd.push('');
  lineasMd.push(`- **1. Tareas automáticas sin rastro:** ${p1.total} hallazgos`);
  lineasMd.push(`- **2. Elementos huérfanos o solo en tests:** ${p2.total} hallazgos`);
  lineasMd.push(`- **3. Datos simulados o inventados en UI:** ${p3.total} hallazgos`);
  lineasMd.push(`- **4. Promesas automáticas en pantalla:** ${p4.total} frases a contrastar`);
  lineasMd.push('');
  lineasMd.push('---');
  lineasMd.push('');

  const pasadas = [p1, p2, p3, p4];
  for (let idx = 0; idx < pasadas.length; idx++) {
    const p = pasadas[idx];
    lineasMd.push(`### ${p.titulo} (${p.total})`);
    lineasMd.push('');
    if (p.hallazgos.length === 0) {
      lineasMd.push('_Cero hallazgos. Todo en orden en esta pasada._');
      lineasMd.push('');
    } else {
      lineasMd.push('| Archivo | Línea | Detalle del hallazgo |');
      lineasMd.push('| :--- | :--- | :--- |');
      for (const h of p.hallazgos) {
        lineasMd.push(`| \`${h.archivo}\` | ${h.linea} | ${h.detalle.replace(/\|/g, '\\|')} |`);
      }
      lineasMd.push('');
    }
  }

  const contenidoFinal = lineasMd.join('\n');
  fs.writeFileSync(OUT_FILE, contenidoFinal, 'utf8');

  console.log(`\n======================================================`);
  console.log(`  AUDITORÍA MECÁNICA COMPLETADA`);
  console.log(`======================================================`);
  console.log(`  Informe escrito en: auditoria-out/informe.md`);
  console.log(`  - Pasada 1 (Tareas sin rastro): ${p1.total}`);
  console.log(`  - Pasada 2 (Huérfanos / solo tests): ${p2.total}`);
  console.log(`  - Pasada 3 (Datos simulados en UI): ${p3.total}`);
  console.log(`  - Pasada 4 (Promesas en pantalla): ${p4.total}`);
  console.log(`======================================================\n`);

  return {
    informePath: OUT_FILE,
    pasada1: p1.total,
    pasada2: p2.total,
    pasada3: p3.total,
    pasada4: p4.total,
  };
}

if (process.argv[1] && process.argv[1].endsWith('auditoria.mjs')) {
  ejecutarAuditoria();
}
