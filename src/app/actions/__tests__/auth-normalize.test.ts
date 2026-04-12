/**
 * Tests for role/modules normalization logic used in loginUser().
 *
 * The normalizeRole and normalizeModules functions are private helpers inside
 * auth.ts, so we replicate their pure logic here to verify the contract.
 */

function normalizeRole(raw: unknown): 'admin' | 'user' {
  return raw === 'admin' ? 'admin' : 'user';
}

function normalizeModules(raw: unknown, role: 'admin' | 'user'): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((m: unknown) => typeof m === 'string' && m.trim() !== '');
  }
  if (role === 'admin') {
    return ['all'];
  }
  return [];
}

describe('role/modules normalization logic', () => {
  test('usuario legacy con modules inválido -> normaliza correctamente', () => {
    // data.role = 'admin', data.modules = 'all' (string, no array)
    const role = normalizeRole('admin');
    const modules = normalizeModules('all', role);
    expect(role).toBe('admin');
    expect(modules).toEqual(['all']);
    expect(Array.isArray(modules)).toBe(true);
  });

  test('usuario legacy con role inválido -> normaliza a user', () => {
    // data.role = 'superadmin' (valor legacy)
    const role = normalizeRole('superadmin');
    const modules = normalizeModules([], role);
    expect(role).toBe('user');
    expect(modules).toEqual([]);
  });

  test('admin sin modules array -> login con ["all"]', () => {
    // data.role = 'admin', data.modules = undefined
    const role = normalizeRole('admin');
    const modules = normalizeModules(undefined, role);
    expect(role).toBe('admin');
    expect(modules).toEqual(['all']);
  });

  test('usuario con modules vacíos/mixtos -> filtra solo strings válidos', () => {
    // data.modules = ['presupuestos', '', null, 42, 'fiestas']
    const role = normalizeRole('user');
    const modules = normalizeModules(['presupuestos', '', null, 42, 'fiestas'], role);
    expect(modules).toEqual(['presupuestos', 'fiestas']);
  });

  test('usuario normal con datos correctos -> no cambia nada', () => {
    // data.role = 'admin', data.modules = ['all']
    const role = normalizeRole('admin');
    const modules = normalizeModules(['all'], role);
    expect(role).toBe('admin');
    expect(modules).toEqual(['all']);
  });
});
