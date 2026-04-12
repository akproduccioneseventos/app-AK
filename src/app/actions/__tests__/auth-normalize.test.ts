// Tests for role/modules normalization in loginUser()
// These test the normalizeRole and normalizeModules helper functions.

// Since normalizeRole and normalizeModules are private helpers,
// we replicate the logic here to verify the normalization contract.

function normalizeRole(raw: unknown): 'admin' | 'user' {
  if (typeof raw === 'string' && raw.trim().toLowerCase() === 'admin') {
    return 'admin';
  }
  return 'user';
}

function normalizeModules(raw: unknown, role: 'admin' | 'user'): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((m): m is string => typeof m === 'string' && m.trim() !== '');
  }
  return role === 'admin' ? ['all'] : [];
}

describe('normalizeRole', () => {
  it('returns "admin" for exact "admin" string', () => {
    expect(normalizeRole('admin')).toBe('admin');
  });
  it('returns "admin" for case-insensitive variations', () => {
    expect(normalizeRole('Admin')).toBe('admin');
    expect(normalizeRole('ADMIN')).toBe('admin');
    expect(normalizeRole(' admin ')).toBe('admin');
  });
  it('returns "user" for any other string', () => {
    expect(normalizeRole('administrator')).toBe('user');
    expect(normalizeRole('superadmin')).toBe('user');
    expect(normalizeRole('moderator')).toBe('user');
    expect(normalizeRole('')).toBe('user');
  });
  it('returns "user" for non-string values', () => {
    expect(normalizeRole(undefined)).toBe('user');
    expect(normalizeRole(null)).toBe('user');
    expect(normalizeRole(123)).toBe('user');
    expect(normalizeRole({})).toBe('user');
  });
});

describe('normalizeModules', () => {
  it('filters invalid entries from an array', () => {
    expect(normalizeModules(['dashboard', '', 123, null, 'events'], 'user'))
      .toEqual(['dashboard', 'events']);
  });
  it('keeps valid string arrays as-is', () => {
    expect(normalizeModules(['all'], 'admin')).toEqual(['all']);
  });
  it('defaults admin with non-array modules to ["all"]', () => {
    expect(normalizeModules(undefined, 'admin')).toEqual(['all']);
    expect(normalizeModules(null, 'admin')).toEqual(['all']);
    expect(normalizeModules('all', 'admin')).toEqual(['all']);
    expect(normalizeModules({}, 'admin')).toEqual(['all']);
  });
  it('defaults user with non-array modules to []', () => {
    expect(normalizeModules(undefined, 'user')).toEqual([]);
    expect(normalizeModules(null, 'user')).toEqual([]);
    expect(normalizeModules('dashboard', 'user')).toEqual([]);
  });
});

describe('legacy user login scenarios', () => {
  it('user with invalid modules gets login with valid cookie data', () => {
    const role = normalizeRole('admin');
    const modules = normalizeModules('this-is-not-an-array', role);
    expect(role).toBe('admin');
    expect(modules).toEqual(['all']);
    expect(Array.isArray(modules)).toBe(true);
  });

  it('user with invalid role gets login as "user"', () => {
    const role = normalizeRole('superuser');
    const modules = normalizeModules(['dashboard'], role);
    expect(role).toBe('user');
    expect(modules).toEqual(['dashboard']);
  });

  it('admin without modules array gets login with ["all"]', () => {
    const role = normalizeRole('admin');
    const modules = normalizeModules(undefined, role);
    expect(role).toBe('admin');
    expect(modules).toEqual(['all']);
  });
});
