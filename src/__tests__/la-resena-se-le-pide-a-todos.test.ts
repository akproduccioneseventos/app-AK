import fs from 'fs';
import path from 'path';

/**
 * La resena de Google se le pide a TODOS los clientes, sin mirar la nota.
 *
 * Por que existe esta prueba: la app pedia la resena unicamente a los que ponian
 * 9 o 10 en la encuesta. Eso se llama filtrar resenas, y Google lo sanciona
 * **borrando todas las resenas del negocio**, no solo las filtradas, aunque el
 * pedido sea amable y no se ofrezca nada a cambio. Para un negocio de Salto que
 * recien empieza a juntar resenas, perder todas es perder el ano.
 *
 * Al cliente que quedo disconforme se le manda el mismo enlace con un texto que
 * primero se hace cargo. No se le esconde el boton.
 */
const ARCHIVO = 'src/app/actions/feedback.ts';

describe('el pedido de resena en Google', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), ARCHIVO), 'utf8');

  it('no filtra por nota antes de pedirla', () => {
    expect(fuente).not.toMatch(/npsScore\s*\?\?\s*0\)\s*>=\s*9/);
    expect(fuente).not.toMatch(/npsScore\s*\?\?\s*0\)\s*<\s*9/);
  });

  it('no quedan mensajes de error que justifiquen el filtro', () => {
    expect(fuente).not.toContain('No se debe pedir reseña pública');
    expect(fuente).not.toContain('No se puede pedir reseña pública');
  });

  it('sigue sin pedirla dos veces por la misma fiesta', () => {
    expect(fuente).toContain('yaSeLePidioPorEstaFiesta');
  });

  it('al que quedo disconforme se le escribe distinto, pero se le manda igual', () => {
    expect(fuente).toContain('quedoConforme');
  });
});
