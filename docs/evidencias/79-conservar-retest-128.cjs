const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = 'C:/Users/Usuario/AppData/Local/Temp/ak-entorno-aislado-Tr3RB9';
const source = '09c8d814fdecdca00da71de7bc22c1d64ef0e662';
const build = 'y3pk-oG28Gx7I91pIPgS2';
const out = path.join(__dirname, '79-resultados');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
assert.equal(fs.readFileSync(path.join(root, '.next/BUILD_ID'), 'utf8').trim(), build);
const budgets = read('data/presupuestos.json');
const leads = read('data/crm-leads.json');
const fiesta = read('data/fiestas/e2e_entorno_aislado.json');
assert.equal(fiesta.id, 'e2e_entorno_aislado');
const budget = budgets.find((b) => b.id === 'pres_public_f0d50cf641b0b7f1fc359fe1');
assert.ok(budget, 'The budget must have been created by the real UI');
assert.equal(budget.clienteNombre, 'Prueba aislada Codex79');
assert.equal(budget.invitadosCantidad, 100);
const lead = leads.find((l) => l.presupuestoId === budget.id);
assert.ok(lead, 'The actual budget must be linked to its CRM lead');
assert.equal(lead.eventDate, '2027-01-23T03:00:00.000Z');
assert.ok(!lead.followUpDate, 'Choosing an event date must not create an appointment');
const groups = fiesta.invitados;
const persons = (rsvp) => groups.filter((g) => g.rsvp === rsvp)
  .reduce((n, g) => n + Math.max(1, Math.floor(Number(g.partySize) || 1)), 0);
const confirmed = persons('Confirmado');
const pending = persons('Pendiente');
assert.equal(confirmed, 121);
assert.equal(pending, 37);
const portal = fs.readFileSync(path.join(out, 'portal-personas-128.txt'), 'utf8');
assert.match(portal, /121 personas confirmadas/);
assert.match(portal, /37 sin responder/);
assert.match(portal, /Confirmar 19 invitado\(s\) pendientes/);
const publicDocument = fs.readFileSync(path.join(out, 'presupuesto-publico-128.txt'), 'utf8');
assert.match(publicDocument, /POLLO ARROLLADO CON MESA BUFET/);
assert.doesNotMatch(publicDocument, /button "(Editar Presupuesto|Crear Fiesta|Aprobar Presupuesto)"/);
const result = {
  at: new Date().toISOString(), source, build,
  environment: 'Disposable isolated local JSON; no production writes',
  method: 'Read persistence and DOM evidence from actual browser actions; no action mocks',
  budget: {
    id: budget.id, guests: budget.invitadosCantidad,
    total: budget.totalConDescuento, linkedLeadId: lead.id,
    items: budget.itemsPresupuestados,
  },
  crm: { eventDate: lead.eventDate, followUpDate: lead.followUpDate ?? null },
  portal: {
    confirmedPersons: confirmed, pendingPersons: pending,
    confirmedInvitations: groups.filter((g) => g.rsvp === 'Confirmado').length,
    pendingInvitations: groups.filter((g) => g.rsvp === 'Pendiente').length,
    residual: 'Pending shortcut calls 19 invitations invitados; other counters show 37 persons',
  },
  limits: 'One public budget, one new lead, no booked appointment, existing grouped fixture; not all currencies, invoices, providers or roles',
};
fs.writeFileSync(path.join(out, 'retest-128-persistencia.json'), JSON.stringify(result, null, 2) + '\n');
fs.copyFileSync('C:/Users/Usuario/Downloads/presupuesto-ak-pres_public_f0d50cf641b0b7f1fc359fe1.pdf', path.join(out, 'presupuesto-128.pdf'));
console.log(JSON.stringify({ source, build, budget: budget.id, confirmed, pending, followUpDate: null }));
