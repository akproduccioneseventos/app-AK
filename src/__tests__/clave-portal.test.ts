import {
  claveEsLaInicial,
  construirClavePorDefecto,
  motivoClaveInvalida,
  taparCorreo,
} from '@/lib/client-portal/clave-portal';

const fiesta = (clienteNombre?: string, extra: any = {}) => ({
  id: 'fiesta_abc123456',
  configuracion: { clienteNombre } as any,
  ...extra,
});

describe('clave del portal del cliente', () => {
  it('arma la clave inicial con el nombre del cliente', () => {
    expect(construirClavePorDefecto(fiesta('María González') as any)).toBe('CLIENTEMARIAGONZALEZ');
  });

  it('aguanta nombres con acentos, guiones y espacios de mas', () => {
    expect(construirClavePorDefecto(fiesta('  josé  peña-luna ') as any)).toBe('CLIENTEJOSEPENALUNA');
  });

  it('usa el codigo del evento cuando no hay nombre del cliente cargado', () => {
    // Sin esto el portal quedaria sin clave y no habria como entrar.
    expect(construirClavePorDefecto(fiesta(undefined) as any)).toBe('CLIENTE123456');
  });

  it('reconoce que la clave guardada sigue siendo la inicial', () => {
    const f = fiesta('María González', {
      clientPortalSettings: { enabled: true, accessKey: 'CLIENTEMARIAGONZALEZ' },
    });
    expect(claveEsLaInicial(f as any)).toBe(true);
  });

  it('deja de pedir el cambio una vez que el cliente eligio la suya', () => {
    const f = fiesta('María González', {
      clientPortalSettings: {
        enabled: true,
        accessKey: 'la-que-el-eligio',
        claveCambiadaPorCliente: true,
      },
    });
    expect(claveEsLaInicial(f as any)).toBe(false);
  });

  it('no pide el cambio si la clave guardada no es la que le dimos nosotros', () => {
    const f = fiesta('María González', {
      clientPortalSettings: { enabled: true, accessKey: 'otra-cosa-distinta' },
    });
    expect(claveEsLaInicial(f as any)).toBe(false);
  });

  describe('reglas de la clave nueva', () => {
    const f = fiesta('María González') as any;

    it('rechaza las demasiado cortas', () => {
      expect(motivoClaveInvalida('12ab', f)).toMatch(/al menos 6/i);
    });

    it('rechaza volver a poner la que le dimos al principio', () => {
      expect(motivoClaveInvalida('clientemariagonzalez', f)).toMatch(/distinta/i);
    });

    it('rechaza las que son solo numeros', () => {
      expect(motivoClaveInvalida('12345678', f)).toMatch(/solo n[uú]meros/i);
    });

    it('rechaza espacios al principio o al final, que se pierden al tipear', () => {
      expect(motivoClaveInvalida(' fiesta2026 ', f)).toMatch(/espacio/i);
    });

    it('acepta una clave razonable', () => {
      expect(motivoClaveInvalida('fiesta2026', f)).toBeNull();
    });
  });

  describe('pista del correo', () => {
    it('deja ver apenas el principio', () => {
      expect(taparCorreo('mariagonzalez@gmail.com')).toBe('ma***********@gmail.com');
    });

    it('devuelve vacio cuando no hay correo', () => {
      expect(taparCorreo(undefined)).toBe('');
      expect(taparCorreo('no-es-un-correo')).toBe('');
    });
  });
});
