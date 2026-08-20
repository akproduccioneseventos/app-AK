import { requestGoogleReviewManual, saveFeedback } from '@/app/actions/feedback';
import { getAccesoPersonalPortalView } from '@/app/actions/accesos-personal-view';

// Mocks para que la prueba sea real sobre la lógica y no una lista inventada
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/app/actions/settings', () => ({
  getCompanyInfoPublica: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(),
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
  getRolesPublicos: jest.fn(),
}));


describe('Reseñas de Google Automáticas', () => {
  const mockReadData = require('@/lib/data-service').readData;
  const mockGetCompanyInfo = require('@/app/actions/settings').getCompanyInfoPublica;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Antes esta prueba exigia lo contrario: que con nota menor a 9 no se pidiera.
  // Filtrar por puntaje hace que Google borre TODAS las resenas del negocio, asi
  // que la nota ya no frena el pedido. Lo unico que frena es no tener enlace, no
  // tener telefono, o habersela pedido ya por esa fiesta.
  it('la nota baja NO frena el pedido: se le pide igual', async () => {
    mockReadData.mockResolvedValue([
      { id: 'fb_1', npsScore: 3, clientName: 'Juan', fiestaId: 'f_1' }
    ]);
    mockGetCompanyInfo.mockResolvedValue({ googleReviewsLink: 'https://g.page/review' });

    const result = await requestGoogleReviewManual('fb_1');

    expect(result.error).not.toMatch(/menor a 9/);
  });

  it('debe rechazar la solicitud si el enlace de Google no está configurado', async () => {
    mockReadData.mockResolvedValue([
      { id: 'fb_1', npsScore: 10, clientName: 'Juan', fiestaId: 'f_1' }
    ]);
    mockGetCompanyInfo.mockResolvedValue({ googleReviewsLink: '' });

    const result = await requestGoogleReviewManual('fb_1');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/enlace de Google no está configurado/);
  });

  it('debe rechazar si ya se pidió la reseña', async () => {
    mockReadData.mockResolvedValue([
      { id: 'fb_1', npsScore: 10, clientName: 'Juan', fiestaId: 'f_1', googleReviewRequested: true }
    ]);
    mockGetCompanyInfo.mockResolvedValue({ googleReviewsLink: 'https://g.page/review' });

    const result = await requestGoogleReviewManual('fb_1');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Ya se le pidió la reseña/);
  });
});

