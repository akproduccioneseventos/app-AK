import fs from 'fs';
import path from 'path';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  CLAVES_TEMAS_TUTORIAL,
  TEMAS_TUTORIAL,
  extraerYoutubeVideoIdTutorial,
} from '@/lib/tutoriales/temas';

const mockReadData = jest.fn();
const mockWriteData = jest.fn();
const mockRequirePermisoAlguno = jest.fn();

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  writeData: (...args: any[]) => mockWriteData(...args),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ email: 'admin@akproducciones.com', perfil: 'dueno' })),
  requirePermisoAlguno: (...args: any[]) => mockRequirePermisoAlguno(...args),
}));

import { getTutorialesSettings, saveTutorialesSettings } from '@/app/actions/settings';

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      collectSourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('Orden 350 — Tutoriales en video solo aceptan YouTube', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequirePermisoAlguno.mockResolvedValue({ email: 'dueno@akproducciones.com', perfil: 'dueno' });
    mockWriteData.mockResolvedValue(undefined);
    mockReadData.mockResolvedValue({});
  });

  it('guarda youtu.be/abc123 extrayendo videoId "abc123" y exige PERMISOS.ADMINISTRACION', async () => {
    const res = await saveTutorialesSettings({
      simulador: { youtubeUrl: 'https://youtu.be/abc123' },
      invitados: { youtubeUrl: '' }, // se ignora si viene vacío
    } as any);

    // "invitados" no existe en TEMAS_TUTORIAL -> rechaza clave inválida
    expect(res.success).toBe(false);

    const okRes = await saveTutorialesSettings({
      simulador: { youtubeUrl: 'https://youtu.be/abc123' },
      'video-vida': { youtubeUrl: 'https://www.youtube.com/shorts/short999' },
      recepcion: { youtubeUrl: 'https://www.youtube.com/watch?v=watch777&feature=share' },
      fotocabina: { youtubeUrl: 'https://www.youtube.com/embed/emb555' },
    });

    expect(mockRequirePermisoAlguno).toHaveBeenCalledWith(PERMISOS.ADMINISTRACION);
    expect(okRes.success).toBe(true);
    expect(okRes.settings?.simulador?.videoId).toBe('abc123');
    expect(okRes.settings?.['video-vida']?.videoId).toBe('short999');
    expect(okRes.settings?.recepcion?.videoId).toBe('watch777');
    expect(okRes.settings?.fotocabina?.videoId).toBe('emb555');
    expect(mockWriteData).toHaveBeenCalledWith(
      'tutoriales-settings.json',
      expect.objectContaining({
        simulador: expect.objectContaining({ videoId: 'abc123' }),
      }),
    );
  });

  it('rechaza un enlace de otra pagina y devuelve el mensaje pedido', async () => {
    expect(extraerYoutubeVideoIdTutorial('https://vimeo.com/123456')).toBeNull();
    expect(extraerYoutubeVideoIdTutorial('https://www.tiktok.com/@ak/video/999')).toBeNull();

    const res = await saveTutorialesSettings({
      simulador: { youtubeUrl: 'https://vimeo.com/123456' },
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('Pegá un enlace de YouTube');
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('impide guardar al personal sin permiso de ADMINISTRACION', async () => {
    mockRequirePermisoAlguno.mockRejectedValue(new Error('No tenés permiso para administrar ajustes.'));

    const res = await saveTutorialesSettings({
      simulador: { youtubeUrl: 'https://youtu.be/abc123' },
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('permiso');
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('getTutorialesSettings es lectura pública segura y filtra claves desconocidas', async () => {
    mockReadData.mockResolvedValue({
      simulador: { youtubeUrl: 'https://youtu.be/abc123' },
      inexistente: { youtubeUrl: 'https://youtu.be/zzz999' },
    });

    const data = await getTutorialesSettings();
    expect(data.simulador?.videoId).toBe('abc123');
    expect(data.inexistente).toBeUndefined();
  });

  it('cada <BotonComoFunciona clave="..." /> usado en src/ existe en TEMAS_TUTORIAL', () => {
    expect(TEMAS_TUTORIAL.length).toBeGreaterThanOrEqual(48);

    const files = collectSourceFiles(path.join(process.cwd(), 'src'));
    const usedKeys: Array<{ file: string; clave: string }> = [];
    const regex = /<BotonComoFunciona[^>]*\bclave=["']([^"']+)["']/g;

    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        usedKeys.push({
          file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
          clave: match[1],
        });
      }
    }

    expect(usedKeys.length).toBeGreaterThan(25);
    const missing = usedKeys.filter((item) => !CLAVES_TEMAS_TUTORIAL.has(item.clave));
    expect(missing).toEqual([]);
  });
});
