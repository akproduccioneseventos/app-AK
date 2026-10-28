import { armarContextoDelNegocio } from '@/lib/multiagent/contexto-negocio';

describe('contexto compartido del asistente por perfil', () => {
  const datos = {
    fiestas: [{ id: 'fiesta-1', configuracion: { nombreEvento: 'Boda Pérez', fechaEvento: '2026-11-20' } }],
    presupuestos: [{ estado: 'Aceptado', totalConDescuento: 24000, clienteNombre: 'Familia Pérez' }],
    prospectos: [{ name: 'Prospecto visible', phone: '59899123456' }],
    sueldosResumen: 'Sueldo de empleado: $30.000',
  };

  it('respeta contabilidad de secretaría, pero mantiene sueldos privados', () => {
    const contexto = armarContextoDelNegocio({ role: 'secretaria' }, datos);

    expect(contexto).toContain('Boda Pérez');
    expect(contexto).toContain('Prospecto visible');
    expect(contexto).toContain('PLATA:');
    expect(contexto).not.toContain('24000');
    expect(contexto).not.toContain('SUELDOS');
    expect(contexto).not.toContain('Sueldo');
    expect(contexto).not.toContain('30.000');
  });

  it('incluye finanzas y salarios solo en el contexto del dueño', () => {
    const contexto = armarContextoDelNegocio({ role: 'admin' }, datos);

    expect(contexto).toContain('PLATA:');
    expect(contexto).toContain('Sueldo de empleado');
  });

  it('no revela agenda ni prospectos al operador', () => {
    const contexto = armarContextoDelNegocio({ perfil: 'personal' }, datos);

    expect(contexto).not.toContain('Boda Pérez');
    expect(contexto).not.toContain('Prospecto visible');
    expect(contexto).not.toContain('24000');
  });
});
