import { readFileSync } from 'fs';
import { join } from 'path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('CRM agenda performance', () => {
  it('uses lightweight agenda and selector projections', () => {
    const agendaPage = read('src/app/(app)/contabilidad/crm/agenda/page.tsx');
    const meetingDialog = read('src/components/crm/ScheduleNewMeetingDialog.tsx');

    expect(agendaPage).toContain('getCrmAgendaEntries()');
    expect(agendaPage).not.toContain('getCrmLeads()');
    expect(meetingDialog).toContain('getCrmLeadOptions()');
    expect(meetingDialog).not.toContain('getCrmLeads()');
  });

  it('does not load event planning data for agenda-only reads', () => {
    const actions = read('src/app/actions/crm.ts');
    const agendaStart = actions.indexOf('export async function getCrmAgendaEntries');
    const optionsStart = actions.indexOf('export async function getCrmLeadOptions');
    const addLeadStart = actions.indexOf('export async function addCrmLead');
    const agendaBody = actions.slice(agendaStart, optionsStart);
    const optionsBody = actions.slice(optionsStart, addLeadStart);

    expect(agendaBody).toContain('readData<CrmLead[]>');
    expect(agendaBody).not.toContain('getFiestas');
    expect(optionsBody).toContain('readData<CrmLead[]>');
    expect(optionsBody).not.toContain('getFiestas');
  });

  it('records scheduled meetings in the prospect timeline', () => {
    const actions = read('src/app/actions/crm.ts');
    expect(actions).toContain("type: 'meeting_scheduled'");
    expect(actions).toContain('tl_meeting_');
    expect(actions).toContain("error: 'La fecha de la reunión no es válida.'");
  });
});
