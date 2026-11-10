/** @jest-environment node */

let mockPortalSessionValid = true;
let buzonHuboFalla = false;
let buzonMensajes: any[] = [];
let mockFiesta: any = null;
let socialPosts: any[] = [];
let songRequests: any[] = [];

jest.mock('server-only', () => ({}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({})),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => mockPortalSessionValid),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => mockFiesta),
}));

jest.mock('@/app/actions/social-gallery', () => ({
  getSocialPosts: jest.fn(async () => socialPosts),
}));

jest.mock('@/app/actions/buzon', () => ({
  contarSaludosDelBuzonParaElPortal: jest.fn(async () => (buzonHuboFalla ? null : buzonMensajes.length)),
}));

jest.mock('@/app/actions/social-interactive', () => ({
  getSongRequests: jest.fn(async () => songRequests),
}));

import { resumenDeLaFiestaParaElCliente } from '@/app/actions/fiesta/portal.actions';

describe('la fiesta en números no inventa ceros', () => {
  beforeEach(() => {
    mockPortalSessionValid = true;
    buzonHuboFalla = false;
    buzonMensajes = [{ id: 'm1', texto: 'Felicidades', autor: 'Tía Marta' }];
    socialPosts = [
      { id: 'p1', sourceModule: 'fotocabina', timestamp: '2026-10-10T22:00:00Z', imageUrl: 'https://example.com/p1.jpg' },
      { id: 'p2', sourceModule: 'fotocabina', timestamp: '2026-10-10T23:00:00Z', imageUrl: 'https://example.com/p2.jpg' },
      { id: 'p3', sourceModule: 'plataforma360', timestamp: '2026-10-10T23:30:00Z', imageUrl: 'https://example.com/p3.jpg' },
    ];
    songRequests = [
      { id: 's1', song: 'Despacito', votes: 5, requestedBy: 'Juan' },
      { id: 's2', song: 'La Morocha', votes: 3, requestedBy: 'Pedro' },
    ];
    mockFiesta = {
      id: 'fiesta-123',
      configuracion: { nombreEvento: 'Mis 15 Sofía' },
      invitados: [
        { id: 'inv-1', nombre: 'Carlos Gomez', rsvp: 'Confirmado', checkedIn: true, partySize: 2 },
        { id: 'inv-2', nombre: 'Laura Perez', rsvp: 'Confirmado', checkedIn: false, partySize: 1 },
      ],
    };
    jest.clearAllMocks();
  });

  it('sin sesión del portal no devuelve nada', async () => {
    mockPortalSessionValid = false;
    const res = await resumenDeLaFiestaParaElCliente('fiesta-123');
    expect(res.success).toBe(false);
    expect(res.data).toBeUndefined();
  });

  it('si falla la lectura del buzón, no devuelve el número de saludos ni un cero inventado', async () => {
    buzonHuboFalla = true;
    const res = await resumenDeLaFiestaParaElCliente('fiesta-123');
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    // Debe ser undefined, nunca 0 falso
    expect(res.data?.mensajesBuzonCount).toBeUndefined();
    expect(res.data?.mensajesBuzonCount).not.toBe(0);
  });

  it('con lecturas correctas devuelve los conteos precisos', async () => {
    const res = await resumenDeLaFiestaParaElCliente('fiesta-123');
    expect(res.success).toBe(true);
    expect(res.data?.fotosYVideosCount).toBe(3);
    expect(res.data?.estacionMasUsada).toBe('Fotocabina');
    expect(res.data?.mensajesBuzonCount).toBe(1);
    expect(res.data?.cancionesPedidasCount).toBe(2);
    expect(res.data?.invitadosAsistieronCount).toBe(2); // inv-1 con partySize 2 llegó
  });

  it('nunca devuelve enlaces ni nombres personales de invitados', async () => {
    const res = await resumenDeLaFiestaParaElCliente('fiesta-123');
    const jsonStr = JSON.stringify(res.data);
    expect(jsonStr).not.toContain('Carlos Gomez');
    expect(jsonStr).not.toContain('Laura Perez');
    expect(jsonStr).not.toContain('Tía Marta');
    expect(jsonStr).not.toContain('Juan');
    expect(jsonStr).not.toContain('Pedro');
    expect(jsonStr).not.toContain('https://');
    expect(jsonStr).not.toContain('example.com');
  });
});
