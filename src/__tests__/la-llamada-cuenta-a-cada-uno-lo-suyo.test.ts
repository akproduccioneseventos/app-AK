import { contextoDeVozParaPerfil } from '@/lib/asistente/voz-en-vivo';
import { PERMISOS } from '@/lib/auth/perfiles';

describe('La llamada cuenta a cada uno lo suyo', () => {
  const fiestaPrueba = {
    id: 'fiesta_123',
    configuracion: {
      nombreEvento: '15 de Sofía',
      fechaEvento: '2026-11-15',
    },
    itinerario: [],
    checklist: [],
  };

  const datosNegocio = {
    fiestas: [fiestaPrueba],
    briefing: {
      items: [
        {
          priority: 'ALTA',
          title: 'Cliente Martín Pérez',
          detail: 'Debe saldo de cuota 2 por $45.000 (venció el 10/10)',
        },
      ],
    },
    prospectos: [
      { name: 'Lucía Méndez', partyType: 'Boda', phone: '099123456' },
    ],
  };

  test('con un usuario de perfil operador, el texto NO tiene ningún "$" ni las palabras "saldo", "seña" o "cuota"', () => {
    const operador = {
      role: 'operador',
      permissions: [PERMISOS.NOCHE, PERMISOS.ORGANIZACION],
    };

    const texto = contextoDeVozParaPerfil(operador, datosNegocio);

    expect(texto).not.toContain('$');
    expect(texto).not.toMatch(/\bsaldo(s)?\b/i);
    expect(texto).not.toMatch(/\bseña(s)?\b/i);
    expect(texto).not.toMatch(/\bcuota(s)?\b/i);
  });

  test('con contabilidad, sí tiene lo que debe un cliente de prueba', () => {
    const contadora = {
      role: 'secretaria',
      permissions: [PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION],
    };

    const texto = contextoDeVozParaPerfil(contadora, datosNegocio);

    expect(texto).toContain('$45.000');
    expect(texto).toContain('Martín Pérez');
  });

  test('con organización, tiene un pendiente de una fiesta de prueba', () => {
    const organizador = {
      role: 'operador',
      permissions: [PERMISOS.ORGANIZACION, PERMISOS.NOCHE],
    };

    const texto = contextoDeVozParaPerfil(organizador, datosNegocio);

    expect(texto).toContain('15 de Sofía');
    expect(texto).toContain('Pendientes importantes');
  });
});
