import { armarContextoDelNegocio } from '@/lib/multiagent/contexto-negocio';
import { hoyEnUruguay } from '@/lib/utils';

// La fiesta va siempre diez días adelante: con una fecha fija la prueba se venció sola el 21/11/2026.
const EN_DIEZ_DIAS = hoyEnUruguay(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000));

describe('contexto compartido del asistente por perfil', () => {
  const datos = {
    fiestas: [{ id: 'fiesta-1', configuracion: { nombreEvento: 'Boda Pérez', fechaEvento: EN_DIEZ_DIAS } }],
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
