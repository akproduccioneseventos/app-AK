import { obtenerGruposMenuPorPerfil } from '@/components/main-nav';
import { puede, PERMISOS } from '@/lib/auth/perfiles';

describe('El menú lee del mapa (Orden 284)', () => {
  it('con perfil dueño, el menú tiene las 7 casas más "Más"', () => {
    const gruposDueno = obtenerGruposMenuPorPerfil({ role: 'admin', perfil: 'dueno' });
    const titulos = gruposDueno.flatMap((g) => g.items.map((i) => i.title));

    expect(titulos).toEqual([
      'Inicio',
      'Fiestas',
      'Vender',
      'Plata',
      'Marketing',
      'Recursos',
      'Ajustes',
      'Más',
    ]);
  });

  it('con perfil secretaria no aparece Plata si no le corresponde contabilidad (mismo puede)', () => {
    const userSecretaria = { role: 'user', perfil: 'secretaria' };
    const puedeContabilidadSecretaria = puede(userSecretaria, PERMISOS.CONTABILIDAD);

    const gruposSecretaria = obtenerGruposMenuPorPerfil(userSecretaria);
    const titulosSecretaria = gruposSecretaria.flatMap((g) => g.items.map((i) => i.title));

    // Si tiene permiso de contabilidad aparece Plata; si no, no aparece.
    expect(titulosSecretaria.includes('Plata')).toBe(puedeContabilidadSecretaria);

    // Ajustes requiere ADMINISTRACION, la secretaria no lo tiene y no debe aparecer
    expect(titulosSecretaria.includes('Ajustes')).toBe(false);
  });

  it('con perfil operador no aparece Plata', () => {
    const userOperador = { role: 'user', perfil: 'operador' };
    const puedeContabilidadOperador = puede(userOperador, PERMISOS.CONTABILIDAD);

    const gruposOperador = obtenerGruposMenuPorPerfil(userOperador);
    const titulosOperador = gruposOperador.flatMap((g) => g.items.map((i) => i.title));

    expect(puedeContabilidadOperador).toBe(false);
    expect(titulosOperador.includes('Plata')).toBe(false);
    expect(titulosOperador.includes('Vender')).toBe(false);
    expect(titulosOperador.includes('Ajustes')).toBe(false);
    expect(titulosOperador.includes('Fiestas')).toBe(true);
  });
});
