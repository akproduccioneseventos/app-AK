/**
 * MATAFUEGO — Auditoría externa del 21/11/2026, lo de permisos y plata que arregló Claude.
 *
 * - El auditor (que tiene todos los permisos para PROBAR) cambiaba las preguntas de seguridad de otras cuentas, el tope
 *   mensual de gasto de IA y prendía mensajes a clientes.
 * - La llamada de voz del equipo abría con una sesión cerrada y su gasto no entraba en el tope del mes.
 * - El registro de auditoría lo leía y escribía cualquiera con sesión.
 * - El operador de sala subía contratos, señas y recibos (y el archivo quedaba en el depósito antes del control).
 * - Una foto o un audio de un prospecto por Instagram se tomaba como "mención en historia" y se descartaba.
 * - Un mensaje nuevo de Instagram le sacaba la charla a la persona del equipo que la había tomado.
 */
import fs from 'fs';
import path from 'path';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

function cuerpoDe(fuente: string, nombre: string): string {
  const inicio = fuente.indexOf(`export async function ${nombre}`);
  expect(inicio).toBeGreaterThanOrEqual(0);
  const siguiente = fuente.indexOf('\nexport ', inicio + 1);
  return fuente.slice(inicio, siguiente === -1 ? undefined : siguiente);
}

describe('auditoría externa 21/11: quién toca qué', () => {
  it('el auditor no cambia ni ve las preguntas de seguridad de otra cuenta', () => {
    const auth = leer('src/app/actions/auth.ts');
    const cambiar = cuerpoDe(auth, 'updateSecurityQuestions');
    expect(cambiar).toMatch(/perfil === 'auditor'/);
    expect(cambiar).toMatch(/esAuditor\)\s*&&\s*auth\.user\?\.userId !== userId/);
    const ver = cuerpoDe(auth, 'getUserSecurityQuestionsForEdit');
    expect(ver).toMatch(/yo\.userId !== userId/);
    expect(ver).toMatch(/perfil === 'auditor'/);
  });

  it('el tope mensual de IA y los mensajes automáticos a clientes no los toca el auditor', () => {
    const tope = cuerpoDe(leer('src/lib/ai/consumo-servidor.ts'), 'setTopeMensual');
    expect(tope).toMatch(/esSesionDeAuditor\(\)/);
    const marketing = leer('src/app/actions/marketing-automation.ts');
    expect(cuerpoDe(marketing, 'setRecontactoAutomaticoActivo')).toMatch(/esAdministradorQueManda\(/);
    expect(cuerpoDe(marketing, 'runMarketingAutomationFromAdmin')).toMatch(/esAdministradorQueManda\(/);
    expect(marketing).toMatch(/perfil === 'auditor'.*return false/s);
  });

  it('la voz del equipo pide una sesión viva y entra en el tope de gasto del mes', () => {
    const voz = leer('src/app/api/asistente/voz-en-vivo/route.ts');
    expect(voz).not.toMatch(/verifySession\(/);
    expect(voz).toMatch(/await requireSession\(\)/);
    const post = voz.slice(voz.indexOf('export async function POST'));
    const reservaIA = post.indexOf("reservarConsumoIA('voz-equipo'");
    expect(reservaIA).toBeGreaterThan(0);
    // La reserva va antes de pedirle la ficha a Google, y se libera si Google falla.
    expect(reservaIA).toBeLessThan(post.indexOf('versionApiEnVivo()'));
    expect((post.match(/consumo\.liberar\(\)/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  it('el registro de auditoría pide permiso de administración, no sólo sesión', () => {
    const log = leer('src/app/actions/audit-log.ts');
    for (const fn of ['logAuditEvent', 'getAuditLogs']) {
      const cuerpo = cuerpoDe(log, fn);
      expect(cuerpo).toMatch(/requirePermiso\(PERMISOS\.ADMINISTRACION\)/);
      expect(cuerpo).not.toMatch(/requireAppSession\(/);
    }
  });

  it('subir un documento de plata pide contabilidad ANTES de subir al depósito', () => {
    const cuerpo = cuerpoDe(leer('src/app/actions/fiesta/documentos.actions.ts'), 'uploadDocumento');
    const permiso = cuerpo.indexOf('requirePermiso(PERMISOS.CONTABILIDAD)');
    expect(permiso).toBeGreaterThan(0);
    expect(permiso).toBeLessThan(cuerpo.indexOf('uploadToStorage('));
  });

  it('una foto de un prospecto por privado no es una mención en una historia', () => {
    const webhook = leer('src/app/api/meta/webhook/route.ts');
    const linea = webhook.split('\n').find((l) => l.includes('const storyMentionAtt')) || '';
    expect(linea).toMatch(/att\.type === 'story_mention'/);
    expect(linea).not.toMatch(/payload\?\.url/);
    // Se agradece sólo una mención nueva: primero se guarda, después se agradece.
    expect(webhook.indexOf('esNueva = true')).toBeLessThan(webhook.indexOf('esNueva && agradecer'));
    // La pantalla lee el mismo archivo donde el aviso guarda.
    const presencia = leer('src/app/actions/presencia-digital.ts');
    expect(presencia).toMatch(/'social-story-mentions\.json'/);
    expect(presencia).not.toMatch(/'story-mentions\.json'/);
  });

  it('un mensaje nuevo no le saca la charla a la persona del equipo', () => {
    const guardado = leer('src/lib/crm/public-lead-persistence.ts');
    expect(guardado).toMatch(/existing\?\.atiende === 'persona' \? 'persona'/);
  });
});
