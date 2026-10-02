import { fillContractTemplate, buildContractFromSettings } from '@/lib/contract-template';
import { defaultContractSettings } from '@/types/settings';
import { getContractSettings } from '@/app/actions/settings';
import { readData } from '@/lib/data-service';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'admin_1', role: 'admin' } }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

describe('Orden 101 - Bloque 5: El contrato de la app pasa a ser el revisado del 30/09/2026', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('el contrato armado contiene $10.000 y EL/LA CLIENTE, y NO contiene $5.000 cada ni 30% de aumento de invitados', () => {
    const contrato = fillContractTemplate({
      clienteNombre: 'María Rodríguez',
      fechaFirma: '2026-10-01',
      fechaEvento: '2026-12-15',
      montoSena: '$ 25.000',
      salon: 'Salón Las Magnolias',
    });

    expect(contrato).toContain('$10.000');
    expect(contrato).toContain('EL/LA CLIENTE');
    expect(contrato).not.toContain('$5.000 cada');
    expect(contrato).not.toContain('30% de aumento de invitados');
    expect(contrato).not.toContain('aumentar hasta un 30%');
    expect(contrato).not.toMatch(/\{\{[A-Z0-9_]+\}\}/); // ningún {{...}} sin llenar
  });

  it('con firma 01/01 y evento 31/12 da HITO_50 en julio y saldo total el 1 de diciembre', () => {
    const contrato = fillContractTemplate({
      clienteNombre: 'Juan Carlos',
      fechaFirma: '2026-01-01',
      fechaEvento: '2026-12-31',
      montoSena: '$ 20.000',
    });

    // En Uruguay 182 días después del 1 de enero cae en julio
    expect(contrato.toLowerCase()).toContain('julio');
    // 30 días antes del 31 de diciembre es 1 de diciembre
    expect(contrato.toLowerCase()).toContain('1 de diciembre');
  });

  it('con cláusulas editadas por el dueño, leer los ajustes NO las reemplaza', async () => {
    const clausulasPersonalizadas = [
      {
        id: 'c_custom_1',
        order: 1,
        title: 'CLÁUSULA ESPECIAL DEL DUEÑO',
        content: 'Condiciones acordadas exclusivamente para este cliente.',
        isActive: true,
      },
    ];

    (readData as jest.Mock).mockResolvedValueOnce({
      clauses: clausulasPersonalizadas,
    });

    const settings = await getContractSettings();
    expect(settings.clauses).toEqual(clausulasPersonalizadas);
    expect(settings.clauses[0].title).toBe('CLÁUSULA ESPECIAL DEL DUEÑO');
  });

  it('el contrato de Yessica da el 30% al 16/02/2027, el 50% al 26/04/2027 y el total al 21/10/2027', () => {
    const contrato = fillContractTemplate({
      clienteNombre: 'Yessica',
      fechaFirma: '2026-10-01',
      fechaEvento: '2027-11-20',
      clienteTratamiento: 'Sra.',
    });

    expect(contrato).toContain('16 de febrero de 2027');
    expect(contrato).toContain('26 de abril de 2027');
    expect(contrato).toContain('21 de octubre de 2027');
    expect(contrato).toContain('LA CLIENTE');
    expect(contrato).toContain('la Sra. Yessica');
    expect(contrato).not.toContain('EL/LA CLIENTE');
  });

  it('un cliente Sr. usa EL CLIENTE y el Sr. en todo el contrato', () => {
    const contrato = fillContractTemplate({
      clienteNombre: 'Martín Pérez',
      fechaFirma: '2026-10-01',
      fechaEvento: '2027-11-20',
      clienteTratamiento: 'Sr.',
    });

    expect(contrato).toContain('EL CLIENTE');
    expect(contrato).toContain('el Sr. Martín Pérez');
    expect(contrato).not.toContain('EL/LA CLIENTE');
  });

  it('ya no figura el monto de la seña en el contrato y el plazo de regularización es de 15 días', () => {
    const contrato = fillContractTemplate({
      clienteNombre: 'Yessica',
      fechaFirma: '2026-10-01',
      fechaEvento: '2027-11-20',
    });

    expect(contrato).toContain('la seña acordada');
    expect(contrato).toContain('quince (15) días corridos');
    expect(contrato).not.toContain('cinco (5) días corridos');
  });
});
