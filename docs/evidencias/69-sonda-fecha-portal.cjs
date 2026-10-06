const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
process.env.TZ = 'America/Montevideo';
const source = fs.readFileSync(path.resolve(__dirname, '../../src/app/portal-cliente/[id]/page.tsx'), 'utf8');
const start = source.lastIndexOf('  const today = new Date();');
const end = source.indexOf('  const checkedIn', start);
assert.ok(start >= 0 && end > start, 'Expected portal calculation not found.');
const realDate = Date;
class FixedDate extends realDate {
  constructor(...args) { super(...(args.length ? args : ['2026-10-05T22:00:00Z'])); }
}
const result = vm.runInNewContext(`(() => {
  ${source.slice(start, end)}
  return { eventInput: config.fechaEvento, interpretedDate: eventDate.toDateString(),
    today: today.toDateString(), isEventToday, isEventPast };
})()`, { Date: FixedDate, config: { fechaEvento: '2026-10-05' } });
assert.equal(result.isEventToday, false);
assert.equal(result.isEventPast, true);
console.log(JSON.stringify(result));
