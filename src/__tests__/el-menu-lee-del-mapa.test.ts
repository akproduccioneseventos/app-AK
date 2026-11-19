import { obtenerGruposMenuPorPerfil } from '@/components/main-nav';
import { puede, PERMISOS } from '@/lib/auth/perfiles';

describe('El menú lee del mapa (Orden 321)', () => {
  it('con perfil dueño, el menú tiene las 6 casas oficiales sin /mas', () => {
    const gruposDueno = obtenerGruposMenuPorPerfil({ role: 'admin', perfil: 'dueno' });
    const titulos = gruposDueno.flatMap((g) => g.items.map((i) => i.title));

    expect(titulos).toEqual([
      'Hoy',
      'Ventas y Marketing',
      'Fiestas',
      'Plata',
      'Empresa y Personal',
      'Ajustes',
    ]);
  });

  it('con perfil secretaria no aparece Ajustes y Plata depende de PERMISOS.CONTABILIDAD', () => {
    const userSecretaria = { role: 'user', perfil: 'secretaria' };
    const puedeContabilidadSecretaria = puede(userSecretaria, PERMISOS.CONTABILIDAD);

    const gruposSecretaria = obtenerGruposMenuPorPerfil(userSecretaria);
    const titulosSecretaria = gruposSecretaria.flatMap((g) => g.items.map((i) => i.title));

    // Si tiene permiso de contabilidad aparece Plata; si no, no aparece.
    expect(titulosSecretaria.includes('Plata')).toBe(puedeContabilidadSecretaria);

    // Ajustes requiere ADMINISTRACION, la secretaria no lo tiene y no debe aparecer
    expect(titulosSecretaria.includes('Ajustes')).toBe(false);
  });

  it('con perfil operador no aparece Plata, Ventas y Marketing, Empresa y Personal ni Ajustes', () => {
    const userOperador = { role: 'user', perfil: 'operador' };
    const puedeContabilidadOperador = puede(userOperador, PERMISOS.CONTABILIDAD);

    const gruposOperador = obtenerGruposMenuPorPerfil(userOperador);
    const titulosOperador = gruposOperador.flatMap((g) => g.items.map((i) => i.title));

    expect(puedeContabilidadOperador).toBe(false);
    expect(titulosOperador.includes('Plata')).toBe(false);
    expect(titulosOperador.includes('Ventas y Marketing')).toBe(false);
    expect(titulosOperador.includes('Empresa y Personal')).toBe(false);
    expect(titulosOperador.includes('Ajustes')).toBe(false);
    expect(titulosOperador.includes('Hoy')).toBe(true);
    expect(titulosOperador.includes('Fiestas')).toBe(true);
  });
});
