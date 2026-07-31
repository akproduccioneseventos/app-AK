import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    'src/app/evento/espejo-magico/[fiestaId]/page.tsx',
  ),
  'utf8',
);

describe('AI mirror style selector', () => {
  it('keeps the selected template inside the active category', () => {
    expect(source).toContain('const selectAiCategory =');
    expect(source).toContain('currentTemplate?.categoryId === categoryId');
    expect(source).toContain('template.categoryId === categoryId');
    expect(source).toContain('onClick={() => selectAiCategory(cat.id)}');
  });

  it('shows the premium selector once and gives it the full idle viewport', () => {
    expect(source).toContain('data-testid="selected-ai-style"');
    expect(source).toContain(
      "mode !== 'ia' || localStatus !== 'idle' || capturedImage",
    );
    expect(source).toContain('touch-pan-x');
    expect(source).toContain('touch-pan-y');
  });
});
