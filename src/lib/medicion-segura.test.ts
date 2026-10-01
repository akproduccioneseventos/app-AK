import { sePuedeMedir, direccionParaMedir } from './medicion-segura';

describe('sePuedeMedir', () => {
  // Páginas de venta — deben devolver true
  test('la portada se puede medir', () => {
    expect(sePuedeMedir('/')).toBe(true);
  });

  test('el blog se puede medir', () => {
    expect(sePuedeMedir('/blog')).toBe(true);
  });

  test('una entrada del blog se puede medir', () => {
    expect(sePuedeMedir('/blog/como-organizar-tu-boda')).toBe(true);
  });

  test('la sección de bodas se puede medir', () => {
    expect(sePuedeMedir('/bodas')).toBe(true);
  });

  test('una página de bodas anidada se puede medir', () => {
    expect(sePuedeMedir('/bodas/servicio-dj')).toBe(true);
  });

  test('el simulador se puede medir', () => {
    expect(sePuedeMedir('/simulador')).toBe(true);
  });

  test('simulador-ak se puede medir', () => {
    expect(sePuedeMedir('/simulador-ak')).toBe(true);
  });

  test('simulador-de-presupuesto se puede medir', () => {
    expect(sePuedeMedir('/simulador-de-presupuesto')).toBe(true);
  });

  test('club-uruguay se puede medir', () => {
    expect(sePuedeMedir('/club-uruguay')).toBe(true);
  });

  test('privacidad se puede medir', () => {
    expect(sePuedeMedir('/privacidad')).toBe(true);
  });

  test('experiencia-ak se puede medir', () => {
    expect(sePuedeMedir('/experiencia-ak')).toBe(true);
  });

  test('landing con subpath se puede medir', () => {
    expect(sePuedeMedir('/landing/boda-2026')).toBe(true);
  });

  test('quinceañeras se puede medir', () => {
    expect(sePuedeMedir('/quinceaneras')).toBe(true);
  });

  test('catálogo se puede medir', () => {
    expect(sePuedeMedir('/catalogo')).toBe(true);
  });

  // Páginas privadas — deben devolver false
  test('la invitación de un invitado NO se puede medir', () => {
    expect(sePuedeMedir('/invitacion/fiesta-123/invitado/guest-456')).toBe(false);
  });

  test('el portal del cliente NO se puede medir', () => {
    expect(sePuedeMedir('/portal/c/LLAVE-FICTICIA')).toBe(false);
  });

  test('el acceso personal NO se puede medir', () => {
    expect(sePuedeMedir('/acceso-personal/token-abc')).toBe(false);
  });

  test('el acceso de proveedor NO se puede medir', () => {
    expect(sePuedeMedir('/proveedor/acceso/token-xyz')).toBe(false);
  });

  test('el admin NO se puede medir', () => {
    expect(sePuedeMedir('/admin')).toBe(false);
  });

  test('las fiestas NO se pueden medir', () => {
    expect(sePuedeMedir('/fiestas/nueva/musica')).toBe(false);
  });

  test('el dashboard NO se puede medir', () => {
    expect(sePuedeMedir('/dashboard')).toBe(false);
  });

  test('el login NO se puede medir', () => {
    expect(sePuedeMedir('/login')).toBe(false);
  });
});

describe('direccionParaMedir', () => {
  test('sin query string devuelve sólo el pathname', () => {
    expect(direccionParaMedir('/', '')).toBe('/');
  });

  test('pasa utm_source', () => {
    expect(direccionParaMedir('/', '?utm_source=ig')).toBe('/?utm_source=ig');
  });

  test('pasa todos los utm', () => {
    const result = direccionParaMedir('/', '?utm_source=ig&utm_medium=social&utm_campaign=verano');
    expect(result).toContain('utm_source=ig');
    expect(result).toContain('utm_medium=social');
    expect(result).toContain('utm_campaign=verano');
  });

  test('descarta el token', () => {
    const result = direccionParaMedir('/', '?utm_source=ig&token=LLAVE-FICTICIA');
    expect(result).toContain('utm_source=ig');
    expect(result).not.toContain('token');
    expect(result).not.toContain('LLAVE-FICTICIA');
  });

  test('descarta el guestId', () => {
    const result = direccionParaMedir('/invitacion/x/invitado/y', '?guestId=abc&token=LLAVE');
    expect(result).not.toContain('guestId');
    expect(result).not.toContain('token');
    expect(result).not.toContain('LLAVE');
  });

  test('pasa gclid y fbclid', () => {
    const result = direccionParaMedir('/', '?gclid=abc123&fbclid=xyz789');
    expect(result).toContain('gclid=abc123');
    expect(result).toContain('fbclid=xyz789');
  });

  test('pasa el parámetro tipo del simulador', () => {
    const result = direccionParaMedir('/simulador-de-presupuesto', '?tipo=boda');
    expect(result).toBe('/simulador-de-presupuesto?tipo=boda');
  });

  test('descarta parámetros desconocidos y preserva los seguros', () => {
    const result = direccionParaMedir('/', '?utm_source=google&access=secreto&salon=las-carretas');
    expect(result).toContain('utm_source=google');
    expect(result).toContain('salon=las-carretas');
    expect(result).not.toContain('access');
    expect(result).not.toContain('secreto');
  });

  test('con sólo parámetros privados devuelve pathname sin query string', () => {
    const result = direccionParaMedir('/invitacion/x', '?token=LLAVE&guestId=abc');
    expect(result).toBe('/invitacion/x');
  });
});
