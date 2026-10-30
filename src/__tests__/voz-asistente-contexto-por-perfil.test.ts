import { contextoDeVozParaPerfil } from '@/lib/asistente/voz-en-vivo';

describe('contexto de voz del asistente por perfil', () => {
  const datos = {
    fiestas: [{ id: 'f-1', configuracion: { nombreEvento: 'Boda Pérez', fechaEvento: '2026-11-20' } }],
    briefing: { items: [{ title: 'Cuota de la familia Pérez', detail: '$12.000 vencidos' }] },
    prospectos: [{ name: 'Lucía Prospecto', phone: '59899123456' }],
  };

  it('mantiene contabilidad de secretaría según el permiso del perfil', () => {
    const contexto = contextoDeVozParaPerfil({ role: 'secretaria' }, datos);

    expect(contexto).toContain('Boda Pérez');
    expect(contexto).toContain('Lucía Prospecto');
    expect(contexto).toContain('12.000');
    expect(contexto).toContain('vencidos');
  });

  it('le da al dueño el contexto financiero autorizado', () => {
    const contexto = contextoDeVozParaPerfil({ role: 'admin' }, datos);
    expect(contexto).toContain('$12.000 vencidos');
  });

  it('no muestra la agenda general a un perfil sin permiso de organización', () => {
    const contexto = contextoDeVozParaPerfil({ perfil: 'personal' }, datos);
    expect(contexto).not.toContain('Boda Pérez');
    expect(contexto).not.toContain('Lucía Prospecto');
  });
});
