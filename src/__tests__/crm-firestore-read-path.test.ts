import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('CRM Firestore read path', () => {
  it('reads the prospect collection once through data-service', () => {
    const crmSource = readFileSync(
      join(process.cwd(), 'src', 'app', 'actions', 'crm.ts'),
      'utf8',
    );
    const start = crmSource.indexOf('export async function getCrmLeads(');
    const end = crmSource.indexOf('export async function getCrmLeadsForDashboard(', start);
    const getCrmLeadsSource = crmSource.slice(start, end);

    expect(getCrmLeadsSource).toContain('readData<CrmLead[]>(LEADS_FILE, [])');
    expect(getCrmLeadsSource).not.toContain("collection('prospectos').get()");
  });

  it('keeps crm-leads.json mapped to the prospect collection', () => {
    const syncSource = readFileSync(
      join(process.cwd(), 'src', 'lib', 'firebase-sync.ts'),
      'utf8',
    );

    expect(syncSource).toContain("'crm-leads.json': 'prospectos'");
  });
});
