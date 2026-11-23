import { addInvitado, submitPublicRsvp } from '@/app/actions/fiesta/invitados.actions';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { requireAppSession } from '@/lib/auth/require-session';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import * as fs from 'fs';
import path from 'path';

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(true),
}));

// In-memory store for parties to test actualizarFiesta
const mockFiestasStore = new Map<string, any>();

jest.mock('@/lib/fiesta/actualizar-fiesta', () => {
  return {
    actualizarFiesta: jest.fn(async (fiestaId: string, updateFn: any) => {
      const fiesta = mockFiestasStore.get(fiestaId);
      if (!fiesta) {
        return { success: false, error: `Fiesta con ID ${fiestaId} no encontrada.` };
      }
      try {
        const updated = typeof updateFn === 'function' ? updateFn(fiesta) : { ...fiesta, ...updateFn };
        mockFiestasStore.set(fiestaId, updated);
        return { success: true, updatedFiesta: updated };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }),
  };
});

describe('Auditoría 21/11: Entrar y Portal Bloque 2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFiestasStore.clear();

    mockFiestasStore.set('fiesta-a', {
      id: 'fiesta-a',
      estado: 'Confirmada',
      configuracion: { invitadosAdultos: 100, invitadosNinos: 20 },
      invitacionConfig: { rsvpActivo: true },
      invitados: [],
    });

    mockFiestasStore.set('fiesta-b', {
      id: 'fiesta-b',
      estado: 'Confirmada',
      configuracion: { invitadosAdultos: 100, invitadosNinos: 20 },
      invitacionConfig: { rsvpActivo: false },
      invitados: [],
    });
  });

  it('addInvitado con verifyPortalSession para fiesta-a y requireAppSession rechazando', async () => {
    (verifyPortalSession as jest.Mock).mockImplementation(async (id: string) => id === 'fiesta-a');
    (requireAppSession as jest.Mock).mockRejectedValue(new Error('No hay sesión de staff.'));

    const res = await addInvitado('fiesta-a', {
      nombre: 'Invitado A',
      rsvp: 'Pendiente',
      categoria: 'Adulto',
    });

    expect(res.success).toBe(true);
    expect(res.invitado?.nombre).toBe('Invitado A');
    expect(mockFiestasStore.get('fiesta-a').invitados.length).toBe(1);
  });

  it('addInvitado en fiesta-b cuando verifyPortalSession solo autoriza fiesta-a falla sin guardar', async () => {
    (verifyPortalSession as jest.Mock).mockImplementation(async (id: string) => id === 'fiesta-a');
    (requireAppSession as jest.Mock).mockRejectedValue(new Error('No hay sesión de staff.'));

    let errorCaught: any;
    try {
      await addInvitado('fiesta-b', {
        nombre: 'Invitado B',
        rsvp: 'Pendiente',
        categoria: 'Adulto',
      });
    } catch (e) {
      errorCaught = e;
    }

    expect(errorCaught).toBeDefined();
    expect(errorCaught.message).toBe('No hay sesión de staff.');
    expect(mockFiestasStore.get('fiesta-b').invitados.length).toBe(0);
  });

  it('submitPublicRsvp en fiesta-b cuando rsvpActivo es false devuelve error de confirmaciones cerradas', async () => {
    const res = await submitPublicRsvp('fiesta-b', {
      nombre: 'Invitado B',
      asistencia: 'Confirmado',
      dietaryRestriction: 'Ninguna',
      cancionesDJ: [],
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('Las confirmaciones están cerradas.');
  });

  it('verifica archivos de FAQ y Recepción mediante fs.readFileSync', () => {
    const faqPath = path.join(process.cwd(), 'src/components/panels/portal--faq.tsx');
    const faqContent = fs.readFileSync(faqPath, 'utf8');
    expect(faqContent).toContain('if (!enviada.success)');

    const recepcionPath = path.join(process.cwd(), 'src/app/recepcion/[fiestaId]/RecepcionClient.tsx');
    const recepcionContent = fs.readFileSync(recepcionPath, 'utf8');
    expect(recepcionContent).toContain('else');
    expect(recepcionContent).not.toMatch(/else\s*\{[^}]*enqueueOfflineAction/s);
  });
});
