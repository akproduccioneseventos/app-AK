import { getEstadoBlogAdmin } from '@/app/actions/blog';

describe('El estado del blog pide permiso', () => {
  it('requiere permisos de administración o CRM', async () => {
    // Si no hay sesión, getEstadoBlogAdmin lanza error
    await expect(getEstadoBlogAdmin()).rejects.toThrow();
  });
});
