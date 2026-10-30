jest.mock('server-only', () => ({}));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn() }));
jest.mock('@/lib/data-service', () => ({ readDataConDetalle: jest.fn() }));
import { requireEventPermission } from '@/lib/auth/event-access';
import { readDataConDetalle } from '@/lib/data-service';
import { leerInformePosfiesta } from '@/app/actions/fiesta/informe-posfiesta.actions';
import { PERMISOS } from '@/lib/auth/perfiles';

beforeEach(() => { jest.resetAllMocks(); });

it('requires event administration before reading a report that contains financial data', async () => {
  (requireEventPermission as jest.Mock).mockRejectedValueOnce(new Error('Sin permiso'));
  await expect(leerInformePosfiesta('fiesta-1')).rejects.toThrow('Sin permiso');
  expect(requireEventPermission).toHaveBeenCalledWith('fiesta-1', PERMISOS.ADMINISTRACION);
  expect(readDataConDetalle).not.toHaveBeenCalled();
});

it('distinguishes no report from a failed read and never returns another event report', async () => {
  (readDataConDetalle as jest.Mock).mockResolvedValueOnce({ valor: [], huboFalla: true });
  await expect(leerInformePosfiesta('fiesta-1')).rejects.toThrow('No se pudo leer');
  (readDataConDetalle as jest.Mock).mockResolvedValueOnce({ valor: [{ fiestaId: 'fiesta-2' }], huboFalla: false });
  await expect(leerInformePosfiesta('fiesta-1')).resolves.toBeNull();
});
