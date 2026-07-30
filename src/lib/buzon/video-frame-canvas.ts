import {
  normalizeFrameTemplateId,
  type FrameTemplateId,
} from './video-frame-templates';

type FramePalette = {
  border: string;
  text: string;
  background: string;
  topLabel: string;
  bottomPrefix?: string;
  borderWidth?: number;
  lineDash?: number[];
  fontFamily?: string;
};

const FRAME_PALETTES: Record<Exclude<FrameTemplateId, 'default'>, FramePalette> = {
  neon: {
    border: '#d946ef',
    text: '#67e8f9',
    background: 'rgba(88, 28, 135, 0.82)',
    topLabel: 'NEON NIGHTS  •  LIVE',
    bottomPrefix: '✦',
  },
  elegante: {
    border: '#fcd34d',
    text: '#fef3c7',
    background: 'rgba(69, 26, 3, 0.78)',
    topLabel: '✦ BODA ELEGANTE ✦',
    fontFamily: 'Georgia, serif',
    borderWidth: 16,
  },
  'cumple-infantil': {
    border: '#38bdf8',
    text: '#fef08a',
    background: 'rgba(3, 105, 161, 0.84)',
    topLabel: '¡FIESTA!',
    bottomPrefix: '★',
    lineDash: [16, 10],
  },
  quince: {
    border: '#f472b6',
    text: '#fce7f3',
    background: 'rgba(131, 24, 67, 0.82)',
    topLabel: '♕ MIS 15 AÑOS ♕',
    bottomPrefix: '♥',
    borderWidth: 16,
  },
  vintage: {
    border: '#18181b',
    text: '#fde68a',
    background: 'rgba(39, 39, 42, 0.9)',
    topLabel: '35MM FILM  •  VHS-SP',
    bottomPrefix: 'PLAY ▶',
    borderWidth: 20,
    fontFamily: '"Courier New", monospace',
  },
  glamour: {
    border: '#eab308',
    text: '#fef08a',
    background: 'rgba(113, 63, 18, 0.82)',
    topLabel: '★ VIP ACCESS  •  RED CARPET ★',
    bottomPrefix: '★',
    borderWidth: 16,
  },
  floral: {
    border: '#6ee7b7',
    text: '#d1fae5',
    background: 'rgba(6, 78, 59, 0.82)',
    topLabel: '❦ RECUERDOS DULCES ❦',
    lineDash: [5, 8],
    fontFamily: 'Georgia, serif',
  },
  urbano: {
    border: '#18181b',
    text: '#ffffff',
    background: 'rgba(24, 24, 27, 0.92)',
    topLabel: 'STREET MODE  •  #URBAN',
    bottomPrefix: '▲',
    borderWidth: 22,
    fontFamily: '"Courier New", monospace',
  },
  minimalista: {
    border: '#ffffff',
    text: '#0f172a',
    background: 'rgba(255, 255, 255, 0.92)',
    topLabel: 'GALLERY SPEC',
    borderWidth: 14,
  },
};

function drawCenteredLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  palette: FramePalette,
  width: number,
) {
  const horizontalPadding = 18;
  ctx.save();
  ctx.font = `700 18px ${palette.fontFamily || 'Arial, sans-serif'}`;
  const textWidth = Math.min(width - 60, ctx.measureText(text).width + horizontalPadding * 2);
  const x = (width - textWidth) / 2;
  ctx.fillStyle = palette.background;
  ctx.fillRect(x, y - 25, textWidth, 34);
  ctx.fillStyle = palette.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, y - 8, width - 80);
  ctx.restore();
}

export function drawBuzonVideoFrame(
  ctx: CanvasRenderingContext2D,
  template: unknown,
  displayText: string,
  width: number,
  height: number,
) {
  const templateId = normalizeFrameTemplateId(template);
  if (templateId === 'default') return;

  const palette = FRAME_PALETTES[templateId];
  const borderWidth = palette.borderWidth ?? 14;
  const inset = borderWidth / 2 + 3;
  const safeText = (displayText.trim() || 'AK PRODUCCIONES').toUpperCase().slice(0, 80);

  ctx.save();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = borderWidth;
  ctx.lineJoin = 'round';
  ctx.setLineDash(palette.lineDash ?? []);
  ctx.shadowColor = palette.border;
  ctx.shadowBlur = templateId === 'neon' || templateId === 'glamour' ? 22 : 8;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
  ctx.restore();

  drawCenteredLabel(ctx, palette.topLabel, 48, palette, width);
  drawCenteredLabel(
    ctx,
    `${palette.bottomPrefix ? `${palette.bottomPrefix} ` : ''}${safeText}`,
    height - 22,
    palette,
    width,
  );
}

export function drawVideoContained(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
) {
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(video, x, y, drawWidth, drawHeight);
}
