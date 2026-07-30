import fs from 'node:fs';
import path from 'node:path';

describe('budget to planner synchronization path', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/app/actions/presupuestos.ts'),
    'utf8',
  );

  it('retries synchronization when the linked fiesta already exists', () => {
    expect(source).toMatch(
      /if \(existing\) \{\s+const syncResult = await syncFiestaFromBudget\(existing\.id\);/,
    );
  });

  it('does not report success when the automatic planner synchronization fails', () => {
    const createFlow = source.slice(source.indexOf('export async function createFiestaFromPresupuesto'));

    expect(createFlow).toContain('const syncResult = await syncFiestaFromBudget(result.fiesta.id);');
    expect(createFlow).toMatch(
      /if \(!syncResult\.success\) \{\s+return \{\s+success: false,/,
    );
  });
});
