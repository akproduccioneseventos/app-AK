import { requestGoogleReviewManual } from '@/app/actions/feedback';
import { getAccesoPersonalPortalView } from '@/app/actions/accesos-personal-view';

// Mocks para que la prueba sea real sobre la lógica y no una lista inventada
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/app/actions/settings', () => ({
  getCompanyInfo: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
}));

jest.mock('@/app/actions/customers', () => ({
  getCustomerById: jest.fn(),
}));

jest.mock('@/app/actions/whatsapp', () => ({
  getWhatsAppConfig: jest.fn(),
}));

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(),
}));

jest.mock('@/app/actions/accesos-personal', () => ({
  getAccesoById: jest.fn(),
}));

jest.mock('@/app/actions/roles', () => ({
  getRoles: jest.fn(),
}));


describe('Reseñas de Google Automáticas', () => {
  const mockReadData = require('@/lib/data-service').readData;
  const mockGetCompanyInfo = require('@/app/actions/settings').getCompanyInfo;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe rechazar la solicitud si el NPS es menor a 9', async () => {
    mockReadData.mockResolvedValueOnce([
      { id: 'fb_1', npsScore: 8, clientName: 'Juan', fiestaId: 'f_1' }
    ]);
    mockGetCompanyInfo.mockResolvedValueOnce({ googleReviewsLink: 'https://g.page/review' });

    const result = await requestGoogleReviewManual('fb_1');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/menor a 9/);
  });

  it('debe rechazar la solicitud si el enlace de Google no está configurado', async () => {
    mockReadData.mockResolvedValueOnce([
      { id: 'fb_1', npsScore: 10, clientName: 'Juan', fiestaId: 'f_1' }
    ]);
    mockGetCompanyInfo.mockResolvedValueOnce({ googleReviewsLink: '' });

    const result = await requestGoogleReviewManual('fb_1');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/enlace de Google no está configurado/);
  });

  it('debe rechazar si ya se pidió la reseña', async () => {
    mockReadData.mockResolvedValueOnce([
      { id: 'fb_1', npsScore: 10, clientName: 'Juan', fiestaId: 'f_1', googleReviewRequested: true }
    ]);
    mockGetCompanyInfo.mockResolvedValueOnce({ googleReviewsLink: 'https://g.page/review' });

    const result = await requestGoogleReviewManual('fb_1');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Ya se le pidió la reseña/);
  });
});

describe('Plan de la Noche del Equipo (Portal de Acceso Personal)', () => {
  const mockGetAccesoById = require('@/app/actions/accesos-personal').getAccesoById;
  const mockGetFiestaById = require('@/app/actions/fiesta/fiesta.actions').getFiestaById;
  const mockGetRoles = require('@/app/actions/roles').getRoles;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar la vista del portal sin exponer datos financieros y con los datos del evento', async () => {
    mockGetAccesoById.mockResolvedValueOnce({
      id: 'token_1',
      empleadoId: 'emp_1',
      fiestaId: 'f_1',
    });

    mockGetFiestaById.mockResolvedValueOnce({
      id: 'f_1',
      configuracion: {
        nombreEvento: 'Boda de Ana y Juan',
        nombreLugar: 'Salón Principal',
        direccionLugar: 'Calle 123',
        horaInicio: '21:00',
        telefonoAsistencia: '099123456'
      },
      personalAsignado: [
        { empleadoId: 'emp_1', rolId: 'rol_1', eventSalary: 5000 }
      ],
      programa: [
        { id: 'p_1', hora: '21:00', titulo: 'Entrada' }
      ]
    });

    mockGetRoles.mockResolvedValueOnce([
      { id: 'rol_1', nombre: 'Fotógrafo Principal', sueldoPorEvento: 5000 }
    ]);

    const result = await getAccesoPersonalPortalView('token_1');
    
    expect(result).not.toBeNull();
    expect(result!.fiesta).toBeDefined();
    expect(result!.fiesta!.nombreEvento).toBe('Boda de Ana y Juan');
    expect(result!.fiesta!.lugar).toBe('Salón Principal');
    expect(result!.fiesta!.direccion).toBe('Calle 123');
    expect(result!.fiesta!.horaInicio).toBe('21:00');
    expect(result!.fiesta!.telefonoEncargado).toBe('099123456');
    expect(result!.fiesta!.rolAsignado).toBe('Fotógrafo Principal');
    expect(result!.fiesta!.programa.length).toBe(1);

    // Verificar explícitamente que NO hay leak del salario en el objeto retornado
    const resultString = JSON.stringify(result);
    expect(resultString).not.toContain('eventSalary');
    expect(resultString).not.toContain('5000');
  });
});
