import fs from 'fs';
import path from 'path';

describe('Touchpix real AI wiring', () => {
  const sourceRoot = path.resolve(__dirname, '..');
  const pageSource = fs.readFileSync(
    path.join(sourceRoot, 'app', 'evento', 'touchpix', '[fiestaId]', 'page.tsx'),
    'utf8'
  );
  const actionSource = fs.readFileSync(
    path.join(sourceRoot, 'app', 'actions', 'touchpix-ai.ts'),
    'utf8'
  );

  it('calls both image generation server actions from the booth UI', () => {
    expect(pageSource).toContain('await applyFaceSwap(formData)');
    expect(pageSource).toContain('await applyTouchpixTheme(formData)');
    expect(pageSource).not.toContain('Simulate AI processing');
  });

  it('uses a dedicated image generation model', () => {
    expect(actionSource).toContain('GEMINI_IMAGE_MODEL');
    expect(actionSource).toContain('googleai/imagen3');
    expect(actionSource).toContain('model: TOUCHPIX_IMAGE_MODEL');
  });
});
