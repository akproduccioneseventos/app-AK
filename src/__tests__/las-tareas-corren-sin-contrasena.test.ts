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
 * **La linea que no se cruza: preparar si, mandar no.** Los recordatorios de cuota
 * corren sin contrasena porque no le escriben a nadie: dejan el aviso en la
 * bandeja de salida y el mensaje sale cuando una persona lo toca, desde su propio
 * WhatsApp. El dueno usa su WhatsApp personal y ningun bot escribe ni contesta.
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

  it('ninguna de las tareas abiertas manda un mensaje por su cuenta', () => {
    const lista = fuente.slice(
      fuente.indexOf('TAREAS_QUE_NO_HACEN_DANO'),
      fuente.indexOf(']);', fuente.indexOf('TAREAS_QUE_NO_HACEN_DANO')),
    );

    expect(lista).toContain('metricas-de-redes');
    expect(lista).toContain('publicar-programados');
    expect(lista).toContain('generate-blog-post');

    /**
     * Los recordatorios entraron el 20 de agosto: **preparan** la lista de a quien
     * reclamarle y la dejan en la bandeja de salida. El mensaje sale cuando una
     * persona lo toca, desde su propio WhatsApp.
     *
     * Lo que esta prueba cuida es que eso siga siendo cierto. Si el motor empieza
     * a mandar solo, se pone en rojo, y **la solucion no es sacar la prueba: es
     * sacar el envio, o sacar la tarea de la lista**.
     */
    const motor = leer('src/lib/whatsapp-automation-engine.ts');

    expect(motor).not.toContain('sendMetaWhatsAppMessage');
    expect(motor).toContain("status: 'pendiente'");
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
