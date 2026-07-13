jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(),
  verifyBudgetToken: jest.fn(),
  generateBudgetToken: jest.fn(),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

import { getPresupuestoShareToken } from '@/app/actions/presupuestos';
import { generateBudgetToken, verifySession } from '@/lib/auth/session-token';
import { readData } from '@/lib/data-service';

describe('budget share access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not create a share token without an operator session', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ success: false, error: 'No autorizado' });

    await expect(getPresupuestoShareToken('pres_1')).resolves.toEqual({
      success: false,
      error: 'No autorizado',
    });
    expect(readData).not.toHaveBeenCalled();
    expect(generateBudgetToken).not.toHaveBeenCalled();
  });

  it('creates a signed token only for an existing budget', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ success: true });
    (readData as jest.Mock).mockResolvedValue([{ id: 'pres_1', clienteNombre: 'Sofia' }]);
    (generateBudgetToken as jest.Mock).mockResolvedValue('token-seguro');

    await expect(getPresupuestoShareToken('pres_1')).resolves.toEqual({
      success: true,
      token: 'token-seguro',
    });
    expect(generateBudgetToken).toHaveBeenCalledWith('pres_1');
  });
});
