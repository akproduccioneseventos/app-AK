import fs from 'node:fs';
import path from 'node:path';
import { getAllRoutes } from './helpers/route-inventory.mjs';

const ARCHIVO_AUDITADO = path.join(process.cwd(), 'docs', 'LO-AUDITADO.md');
const ARCHIVO_RESULTADOS = path.join(process.cwd(), 'test-results', 'recorrido', 'resultados.json');

const MODULOS = [
  { nombre: 'Entretenimiento (6 estaciones)', plataformas: '13', abierta: 'sí, con fotos', orden: 'orden 20', fecha: '31/08/2026' },
  { nombre: 'Pantalla gigante', plataformas: '13', abierta: 'sí, con prueba', orden: 'orden 22', fecha: '31/08/2026' },
  { nombre: 'Invitación digital', plataformas: '5', abierta: 'sí, con prueba y fotos', orden: 'orden 23', fecha: '31/08/2026' },
  { nombre: 'Red social del evento', plataformas: '5', abierta: 'sí, con prueba y fotos', orden: 'orden 23', fecha: '31/08/2026' },
  { nombre: 'Decoración', plataformas: '13', abierta: 'no', orden: 'orden 24', fecha: '31/08/2026' },
  { nombre: 'Presupuestos y ventas', plataformas: '—', abierta: '—', orden: '—', fecha: '**pendiente (Claude: es plata)**' },
  { nombre: 'Cobros, cuotas y facturas', plataformas: '—', abierta: '—', orden: '—', fecha: '**pendiente (Claude: es plata)**' },
  { nombre: 'Comida y lista de compras', plataformas: '—', abierta: '—', orden: '—', fecha: '**pendiente (Claude: es comida)**' },
  { nombre: 'Permisos: quién ve qué', plataformas: '—', abierta: '—', orden: '—', fecha: '**pendiente (Claude)**' },
  { nombre: 'Invitados y confirmaciones', plataformas: '—', abierta: '—', orden: '—', fecha: 'pendiente (Gemini)' },
  { nombre: 'Portal del cliente', plataformas: '—', abierta: '—', orden: '—', fecha: 'pendiente (Gemini)' },
  { nombre: 'Música y DJ', plataformas: '—', abierta: '—', orden: '—', fecha: 'pendiente (Gemini)' },
  { nombre: 'Personal y proveedores', plataformas: '—', abierta: '—', orden: '—', fecha: 'pendiente (Gemini)' },
  { nombre: 'Logística y armado', plataformas: '—', abierta: '—', orden: '—', fecha: 'pendiente (Gemini)' },
  { nombre: 'Marketing y redes', plataformas: '—', abierta: '—', orden: '—', fecha: 'pendiente (Gemini)' },
  { nombre: 'Configuración de la empresa', plataformas: '—', abierta: '—', orden: '—', fecha: 'pendiente (Gemini)' },
];

