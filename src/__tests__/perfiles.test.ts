import {
  PERMISOS,
  PERFILES_DEL_EQUIPO,
  esPerfilValido,
  perfilDe,
  perfilDesdeRolViejo,
  puede,
} from '@/lib/auth/perfiles';

describe('perfiles y permisos', () => {
  describe('el dueño', () => {
    const dueno = { perfil: 'dueno' };

    it('ve todo, incluidas las ganancias y los sueldos', () => {
      expect(puede(dueno, PERMISOS.GANANCIAS)).toBe(true);
      expect(puede(dueno, PERMISOS.SUELDOS)).toBe(true);
      expect(puede(dueno, PERMISOS.ADMINISTRACION)).toBe(true);
    });
  });

  describe('la secretaria', () => {
    const secretaria = { perfil: 'secretaria' };

    it('puede facturar, cobrar y organizar', () => {
      expect(puede(secretaria, PERMISOS.CONTABILIDAD)).toBe(true);
      expect(puede(secretaria, PERMISOS.CRM)).toBe(true);
      expect(puede(secretaria, PERMISOS.ORGANIZACION)).toBe(true);
      expect(puede(secretaria, PERMISOS.INSUMOS)).toBe(true);
    });

    it('NO ve los sueldos ni las ganancias', () => {
      // Es el punto de todo esto: factura y cobra, pero cuanto gana cada
      // companero y cuanto le queda al negocio es del dueno.
      expect(puede(secretaria, PERMISOS.SUELDOS)).toBe(false);
      expect(puede(secretaria, PERMISOS.GANANCIAS)).toBe(false);
    });

    it('no puede crear usuarios ni borrar todo', () => {
      expect(puede(secretaria, PERMISOS.ADMINISTRACION)).toBe(false);
    });
  });

  describe('el operador de fiesta', () => {
    const operador = { perfil: 'operador' };

    it('maneja la noche', () => {
      expect(puede(operador, PERMISOS.NOCHE)).toBe(true);
      expect(puede(operador, PERMISOS.ORGANIZACION)).toBe(true);
    });

    it('no ve nada de plata', () => {
      // El que esta en la puerta escaneando QR no tiene por que ver presupuestos.
      expect(puede(operador, PERMISOS.CONTABILIDAD)).toBe(false);
      expect(puede(operador, PERMISOS.SUELDOS)).toBe(false);
      expect(puede(operador, PERMISOS.GANANCIAS)).toBe(false);
    });
  });

  describe('los que no son del equipo', () => {
    it('no entran a ningun modulo interno', () => {
      for (const perfil of ['cliente', 'prospecto', 'invitado', 'personal']) {
        for (const permiso of Object.values(PERMISOS)) {
          expect(puede({ perfil }, permiso)).toBe(false);
        }
      }
    });
  });

  describe('las cuentas que ya existen', () => {
    it('el administrador de antes pasa a ser dueño', () => {
      expect(perfilDesdeRolViejo('admin')).toBe('dueno');
      expect(puede({ role: 'admin' }, PERMISOS.GANANCIAS)).toBe(true);
    });

    it('el colaborador de antes pasa a secretaria y pierde los sueldos', () => {
      expect(perfilDesdeRolViejo('user')).toBe('secretaria');
      expect(puede({ role: 'user' }, PERMISOS.CONTABILIDAD)).toBe(true);
      expect(puede({ role: 'user' }, PERMISOS.SUELDOS)).toBe(false);
    });

    it('sin rol ni perfil, se trata como colaborador', () => {
      expect(perfilDe(undefined)).toBe('secretaria');
      expect(perfilDe({})).toBe('secretaria');
    });

    it('el perfil manda sobre el rol viejo', () => {
      expect(perfilDe({ perfil: 'operador', role: 'admin' })).toBe('operador');
    });

    it('un perfil inventado no da acceso a nada de mas', () => {
      expect(esPerfilValido('jefe-supremo')).toBe(false);
      expect(perfilDe({ perfil: 'jefe-supremo', role: 'user' })).toBe('secretaria');
    });
  });

  it('los perfiles que se asignan al equipo son los cuatro de adentro', () => {
    expect([...PERFILES_DEL_EQUIPO]).toEqual(['dueno', 'secretaria', 'operador', 'personal']);
  });
});
