import {
  textoDeCuentaRegresiva,
  textoDeEstadoDeFiestaParaPortal,
  textoDeCuentaRegresivaFecha,
} from '@/lib/portal/cuenta-regresiva';

describe('El portal no anuncia el gran día después (Orden 285 - Bloque 7 y 13)', () => {
  const hoySimulado = '2026-11-12';

  it('con hoy = 12/11/2026 y fiesta el 15/10/2026, el texto es "¡Ya la festejaste!"', () => {
    const texto = textoDeEstadoDeFiestaParaPortal('2026-10-15', hoySimulado);
    expect(texto).toBe('¡Ya la festejaste!');
  });

  it('con la fiesta hoy, el portal muestra "¡Llegó el gran día!"', () => {
    const texto = textoDeEstadoDeFiestaParaPortal('2026-11-12', hoySimulado);
    expect(texto).toBe('¡Llegó el gran día!');
  });

  it('la cuenta de la invitación con la fiesta pasada dice "¡Ya la festejaste!"', () => {
    const textoInvitacion = textoDeCuentaRegresivaFecha('2026-10-15', hoySimulado);
    expect(textoInvitacion).toBe('¡Ya la festejaste!');
  });

  it('la cuenta del portal con la fiesta pasada dice "¡Ya la festejaste!"', () => {
    const textoPortal = textoDeCuentaRegresivaFecha('2026-10-15', hoySimulado);
    expect(textoPortal).toBe('¡Ya la festejaste!');
  });

  it('con días negativos textoDeCuentaRegresiva devuelve "¡Ya la festejaste!"', () => {
    expect(textoDeCuentaRegresiva(-5)).toBe('¡Ya la festejaste!');
    expect(textoDeCuentaRegresiva(-1)).toBe('¡Ya la festejaste!');
  });

  it('con fiesta hoy, la cuenta de invitación devuelve "¡Es hoy!"', () => {
    const texto = textoDeCuentaRegresivaFecha('2026-11-12', hoySimulado);
    expect(texto).toBe('¡Es hoy!');
  });
});