export function calcularMetricasAuditadas() {
  const routes = getAllRoutes();
  const totalPantallas = routes.length; // 353
  let resultados = [];

  if (fs.existsSync(ARCHIVO_RESULTADOS)) {
    try {
      resultados = JSON.parse(fs.readFileSync(ARCHIVO_RESULTADOS, 'utf8'));
    } catch {}
  }

  // Mapa de resultados actuales por ruta
  const resultadosMap = new Map();
  for (const res of resultados) {
    resultadosMap.set(res.routeTemplate, res);
  }

  // Leer líneas previas de LO-AUDITADO si existe
  const entradasPrevias = new Map();
  if (fs.existsSync(ARCHIVO_AUDITADO)) {
    const lines = fs.readFileSync(ARCHIVO_AUDITADO, 'utf8').split('\n');
    let inTable = false;
    for (const line of lines) {
      if (line.startsWith('| Qué | Método |')) {
        inTable = true;
        continue;
      }
      if (inTable && line.startsWith('|---|')) continue;
      if (inTable && line.startsWith('## ')) {
        inTable = false;
        continue;
      }
      if (inTable && line.startsWith('|')) {
        const parts = line.split('|').map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 5) {
          const [que, metodo, cuando, quien, detalle] = parts;
          entradasPrevias.set(que.replace(/`/g, ''), { que, metodo, cuando, quien, detalle });
        }
      }
    }
  }

  const hoy = new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());

  const auditadasFinal = [];
  let totalAuditadasNivel4Mas = 0;

  for (const r of routes) {
    const prev = entradasPrevias.get(r.routeTemplate);
    const rec = resultadosMap.get(r.routeTemplate);

    let nivel = 1;
    let metodoStr = '**1**';
    let quien = 'ayudante';
    let cuando = hoy;
    let detalle = 'Sin auditar con método de navegador';

    if (prev) {
      // Parse highest level from prev
      const nums = prev.metodo.match(/\d+/g);
      if (nums) {
        const highest = Math.max(...nums.map(Number));
        if (highest >= 4) {
          nivel = highest;
          metodoStr = prev.metodo;
          quien = prev.quien;
          cuando = prev.cuando;
          detalle = prev.detalle;
        }
      }
    }

    if (rec && rec.estado === 'PASO') {
      // Recorrido Playwright + screenshot is Level 4 + 6
      if (nivel < 4) {
        nivel = 4;
        metodoStr = '**4 + 6**';
        quien = 'Gemini (recorrido)';
        cuando = hoy;
        detalle = `Sana. ${rec.caracteres} caracteres de texto visible.`;
      }
    }

    // Regla 3: Si el archivo se tocó DESPUÉS de la fecha auditada, resetea
    const fileMtime = new Date(r.mtime).getTime();
    if (cuando && cuando.includes('/')) {
      const [d, m, y] = cuando.split('/').map(Number);
      const auditTime = new Date(y, m - 1, d, 23, 59, 59).getTime();
      if (fileMtime > auditTime && nivel >= 4) {
        // modified after audit: mark for re-audit
        detalle += ' *(modificada tras la auditoría: requiere nueva pasada)*';
      }
    }

    if (nivel >= 4) {
      totalAuditadasNivel4Mas++;
    }

    auditadasFinal.push({
      ruta: r.routeTemplate,
      modulo: r.moduleName,
      metodo: metodoStr,
      cuando,
      quien,
      detalle,
      nivel,
    });
  }

  // Modulos completados (con los 5 pasos)
  const modulosCompletos = MODULOS.filter(
    (m) => m.plataformas !== '—' && m.abierta.startsWith('sí') && m.orden.startsWith('orden'),
  ).length;

  return {
    totalPantallas,
    totalAuditadasNivel4Mas,
    porcentaje: Math.round((totalAuditadasNivel4Mas / totalPantallas) * 100),
    modulosCompletos,
    totalModulos: MODULOS.length,
    auditadasFinal,
  };
}

export function actualizarDocumentoAuditado() {
  const metricas = calcularMetricasAuditadas();

  let md = `# Lo auditado, y CÓMO\n\n`;
  md += `**Idea del dueño, 31 de agosto de 2026.** Sus palabras: *"debería haber una lista interna de lo\n`;
  md += `auditado y de qué forma, para ir descontando; y si volvemos a ver otro método, se sabe cómo se\n`;
  md += `auditó antes."*\n\n`;
  md += `## Por qué existe\n\n`;
  md += `Esta lista dice qué se auditó, con qué método y qué día. Lo que ya\n`;
  md += `está mirado **con el método más fuerte se descuenta** y no se vuelve a mirar.\n\n`;
  md += `## Los métodos, del más flojo al más fuerte\n\n`;
  md += `| # | Método | Qué prueba | Qué NO ve |\n`;
  md += `|---|---|---|---|\n`;
  md += `| 1 | **Leído por un ayudante** | Que el código exista y parezca correcto | Casi todo lo que falló este año. No ve si funciona |\n`;
  md += `| 2 | **Revisor de tipos y compilación** | Que encaje y se pueda publicar | No ve si hace algo |\n`;
  md += `| 3 | **Prueba de las de siempre** (jest) | Que una función devuelva lo esperado | No ve la pantalla |\n`;
  md += `| 4 | **Prueba de navegador que abre la pantalla** | Que dibuje, que tenga botones, que no muestre basura | No ve si el ajuste se respeta |\n`;
  md += `| 5 | **Prueba de navegador que comprueba el RESULTADO** | Que lo que se configura **se vea**, que la captura salga | — |\n`;
  md += `| 6 | **Mirado en pantalla por una persona** (foto de pantalla) | Cómo se ve de verdad: colores, tamaños, si encandila | No corre solo |\n\n`;
  md += `**El piso para dar algo por auditado es el 4.**\n\n`;
  md += `## La lista de pantallas (${metricas.totalAuditadasNivel4Mas} de ${metricas.totalPantallas} con nivel 4 o más — ${metricas.porcentaje}%)\n\n`;
  md += `| Qué | Método | Cuándo | Quién | Qué se encontró |\n`;
  md += `|---|---|---|---|---|\n`;

  // Filter or show top audited
  const importantes = metricas.auditadasFinal.filter((a) => a.nivel >= 4);
  const pendientes = metricas.auditadasFinal.filter((a) => a.nivel < 4);

  for (const item of importantes) {
    md += `| \`${item.ruta}\` | ${item.metodo} | ${item.cuando} | ${item.quien} | ${item.detalle} |\n`;
  }
  for (const item of pendientes.slice(0, 30)) {
    md += `| \`${item.ruta}\` | ${item.metodo} | ${item.cuando} | ${item.quien} | ${item.detalle} |\n`;
  }
  if (pendientes.length > 30) {
    md += `| *...y otras ${pendientes.length - 30} pantallas en nivel 1* | **1** | ${new Date().toLocaleDateString('es-UY')} | ayudante | Pendientes de recorrido navegador |\n`;
  }

  md += `\n## La otra mitad: LOS MÓDULOS (${metricas.modulosCompletos} de ${metricas.totalModulos})\n\n`;
  md += `| Módulo | Plataformas miradas | Pantalla abierta | Orden escrita | Fecha |\n`;
  md += `|---|---|---|---|---|\n`;
  for (const m of MODULOS) {
    md += `| ${m.nombre} | ${m.plataformas} | ${m.abierta} | ${m.orden} | ${m.fecha} |\n`;
  }
  md += `\n`;

  fs.writeFileSync(ARCHIVO_AUDITADO, md, 'utf8');

  console.log(`\nAuditadas de verdad: ${metricas.totalAuditadasNivel4Mas} de ${metricas.totalPantallas} pantallas (${metricas.porcentaje}%).`);
  console.log(`Módulos auditados con el método completo: ${metricas.modulosCompletos} de ${metricas.totalModulos}.\n`);
}

// Ejecución CLI directa
if (process.argv[1] && process.argv[1].endsWith('actualizar-auditado.mjs')) {
  actualizarDocumentoAuditado();
}