describe('Reseñas automáticas al contestar la encuesta (sin sesión)', () => {
  const mockReadData = require('@/lib/data-service').readData;
  const mockGetCompanyInfo = require('@/app/actions/settings').getCompanyInfoPublica;
  const mockGetFiestaById = require('@/app/actions/fiesta/fiesta.actions').getFiestaById;
  const mockGetWhatsAppConfig = require('@/app/actions/whatsapp').getWhatsAppConfig;
  const mockSendWhatsApp = require('@/lib/whatsapp/meta-sender').sendMetaWhatsAppMessage;

  // El cliente contesta la encuesta sin estar logueado. Si el envio dependiera de
  // una accion que exige sesion, se caeria siempre y no se mandaria nunca nada.
  function prepararTodoListo(feedbackPrevio: any[]) {
    mockReadData.mockImplementation(async (archivo: string) => {
      if (archivo === 'feedback.json') return feedbackPrevio;
      if (archivo === 'customers.json') return [{ id: 'cli_1', phone: '099123456' }];
      return [];
    });
    mockGetCompanyInfo.mockResolvedValue({
      enableGoogleReviewsAutoRequest: true,
      googleReviewsLink: 'https://g.page/r/abc/review',
    });
    mockGetFiestaById.mockResolvedValue({
      id: 'f_1',
      configuracion: { clienteId: 'cli_1', nombreEvento: 'Boda de Ana y Juan' },
    });
    mockGetWhatsAppConfig.mockResolvedValue({ enabled: true, apiKey: 'tok', phoneNumberId: '123' });
    mockSendWhatsApp.mockResolvedValue({ success: true });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('manda el pedido de reseña cuando la nota es 10 y está prendido', async () => {
    prepararTodoListo([]);

    const res = await saveFeedback({
      fiestaId: 'f_1',
      fiestaNombre: 'Boda de Ana y Juan',
      clientName: 'Ana',
      npsScore: 10,
    } as any);

    expect(mockSendWhatsApp).toHaveBeenCalledTimes(1);
    expect(mockSendWhatsApp.mock.calls[0][0].to).toBe('099123456');
    expect(mockSendWhatsApp.mock.calls[0][0].text).toContain('https://g.page/r/abc/review');
    expect(res.feedback?.googleReviewRequested).toBe(true);
  });

  it('no vuelve a escribirle si ya se le pidió por esa misma fiesta', async () => {
    prepararTodoListo([
      { id: 'fb_previo', fiestaId: 'f_1', npsScore: 10, googleReviewRequested: true },
    ]);

    const res = await saveFeedback({
      fiestaId: 'f_1',
      fiestaNombre: 'Boda de Ana y Juan',
      clientName: 'Ana',
      npsScore: 10,
    } as any);

    expect(mockSendWhatsApp).not.toHaveBeenCalled();
    expect(res.feedback?.googleReviewRequested).toBeUndefined();
  });

  it('no manda nada si el enlace de Google está vacío', async () => {
    prepararTodoListo([]);
    mockGetCompanyInfo.mockResolvedValue({
      enableGoogleReviewsAutoRequest: true,
      googleReviewsLink: '',
    });

    await saveFeedback({
      fiestaId: 'f_1',
      fiestaNombre: 'Boda de Ana y Juan',
      clientName: 'Ana',
      npsScore: 10,
    } as any);

    expect(mockSendWhatsApp).not.toHaveBeenCalled();
  });

  it('no manda nada si la solicitud automática está apagada', async () => {
    prepararTodoListo([]);
    mockGetCompanyInfo.mockResolvedValue({
      enableGoogleReviewsAutoRequest: false,
      googleReviewsLink: 'https://g.page/r/abc/review',
    });

    await saveFeedback({
      fiestaId: 'f_1',
      fiestaNombre: 'Boda de Ana y Juan',
      clientName: 'Ana',
      npsScore: 10,
    } as any);

    expect(mockSendWhatsApp).not.toHaveBeenCalled();
  });

  it('con nota baja tambien se le manda, pero haciendose cargo primero', async () => {
    prepararTodoListo([]);

    await saveFeedback({
      fiestaId: 'f_1',
      fiestaNombre: 'Boda de Ana y Juan',
      clientName: 'Ana',
      npsScore: 4,
    } as any);

    expect(mockSendWhatsApp).toHaveBeenCalled();
    const enviado = mockSendWhatsApp.mock.calls[0][0].text as string;
    expect(enviado).toMatch(/no estuvieron a la altura/);
    expect(enviado).toMatch(/te vamos a llamar/);
    // El enlace va igual: no se le esconde a nadie.
    expect(enviado).toContain('https://g.page/r/abc/review');
  });

  it('con nota alta manda el mensaje de agradecimiento, con el mismo enlace', async () => {
    prepararTodoListo([]);

    await saveFeedback({
      fiestaId: 'f_1',
      fiestaNombre: 'Boda de Ana y Juan',
      clientName: 'Ana',
      npsScore: 10,
    } as any);

    expect(mockSendWhatsApp).toHaveBeenCalled();
    const enviado = mockSendWhatsApp.mock.calls[0][0].text as string;
    expect(enviado).toMatch(/Muchas gracias por tus comentarios/);
    expect(enviado).toContain('https://g.page/r/abc/review');
    prepararTodoListo([]);

    await saveFeedback({
      fiestaId: 'f_1',
      fiestaNombre: 'Boda de Ana y Juan',
      clientName: 'Ana',
      npsScore: 4,
    } as any);

    expect(mockSendWhatsApp).toHaveBeenCalled();
  });
});

describe('Plan de la Noche del Equipo (Portal de Acceso Personal)', () => {
  const mockGetAccesoById = require('@/app/actions/accesos-personal').getAccesoById;
  const mockGetFiestaById = require('@/app/actions/fiesta/fiesta.actions').getFiestaById;
  const mockGetRoles = require('@/app/actions/roles').getRolesPublicos;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar la vista del portal sin exponer datos financieros y con los datos del evento', async () => {
    mockGetAccesoById.mockResolvedValue({
      id: 'token_1',
      empleadoId: 'emp_1',
      fiestaId: 'f_1',
    });

    mockGetFiestaById.mockResolvedValue({
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

    mockGetRoles.mockResolvedValue([
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

  // El acceso puede ser de alguien de afuera (el fotógrafo contratado), que no
  // está en la lista de empleados y por lo tanto no tiene rol asignado.
  it('dice "Colaborador" cuando el acceso no es de nadie del equipo', async () => {
    mockGetAccesoById.mockResolvedValue({ id: 'token_2', fiestaId: 'f_1' });
    mockGetFiestaById.mockResolvedValue({
      id: 'f_1',
      configuracion: { nombreEvento: 'Boda de Ana y Juan' },
      personalAsignado: [{ empleadoId: 'emp_1', rolId: 'rol_1', eventSalary: 5000 }],
      programa: [],
    });
    mockGetRoles.mockResolvedValue([{ id: 'rol_1', nombre: 'Fotógrafo Principal' }]);

    const result = await getAccesoPersonalPortalView('token_2');

    expect(result!.fiesta!.rolAsignado).toBe('Colaborador');
    expect(JSON.stringify(result)).not.toContain('5000');
  });
});
