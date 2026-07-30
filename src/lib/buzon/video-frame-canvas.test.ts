import { drawBuzonVideoFrame } from './video-frame-canvas';
import { BUZON_FRAME_TEMPLATE_IDS } from './video-frame-templates';

function createContext() {
  return {
    save: jest.fn(),
    restore: jest.fn(),
    strokeRect: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 120 })),
    setLineDash: jest.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('buzon video frame canvas', () => {
  it.each(BUZON_FRAME_TEMPLATE_IDS.filter((id) => id !== 'default'))(
    'renders the %s template into the recorded canvas',
    (template) => {
      const context = createContext();
      drawBuzonVideoFrame(context, template, 'Fiesta AK', 640, 480);

      expect(context.strokeRect).toHaveBeenCalled();
      expect(context.fillText).toHaveBeenCalledWith(
        expect.stringContaining('FIESTA AK'),
        320,
        expect.any(Number),
        560,
      );
    },
  );

  it('does not draw a frame for the default template', () => {
    const context = createContext();
    drawBuzonVideoFrame(context, 'default', 'Fiesta AK', 640, 480);

    expect(context.strokeRect).not.toHaveBeenCalled();
    expect(context.fillText).not.toHaveBeenCalled();
  });
});
