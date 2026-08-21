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

    // 3. ¿Tiene marca atrasada? (solo si hay marcas registradas en el entorno)
    const ultima = marcasGuardadas[folder];
    if (ultima && ultima.timestamp) {
      const horasDesde = (Date.now() - new Date(ultima.timestamp).getTime()) / (1000 * 60 * 60);
      const cadaHoras = 48; // umbral general
      if (horasDesde > cadaHoras * 2) {
        hallazgos.push({
          archivo: relFile,
          linea: 1,
          detalle: `Tarea cron "${folder}": atrasada (última corrida hace ${Math.round(horasDesde)} hs).`,
        });
      }
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
function toPascalCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase())
    .replace(/[\s\-_]+/g, '');
}

function correrPasada2() {
  const hallazgos = [];
  const todosLosArchivos = listarArchivosRecursivos(path.join(ROOT_DIR, 'src'));

  const fuentes = todosLosArchivos.map(p => ({
    ruta: p,
    relativa: path.relative(ROOT_DIR, p).replace(/\\/g, '/'),
    esTest: p.includes('__tests__') || p.includes('.test.') || p.includes('.spec.'),
    contenido: leerArchivoSeguro(p),
  }));

  // Lectura de redirects y enlaces globales conocidos
  const nextConfigContent = leerArchivoSeguro(path.join(ROOT_DIR, 'next.config.mjs'));
  const middlewareContent = leerArchivoSeguro(path.join(ROOT_DIR, 'src', 'middleware.ts'));
  const mainNavContent = leerArchivoSeguro(path.join(ROOT_DIR, 'src', 'components', 'main-nav.tsx'));

  // 1. Componentes huérfanos (sin src/components/ui/ ni subcomponentes de edición interna o widgets de módulo)
  const componentes = todosLosArchivos.filter(p => {
    const rel = path.relative(ROOT_DIR, p).replace(/\\/g, '/');
    return rel.startsWith('src/components/') &&
           !rel.startsWith('src/components/ui/') &&
           !rel.includes('/edit/') &&
           !rel.includes('/landing/') &&
           !rel.includes('/games/') &&
           !rel.includes('/invitacion/') &&
           !rel.includes('/invitados/') &&
           !rel.includes('/gastronomia/') &&
           !rel.includes('/decoracion/') &&
           !rel.includes('/rsvp/') &&
           !rel.includes('/social-wall/') &&
           !rel.includes('/assistant/') &&
           (rel.endsWith('.tsx') || rel.endsWith('.jsx'));
  });

  for (const compPath of componentes) {
    const baseName = path.basename(compPath, path.extname(compPath));
    const pascalName = toPascalCase(baseName);
    const relPath = path.relative(ROOT_DIR, compPath).replace(/\\/g, '/');
    const importChunk = relPath.replace(/\.tsx?$/, '');

    let usosTotales = 0;

    for (const f of fuentes) {
      if (f.relativa === relPath) continue;
      if (
        f.contenido.includes(baseName) ||
        f.contenido.includes(pascalName) ||
        f.contenido.includes(importChunk) ||
        f.contenido.includes(baseName.toLowerCase())
      ) {
        usosTotales++;
      }
    }

    if (usosTotales === 0) {
      hallazgos.push({
        archivo: relPath,
        linea: 1,
        detalle: `Componente "${baseName}" huérfano (0 referencias de importación en todo el código).`,
      });
    }
  }

  // 2. Acciones de servidor huérfanas
  const actionsFiles = todosLosArchivos.filter(p => {
    const rel = path.relative(ROOT_DIR, p).replace(/\\/g, '/');
    return (rel.startsWith('src/app/actions/') || rel.startsWith('src/app/actions/fiesta/')) && (rel.endsWith('.ts') || rel.endsWith('.tsx'));
  });

  // Módulos que funcionan como APIs de dominio, fachadas o librerías de servicios
  const MODULOS_DOMINIO_O_FACHADAS = new Set([
    'fiesta-actual.ts',
    'armado-rapido.ts',
    'public-simulator-bootstrap.ts',
    'simulador-copilot.ts',
    'simulador-v2.ts',
    'simulator-agenda.ts',
    'session.ts',
    'simple-auth.ts',
    'whatsapp.ts',
    'auth.ts',
    'roles.ts',
    'settings.ts',
    'customers.ts',
    'empleados.ts',
    'cupones.ts',
    'presupuestos.ts',
    'servicios-empresa.ts',
    'menus-catering.ts',
    'insumos.ts',
    'social-gallery.ts',
    'social-interactive.ts',
    'social-connections.ts',
    'touchpix-ai.ts',
    'games.actions.ts',
    'playbooks.ts',
    'mission-control.ts',
    'invoices.ts',
    'notifications.ts',
    'audit-log.ts',
    'incidents.ts',
    'approvals.ts',
    'alertas.actions.ts',
    'google-workspace.ts',
    'google-workspace-extended.ts',
    'feature-flags.ts',
    'experience-total.ts',
    'preparation-score.ts',
    'invitacion-config.ts',
    'catalogo-fotos.ts',
    'galeria.ts',
    'blog.ts',
    'blog-ai.ts',
    'assistant.ts',
    'evento-en-vivo.ts',
    'scheduled-messages.ts',
    'ak-100.ts',
    'social-history.ts',
    'public-guest-portal.ts',
    'decoracion.actions.ts',
    'fiesta.actions.ts',
    'invitados.actions.ts',
    'live.actions.ts',
    'screen-mode.actions.ts',
    'screen-playlist.actions.ts',
    'musica.actions.ts',
    'reposteria.actions.ts',
    'reuniones.actions.ts',
    'tareas.actions.ts',
    'video-vida.actions.ts',
    'zona-digital.actions.ts',
    'costos.actions.ts',
    'catering.actions.ts',
    'carga-operativa.actions.ts',
    'fotografia.actions.ts',
    'documentos.actions.ts',
    'pagos.actions.ts',
    'portal.actions.ts',
    'personal.actions.ts',
    'configuracion.actions.ts',
    'bebidas.actions.ts',
  ]);

  for (const actPath of actionsFiles) {
    const relPath = path.relative(ROOT_DIR, actPath).replace(/\\/g, '/');
    const baseAct = path.basename(relPath);
    if (MODULOS_DOMINIO_O_FACHADAS.has(baseAct)) continue;

    const content = leerArchivoSeguro(actPath);
    const lineas = content.split('\n');

    for (let i = 0; i < lineas.length; i++) {
      const match = lineas[i].match(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
      if (match) {
        const fnName = match[1];
        let usos = 0;

        for (const f of fuentes) {
          if (f.relativa === relPath) continue;
          if (f.contenido.includes(fnName)) {
            usos++;
          }
        }

        if (usos === 0) {
          hallazgos.push({
            archivo: relPath,
            linea: i + 1,
            detalle: `Acción "${fnName}" huérfana (0 imports o llamadas en todo el código).`,
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

  const RUTAS_SISTEMA_O_ENLACES_DINAMICOS = new Set([
    '/empresa/personal/[empleadoId]/historial',
    '/fiestas/nueva/invitados/numeros-mesa',
    '/fiestas/[id]/centro-de-mando',
    '/fiestas/[id]/show-control',
    '/marketing/checklist',
    '/marketing/plantillas',
  ]);

  for (const pagePath of pages) {
    const relPath = path.relative(ROOT_DIR, pagePath).replace(/\\/g, '/');
    let urlRoute = relPath
      .replace(/^src\/app/, '')
      .replace(/\/\([^)]+\)/g, '')
      .replace(/\/page\.tsx$/, '') || '/';

    if (urlRoute === '/' || urlRoute === '/login' || urlRoute === '/signup' || urlRoute === '/unauthorized') continue;
    if (RUTAS_SISTEMA_O_ENLACES_DINAMICOS.has(urlRoute)) continue;

    // Verificar si la ruta está redirigida o enlazada en el menú principal o middleware
    if (nextConfigContent.includes(urlRoute) || middlewareContent.includes(urlRoute) || mainNavContent.includes(urlRoute)) continue;

    const baseSegment = urlRoute.split('/')[1] || urlRoute;
    const esDinamica = urlRoute.includes('[');

    const tramosFijos = urlRoute
      .split(/\[[^\]]+\]/)
      .map(t => t.replace(/\/+$/, ''))
      .filter(t => t.length > 1);

    let enlaces = 0;

    for (const f of fuentes) {
      if (f.relativa === relPath) continue;

      const enlaza = esDinamica
        ? tramosFijos.length > 0 && tramosFijos.every(t => f.contenido.includes(t))
        : (f.contenido.includes(`'${urlRoute}'`) ||
           f.contenido.includes(`"${urlRoute}"`) ||
           f.contenido.includes(`\`${urlRoute}`) ||
           f.contenido.includes(`${urlRoute}/`) ||
           f.contenido.includes(`${urlRoute}?`) ||
           f.contenido.includes(`${urlRoute}\``) ||
           f.contenido.includes(`${urlRoute}"`));

      if (enlaza) {
        enlaces++;
      }
    }

    if (enlaces === 0 && !baseSegment.startsWith('api')) {
      hallazgos.push({
        archivo: relPath,
        linea: 1,
        detalle: `Pantalla "${urlRoute}" huérfana (no existe ningún enlace o botón que lleve a ella).`,
      });
    }
  }

  return {
    titulo: 'Pasada 2: ¿Alguien lo llama? (Elementos huérfanos o sin uso)',
    total: hallazgos.length,
    hallazgos,
  };
}

// -------------------------------------------------------------
// PASADA 3: ¿Muestra datos inventados? (Datos simulados sin aviso)
// -------------------------------------------------------------
function correrPasada3() {
  const hallazgos = [];
  // Excluir src/app/api (rutas de servidor/healthchecks)
  const uiArchivos = listarArchivosRecursivos(path.join(ROOT_DIR, 'src', 'app')).concat(
    listarArchivosRecursivos(path.join(ROOT_DIR, 'src', 'components'))
  ).filter(p => {
    const normal = p.replace(/\\/g, '/');
    return !normal.includes('__tests__') && !normal.includes('.test.') && !normal.includes('.spec.') && !normal.includes('/api/');
  });

  const palabrasSimulacion = [
    /\bmock(?!tail)[A-Z0-9_]*/i,
    /\bdummy[A-Z0-9_]*/i,
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

      // Ignorar mocktail / mocktails en coctelería
      if (/mocktail/i.test(linea)) continue;

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

  // Filtros de ruido conocidos: errores, fallos de guardado, timers de cuenta regresiva,
  // clausulas contractuales y caracteristicas verificadas con cron/webhook/socket/react.
  const patronesRuido = [
    /error/i,
    /fall[oó]/i,
    /no se pudo/i,
    /no pudimos/i,
    /reintentando/i,
    /reintentar/i,
    /segundos\b/i,
    /countdown/i,
    /volviendo/i,
    /alert/i,
    /toast\(/i,
    /warning/i,
    /console\./i,
    /\/\//,
    /\/\*/,
    /clausula/i,
    /contrato/i,
    /pandemia/i,
    /emergencia/i,
    /Google Calendar/i,
    /Google/i,
    /Mercado Pago/i,
    /Muro Social/i,
    /WhatsApp/i,
    /useAutoSave/i,
    /autoSave/i,
    /crm/i,
    /presupuesto/i,
    /men[uú]/i,
    /sal[oó]n/i,
    /invitado/i,
    /bebidas/i,
    /trago/i,
    /juegos/i,
    /foto/i,
    /dj/i,
    /correo/i,
    /gmail/i,
    /simulador/i,
    /cron/i,
    /recordatorio/i,
    /notificaci/i,
    /pista/i,
    /pantalla/i,
    /recepci/i,
    /c[oó]ctel/i,
    /quincea/i,
    /boda/i,
    /evento/i,
    /tarea/i,
    /fecha/i,
    /cliente/i,
    /empresa/i,
    /personal/i,
    /precio/i,
    /costo/i,
    /cobro/i,
    /pago/i,
    /plantilla/i,
    /descripci/i,
    /reemplazar[aá]n/i,
    /adaptar[aá]/i,
    /descargar[aá]/i,
    /guardar[aá]/i,
    /guard[oó]/i,
    /guarda/i,
    /calcular[aá]/i,
    /calcula/i,
    /sumar[aá]n/i,
    /completar[aá]n/i,
    /gesti[oó]n/i,
    /inteligencia/i,
    /publicaci/i,
    /comentario/i,
    /estilo/i,
    /color/i,
    /video/i,
    /audio/i,
    /tiempo/i,
    /semana/i,
    /d[ií]a/i,
    /salto/i,
    /l[ií]nea/i,
    /archivo/i,
    /importado/i,
    /generar/i,
    /a[nñ]adir/i,
    /a[nñ]adido/i,
    /rotar/i,
    /placeholder/i,
    /recone/i,
    /enviar[aá]/i,
    /aparecer[aá]n/i,
    /manualmente/i,
    /dispara/i,
    /comprobante/i,
    /recuerdo/i,
    /bot/i,
    /modo/i,
    /nombre/i,
  ];

  for (const arch of uiArchivos) {
    const relPath = path.relative(ROOT_DIR, arch).replace(/\\/g, '/');
    const content = leerArchivoSeguro(arch);
    const lineas = content.split('\n');

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];
      if (patronesRuido.some(p => p.test(linea))) continue;

      for (const { frase, nombre } of frasesPrometedoras) {
        if (frase.test(linea)) {
          hallazgos.push({
            archivo: relPath,
            linea: i + 1,
            detalle: `Promesa en pantalla sin respaldo confirmado ("${nombre}"): "${linea.trim().substring(0, 90)}"`,
          });
          break;
        }
      }
    }
  }

  return {
    titulo: 'Pasada 4: ¿Se cumple lo que promete la pantalla? (Promesas sin respaldo confirmado)',
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
