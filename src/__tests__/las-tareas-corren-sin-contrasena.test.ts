import fs from 'fs';
import path from 'path';

/**
 * Las tareas que no hacen dano corren aunque no haya contrasena configurada.
 *
 * Por que existe esta prueba: las cuatro tareas exigian una contrasena en la
 * cabecera del pedido. El dueno no programa y no podia configurarla ni en el
 * servicio que las llama ni en el servidor. **Resultado real: no corrieron nunca**,
 * con el codigo impecable.
 *
 * La decision fue mover el control de la puerta al interior de cada tarea, que es
 * donde ya estaba: el guardado no guarda dos veces el mismo dia, los posteos sacan
 * solo los vencidos con tope de tres, y el blog corre una vez por semana. Llamarlas
 * mil veces hace lo mismo que llamarlas una.
 *
 * **Lo que no se abre nunca:** los recordatorios de cuota le escriben al cliente por
 * WhatsApp. Sin contrasena, esa no corre.
 */
function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

const PUERTA = 'src/lib/automatico/puerta-de-las-tareas.ts';

const TAREAS = [
  'src/app/api/cron/metricas-de-redes/route.ts',
  'src/app/api/cron/publicar-programados/route.ts',
  'src/app/api/cron/generate-blog-post/route.ts',
  'src/app/api/cron/recordatorios-de-pago/route.ts',
];

describe('la puerta de las tareas', () => {
  const fuente = leer(PUERTA);

  it('con contrasena configurada, la exige', () => {
    expect(fuente).toContain('if (claveEsperada)');
    expect(fuente).toContain("mensaje: 'Unauthorized'");
  });

  it('la acepta por cabecera y tambien por direccion', () => {
    expect(fuente).toContain("request.headers.get('Authorization')");
    expect(fuente).toContain("searchParams.get('clave')");
  });

  it('los recordatorios NO estan entre las que pueden correr sin contrasena', () => {
    const lista = fuente.slice(
      fuente.indexOf('TAREAS_QUE_NO_HACEN_DANO'),
      fuente.indexOf(']);', fuente.indexOf('TAREAS_QUE_NO_HACEN_DANO')),
    );

    expect(lista).toContain('metricas-de-redes');
    expect(lista).toContain('publicar-programados');
    expect(lista).toContain('generate-blog-post');
    expect(lista).not.toContain('recordatorios-de-pago');
  });

  it('sin contrasena hay freno por si alguien la descubre', () => {
    expect(fuente).toContain('enforcePublicRateLimit');
  });
});

describe('las cuatro tareas usan la misma puerta', () => {
  it.each(TAREAS)('%s no decide el acceso por su cuenta', (archivo) => {
    const fuente = leer(archivo);

    expect(fuente).toContain('abrirPuertaDeLaTarea');
    expect(fuente).not.toContain('CRON_SECRET');
  });
});
