import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(process.cwd(), 'src/app/actions/crm.ts'), 'utf8');

function actionBody(name: string, nextName: string) {
  const start = source.indexOf(`export async function ${name}`);
  const end = source.indexOf(`export async function ${nextName}`, start + 1);
  return source.slice(start, end);
}

describe('CRM concurrency boundary', () => {
  it('creates and updates individual Firestore documents', () => {
    expect(source).toContain("collection('prospectos').doc(newLead.id).create");
    expect(source).toContain('dbAdmin.runTransaction');
    expect(source).toContain('mutateCrmLeadDocument');
  });

  it.each([
    ['moveCrmLead', 'scheduleCrmMeeting'],
    ['scheduleCrmMeeting', 'deleteCrmLead'],
    ['recordWhatsAppOpened', 'updateCrmLeadField'],
    ['updateCrmLeadField', 'checkDuplicatePhone'],
  ])('%s does not rewrite the full lead collection', (name, nextName) => {
    const body = actionBody(name, nextName);
    expect(body).toContain('mutateCrmLeadDocument');
    expect(body).not.toContain('writeData(LEADS_FILE');
  });
});
