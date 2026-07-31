import fs from 'node:fs';
import path from 'node:path';

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('CRM board release behavior', () => {
  it('uses a deliberate pointer gesture and resolves card drops to their stage', () => {
    const board = readSource('src/components/crm/CrmDesktopBoard.tsx');
    const stage = readSource('src/components/crm/CrmStageColumn.tsx');
    const card = readSource('src/components/crm/CrmLeadCard.tsx');
    const page = readSource('src/app/(app)/contabilidad/crm/page.tsx');

    expect(board).toContain('activationConstraint: { distance: 5 }');
    expect(stage).toContain('data: { stageId: stage.id }');
    expect(card).toContain('data: { stageId: lead.currentStageId }');
    expect(page).toContain('over.data.current?.stageId');
    expect(page).toContain('leadToMove.currentStageId === targetStage.id');
  });
});
