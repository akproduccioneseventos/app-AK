import { sendGoogleReviewRequestAction } from '@/app/actions/feedback';
import { getPlanDeLaNocheForPersonal } from '@/app/actions/accesos-personal-view';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockImplementation((file: string, fallback: any) => {
    if (file === 'feedback.json') {
      return Promise.resolve([
        {
          id: 'fb_high',
          fiestaId: 'fiesta_123',
          fiestaNombre: 'XV de Camila',
          clientName: 'María Rossi',
          enjoyedMost: 'La fiesta entera',
          toImprove: 'Nada',
          npsScore: 10,
        },
        {
          id: 'fb_low',
          fiestaId: 'fiesta_123',
          fiestaNombre: 'Boda Carlos y Ana',
          clientName: 'Carlos P.',
          enjoyedMost: 'Música',
          toImprove: 'Demora',
          npsScore: 7,
        },
        {
          id: 'fb_sent',
          fiestaId: 'fiesta_123',
          fiestaNombre: 'Cumple Juan',
          clientName: 'Juan G.',
          enjoyedMost: 'Catering',
          toImprove: 'Nada',
          npsScore: 9,
          googleReviewRequestedAt: '2026-08-10T12:00:00.000Z',
        },
      ]);
    }
    return Promise.resolve(fallback);
  }),
  writeData: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: jest.fn().mockResolvedValue({
    googleReviewsAutoRequestEnabled: true,
    googleReviewsUrl: 'https://g.page/r/AKProducciones/review',
  }),
  getCompanyInfo: jest.fn().mockResolvedValue({
    companyContact: '098 355 530',
  }),
}));

jest.mock('@/app/actions/accesos-personal', () => ({
  getAccesoById: jest.fn().mockImplementation((tokenId: string) => {
    if (tokenId === 'valid_token') {
      return Promise.resolve({
        id: 'valid_token',
        nombreAcceso: 'Mozos Principal',
        fiestaId: 'fiesta_123',
        permisos: ['itinerario'],
      });
    }
    return Promise.resolve(null);
  }),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn().mockImplementation((id: string) => {
    if (id === 'fiesta_123') {
      return Promise.resolve({
        id: 'fiesta_123',
        fecha: '2026-09-20',
        configuracion: {
          nombreEvento: 'XV de Valentina',
          tipoEvento: '15 años',
          fechaEvento: '2026-09-20',
          detallesEvento: {
            celebracion: {
              lugar: 'Club Uruguay',
              direccion: 'Uruguay 1234, Salto',
              hora: '21:00 hs',
            },
          },
        },
      });
    }
    return Promise.resolve(null);
  }),
}));

describe('Bloque 1 — Reseñas en Google', () => {
  it('Rechaza solicitud de reseña si la nota NPS es menor a 9', async () => {
    const res = await sendGoogleReviewRequestAction('fb_low');
    expect(res.success).toBe(false);
    expect(res.error).toContain('calificación 9 o 10');
  });

  it('Rechaza solicitud de reseña si ya fue solicitada previamente', async () => {
    const res = await sendGoogleReviewRequestAction('fb_sent');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Ya se le solicitó');
  });

  it('Acepta solicitud de reseña si NPS es >= 9 y no se había enviado', async () => {
    const res = await sendGoogleReviewRequestAction('fb_high');
    expect(res.success).toBe(true);
  });
});

describe('Bloque 2 — El Plan de la Noche para el Staff', () => {
  it('Retorna nulo si el token de colaborador no existe', async () => {
    const res = await getPlanDeLaNocheForPersonal('token_invalido');
    expect(res).toBeNull();
  });

  it('Retorna la información del Plan de la Noche sin exponer datos financieros', async () => {
    const res = await getPlanDeLaNocheForPersonal('valid_token');
    expect(res).not.toBeNull();
    expect(res?.nombreEvento).toBe('XV de Valentina');
    expect(res?.salonNombre).toBe('Club Uruguay');
    expect(res?.rolAsignado).toBe('Mozos Principal');
    expect(res?.hitos.length).toBeGreaterThan(0);

    // Verificar estrictamente que no contenga claves de sueldo o presupuesto
    const keys = Object.keys(res || {});
    expect(keys).not.toContain('eventSalary');
    expect(keys).not.toContain('presupuesto');
    expect(keys).not.toContain('costo');
  });
});
