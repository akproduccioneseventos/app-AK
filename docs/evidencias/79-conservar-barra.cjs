const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = fs.realpathSync(process.argv[2] || '');
assert.equal(root, fs.realpathSync(path.join(process.env.LOCALAPPDATA, 'Temp', 'ak-entorno-aislado-fWfDb3')));
const sha = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
assert.equal(sha, 'f790a002426aecb6598efa239fa948db57571752');
const build = fs.readFileSync(path.join(root, '.next', 'BUILD_ID'), 'utf8').trim();
assert.equal(build, 'iZL-zBn4z4fNZ_IXFyUCN');
const fiestaFile = path.join(root, 'data', 'fiestas', 'e2e_entorno_aislado.json');
const raw = fs.readFileSync(fiestaFile);
const fiesta = JSON.parse(raw);
assert.equal(fiesta.id, 'e2e_entorno_aislado');
const orders = fiesta.others.barraTecnologica.orders;
assert.equal(orders.length, 2);
assert.equal(orders.filter(order => order.status === 'entregado').length, 1);
assert.equal(orders.filter(order => order.status === 'cancelado' && order.stockRestoredAt).length, 1);
assert.ok(orders.every(order => order.guestId === 'inv_prueba_0' && order.drinkId === 'daiquiri-durazno'));
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'data', 'insumos.json'), 'utf8'));
const expected = new Map([['ing-ron', 9.9333], ['ing-durazno', 9.92], ['ing-jugo-limon', 9.98], ['ing-almibar', 9.985]]);
const stock = [];
for (const [id, quantity] of expected) {
  const actual = inventory.find(item => item.id === id)?.cantidadDisponible;
  assert.ok(Math.abs(actual - quantity) < 1e-10, `Stock ${id}: ${actual}`);
  stock.push({ id, initial: 10, actual, expected: quantity });
}
const result = {
  sha, build, fixture: fiesta.id, fixtureHash: crypto.createHash('sha256').update(raw).digest('hex'),
  scope: 'Lectura y assertions de datos ficticios despues del recorrido REAL de navegador; no invoca ni simula las acciones de barra. No demuestra Firestore, concurrencia entre servidores o hardware.',
  orders: orders.map(({ id, guestId, drinkId, status, stockMovements, stockRestoredAt, tableNumber }) => ({ id, guestId, drinkId, status, stockMovements, stockRestoredAt, tableNumber })),
  stock,
};
fs.writeFileSync(path.join(__dirname, '79-resultados', 'barra-persistencia.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
