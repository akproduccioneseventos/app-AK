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
    expect(source).toContain('createDataItem');
    expect(source).toContain('mutateDataItem');
    expect(source).toContain('mutateCrmLeadDocument');
  });

  it.each([
    ['moveCrmLead', 'scheduleCrmMeeting'],
    ['recordWhatsAppOpened', 'updateCrmLeadField'],
    ['updateCrmLeadField', 'checkDuplicatePhone'],
  ])('%s does not rewrite the full lead collection', (name, nextName) => {
    const body = actionBody(name, nextName);
    expect(body).toContain('mutateCrmLeadDocument');
    expect(body).not.toContain('writeData(LEADS_FILE');
  });

  it('scheduleCrmMeeting delega en la copia unica, que cambia el prospecto de a uno', () => {
    // Desde la orden 83 (25 de septiembre de 2026) la reunion se anota en
    // `src/lib/crm/crm-meeting.ts`, que usan el equipo y el simulador de la web.
    const body = actionBody('scheduleCrmMeeting', 'deleteCrmLead');
    expect(body).toContain('scheduleCrmMeetingInternal');
    expect(body).not.toContain('writeData(LEADS_FILE');
    const lib = readFileSync(join(process.cwd(), 'src/lib/crm/crm-meeting.ts'), 'utf8');
    expect(lib).toMatch(/mutateDataItem<CrmLead>\(LEADS_FILE, CRM_LEADS_COLLECTION/);
  });
});
