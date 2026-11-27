import { createHash } from 'crypto';

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => new Map([['x-forwarded-for', '127.0.0.1']])),
}));
jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/lib/auth/solo-lectura', () => ({
  esSesionDeAuditor: jest.fn().mockResolvedValue(false),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_fiestaId: string, cb: (f: any) => any) => {
    const actual = {
      id: 'f_firma_363',
      configuracion: { nombreEvento: 'Fiesta 15' },
      contratoServicioTexto: 'Contrato vigente',
      firmaDigitalConstancia: { signedAt: '2026-11-25T10:00:00.000Z', signedBy: 'Cliente' },
    };
    const res = cb(actual);
    return { success: true, updatedFiesta: res };
  }),
}));

import { signContractDigitally } from '@/app/actions/fiesta/documentos.actions';

describe('Orden 363: la firma ya hecha devuelve yaEstabaFirmado', () => {
  it('devuelve yaEstabaFirmado: true cuando ya existía constancia', async () => {
    const huella = createHash('sha256').update('Contrato vigente').digest('hex');
    const res = await signContractDigitally('f_firma_363', 'Cliente', true, huella);
    expect(res.success).toBe(true);
    expect(res.yaEstabaFirmado).toBe(true);
  });
});
