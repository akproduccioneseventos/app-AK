import fs from 'fs';
import path from 'path';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

const mockCreateNotification = jest.fn();
jest.mock('@/app/actions/notifications', () => ({
  createNotification: (...a: unknown[]) => mockCreateNotification(...a),
}));
const mockRequire = jest.fn(async () => undefined);
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  requireFiestaWriteAccess: (...a: unknown[]) => mockRequire(...(a as [])),
  getFiestaById: jest.fn(async () => ({ id: 'f1', configuracion: { nombreEvento: '15 de Sofi' } })),
}));

import { avisarChoquesDeAlergiasACocina } from '@/app/actions/fiesta/avisar-alergias.actions';

describe('Codex 1367: seis defectos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('(6) el aviso a cocina crea una notificación real con permiso y título claro', async () => {
    mockCreateNotification.mockResolvedValue({ success: true });
    const r = await avisarChoquesDeAlergiasACocina('f1', [{ platoNombre: 'Milanesa', restriccion: 'Celíaco', personasAfectadas: 3 }]);
    expect(r.success).toBe(true);
    expect(mockRequire).toHaveBeenCalledWith('f1');
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'Alergias: platos que chocan', mensaje: expect.stringContaining('Milanesa') }),
    );
  });

  it('(6) si el aviso no se guarda, no dice éxito', async () => {
    mockCreateNotification.mockResolvedValue({ success: false, error: 'base caída' });
    const r = await avisarChoquesDeAlergiasACocina('f1', [{ platoNombre: 'A', restriccion: 'B', personasAfectadas: 1 }]);
    expect(r.success).toBe(false);
    mockCreateNotification.mockRejectedValue(new Error('boom'));
    expect((await avisarChoquesDeAlergiasACocina('f1', [{ platoNombre: 'A', restriccion: 'B', personasAfectadas: 1 }])).success).toBe(false);
  });

  it('(6) la pantalla de alergias llama a la acción y ya no afirma sin enviar', () => {
    const src = leer('src/app/(app)/fiestas/nueva/alergias/page.tsx');
    expect(src).toMatch(/await avisarChoquesDeAlergiasACocina\(/);
    expect(src).not.toMatch(/Se notificó a cocina/);
    expect(src.indexOf('setAvisoCocinaEnviado(true)')).toBeGreaterThan(src.indexOf('if (res.success)'));
  });

  it('(3) el enlace de WhatsApp usa el texto aprobado y el servidor guarda el corregido', () => {
    const page = leer('src/app/(app)/centro-de-control/page.tsx');
    expect(page).toMatch(/textoAprobado/);
    expect(page).toMatch(/encodeURIComponent\(textoAprobado\)/);
    const act = leer('src/app/actions/centro-de-control.ts');
    expect(act).toMatch(/updateScheduledMessageText\(id, textoFinal!\)/);
  });

  it('(4) tras crear las 3 versiones el estado local toma las propuestas guardadas', () => {
    const src = leer('src/app/(app)/fiestas/nueva/pagina-web/page.tsx');
    expect(src).toMatch(/propuestasDeWeb: res\.propuestas \?\? prev\.propuestasDeWeb/);
  });
});
