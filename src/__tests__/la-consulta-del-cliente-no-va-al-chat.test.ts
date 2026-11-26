import fs from 'node:fs';
import path from 'node:path';
import { enviarConsultaPrivadaPortal } from '@/app/actions/fiesta/portal.actions';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { createNotification } from '@/lib/notifications/create-notification';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { getChatMessages } from '@/app/actions/social-gallery';

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(),
  setPortalSessionCookie: jest.fn(),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/app/actions/social-gallery', () => ({
  getChatMessages: jest.fn().mockResolvedValue([]),
  addChatMessage: jest.fn(),
}));

const fiestasMock = new Map<string, any>();

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (fiestaId: string, updateFn: any) => {
    const actual = fiestasMock.get(fiestaId);
    if (!actual) return { success: false, error: 'Fiesta no encontrada' };
    const copia = JSON.parse(JSON.stringify(actual));
    const updated = typeof updateFn === 'function' ? await updateFn(copia) : { ...copia, ...updateFn };
    fiestasMock.set(fiestaId, JSON.parse(JSON.stringify(updated)));
    return { success: true, updatedFiesta: JSON.parse(JSON.stringify(updated)) };
  }),
}));

describe('Orden 370 Bloque 3: la consulta del cliente no va al chat público de los invitados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fiestasMock.clear();
    fiestasMock.set('fiesta-faq-1', {
      id: 'fiesta-faq-1',
      mensajesCliente: [],
    });
    (verifyPortalSession as jest.Mock).mockResolvedValue(true);
  });

  it('guarda la consulta en la fiesta, avisa al equipo y no aparece en getChatMessages', async () => {
    const res = await enviarConsultaPrivadaPortal(
      'fiesta-faq-1',
      '¿A qué hora podemos llevar las bebidas?',
      { idIntento: 'int-1' },
    );

    expect(res.success).toBe(true);
    expect(actualizarFiesta).toHaveBeenCalledTimes(1);

    const guardada = fiestasMock.get('fiesta-faq-1');
    expect(guardada.mensajesCliente).toHaveLength(1);
    expect(guardada.mensajesCliente[0].mensaje).toContain('¿A qué hora podemos llevar las bebidas?');

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        href: '/fiestas/nueva?fiestaId=fiesta-faq-1&tab=portal-cliente',
      }),
    );

    const chatPublico = await getChatMessages('fiesta-faq-1');
    expect(chatPublico).toEqual([]);
  });

  it('rechaza si no hay sesión válida de portal', async () => {
    (verifyPortalSession as jest.Mock).mockResolvedValue(false);
    const res = await enviarConsultaPrivadaPortal('fiesta-faq-1', 'Consulta sin permiso');
    expect(res.success).toBe(false);
    expect(actualizarFiesta).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('portal--faq.tsx no usa addChatMessage y sí usa enviarConsultaPrivadaPortal', () => {
    const faqSource = fs.readFileSync(
      path.join(process.cwd(), 'src/components/panels/portal--faq.tsx'),
      'utf8',
    );
    expect(faqSource).not.toContain('addChatMessage');
    expect(faqSource).toContain('enviarConsultaPrivadaPortal');
  });
});
