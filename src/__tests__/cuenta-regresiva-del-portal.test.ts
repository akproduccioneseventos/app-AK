import { textoDeCuentaRegresiva } from '@/lib/portal/cuenta-regresiva';

/**
 * Defecto real, visto en una foto de la pantalla: el portal del cliente decia
 * siempre "Faltan N dias". El dia de la fiesta mostraba "Faltan 0 dias", que
 * suena a error, y la vispera decia "Faltan 1 dias". Es lo primero que ve el
 * cliente cuando abre su portal.
 */
describe('cuenta regresiva del portal del cliente', () => {
  it('el dia de la fiesta lo festeja, no dice cero', () => {
    expect(textoDeCuentaRegresiva(0)).toBe('¡Es hoy!');
  });

  it('la vispera habla en singular', () => {
    expect(textoDeCuentaRegresiva(1)).toBe('¡Es mañana!');
  });

  it('con varios dias por delante cuenta los dias', () => {
    expect(textoDeCuentaRegresiva(45)).toBe('Faltan 45 días');
  });

  it('una fiesta ya pasada no muestra numeros negativos', () => {
    expect(textoDeCuentaRegresiva(-3)).toBe('¡Ya la festejaste!');
  });

  it('sin fecha cargada lo dice, no rompe', () => {
    expect(textoDeCuentaRegresiva(null)).toBe('Fecha a confirmar');
    expect(textoDeCuentaRegresiva(Number.NaN)).toBe('Fecha a confirmar');
  });
});
