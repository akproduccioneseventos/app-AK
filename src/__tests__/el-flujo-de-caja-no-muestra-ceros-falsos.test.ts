/**
 * MATAFUEGO: un cero equivocado en el flujo de caja es peor que no mostrar nada.
 *
 * La pantalla es /empresa/contabilidad/flujo-caja. Mostraba seis meses en cero cuando
 * en realidad no habia podido leer los datos, y eso se ve igual que "no entro plata".
 *
 * La decision de que mostrar vive aparte de la pantalla justamente para poder
 * comprobarla aca: la pantalla solo dibuja lo que esta funcion decide.
 */
import { queMostrarElFlujoDeCaja } from '@/lib/contabilidad/que-mostrar-flujo-caja';

const MESES = [
  { month: '2026-09', income: 0, expenses: 0, balance: 0 },
  { month: '2026-10', income: 0, expenses: 0, balance: 0 },
];

describe('El flujo de caja no muestra ceros falsos', () => {
  it('si no se pudieron leer los datos, NO muestra numeros', () => {
    const que = queMostrarElFlujoDeCaja({ success: false, error: 'No se pudieron leer los datos.' });
    expect(que.modo).toBe('error');
    expect(que).not.toHaveProperty('meses');
  });

  it('sin datos tampoco muestra numeros, aunque diga que salio bien', () => {
    expect(queMostrarElFlujoDeCaja({ success: true }).modo).toBe('error');
  });

  it('con datos completos muestra los numeros y no avisa de nada', () => {
    const que = queMostrarElFlujoDeCaja({ success: true, data: MESES as any });
    expect(que.modo).toBe('numeros');
    if (que.modo === 'numeros') {
      expect(que.meses).toHaveLength(2);
      expect(que.faltan).toEqual([]);
    }
  });

  it('si falta una fuente, muestra los numeros PERO dice cual falta', () => {
    const que = queMostrarElFlujoDeCaja({ success: true, data: MESES as any, fuentesCaidas: ['facturas'] });
    expect(que.modo).toBe('numeros');
    if (que.modo === 'numeros') {
      expect(que.faltan).toEqual(['facturas']);
    }
  });
});
