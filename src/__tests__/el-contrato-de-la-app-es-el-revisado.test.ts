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
});
