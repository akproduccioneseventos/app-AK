const read = jest.fn(), remove = jest.fn(), inventory = jest.fn();
jest.mock('@/lib/auth/require-session', () => ({ requirePermisoAlguno: jest.fn(async () => undefined) }));
jest.mock('@/lib/data-service', () => ({ readData: (...args: unknown[]) => read(...args), deleteDataItem: (...args: unknown[]) => remove(...args) }));
jest.mock('@/app/actions/insumos', () => ({ getInsumos: (...args: unknown[]) => inventory(...args) }));
import { deleteProveedor } from '@/app/actions/proveedores';
describe('proveedor sin asociacion no confunde undefined con un nombre', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    read.mockResolvedValue([{ id: 'p1', nombre: 'QA Proveedor', tipo: 'Proveedor' }]);
    remove.mockResolvedValue(true);
  });
  it.each([undefined, '', '   '])('deja borrar con insumo no asociado %p', async proveedor => {
    inventory.mockResolvedValue([{ id: 'i1', nombre: 'QA Carne', proveedor }]);
    expect((await deleteProveedor('p1')).success).toBe(true);
    expect(remove).toHaveBeenCalledWith('proveedores.json', 'proveedores', 'p1');
  });
  it.each([{ proveedor: 'p1' }, { proveedorId: 'p1' }, { proveedor: 'QA Proveedor' }])('bloquea la asociacion real %p', async asociado => {
    inventory.mockResolvedValue([{ id: 'i1', ...asociado }]);
    expect((await deleteProveedor('p1')).success).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });
});
