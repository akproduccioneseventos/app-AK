/** @jest-environment node */
/**
 * Orden 233: las acciones del gasto de IA y del recontacto automático deciden por el perfil,
 * no por el rol viejo. Una cuenta `role: 'admin'` con perfil de secretaria no las usa.
 */
const verifySession = jest.fn();
jest.mock('@/lib/auth/session-token', () => ({ verifySession: () => verifySession() }));
const setTopeMensual = jest.fn(async (t: number) => ({ topeUYU: t }));
const getResumenDeGasto = jest.fn(async () => ({ gastadoUYU: 10 }));
jest.mock('@/lib/ai/consumo-servidor', () => ({ setTopeMensual: (t: number) => setTopeMensual(t), getResumenDeGasto: () => getResumenDeGasto() }));
const setAjustesDeRecontacto = jest.fn(async (a: boolean) => ({ activo: a }));
jest.mock('@/lib/marketing/recontacto-automatico', () => ({
  setAjustesDeRecontacto: (a: boolean) => setAjustesDeRecontacto(a),
  getAjustesDeRecontacto: async () => ({ activo: true }),
}));

import { getGastoDeIA, setTopeDeIA } from '@/app/actions/ai-consumo';
import { setRecontactoAutomaticoActivo, getRecontactoAutomaticoActivo } from '@/app/actions/marketing-automation';

const secretariaConRolViejo = { success: true, user: { userId: 's', role: 'admin', perfil: 'secretaria' } };
const duenio = { success: true, user: { userId: 'd', role: 'user', perfil: 'dueno' } };

beforeEach(() => jest.clearAllMocks());

it('la secretaria con rol viejo admin no toca el tope ni el recontacto', async () => {
  verifySession.mockResolvedValue(secretariaConRolViejo);
  expect((await setTopeDeIA(500)).success).toBe(false);
  expect((await getGastoDeIA()).gastadoUYU).toBe(0);
  expect((await setRecontactoAutomaticoActivo(true)).success).toBe(false);
  expect(await getRecontactoAutomaticoActivo()).toBe(false);
  expect(setTopeMensual).not.toHaveBeenCalled();
  expect(setAjustesDeRecontacto).not.toHaveBeenCalled();
});

it('el dueño sí', async () => {
  verifySession.mockResolvedValue(duenio);
  expect((await setTopeDeIA(500)).success).toBe(true);
  expect((await setRecontactoAutomaticoActivo(true)).success).toBe(true);
  expect(setTopeMensual).toHaveBeenCalledWith(500);
});
