import fs from 'fs';
import path from 'path';

/**
 * Los numeros de las redes se guardan todos los dias, entre o no el dueno.
 *
 * Por que existe esta prueba: las plataformas **no entregan los numeros viejos
 * hacia atras**. Lo que no se guarda hoy se pierde para siempre. El guardado
 * corria unicamente cuando alguien abria la pantalla de presencia digital, asi
 * que una semana sin entrar era una semana de historia que no se recuperaba.
 */

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

const TAREA = 'src/app/api/cron/metricas-de-redes/route.ts';

describe('los numeros de las redes se guardan solos', () => {
  it('existe la tarea diaria y llama al guardado', () => {
    const fuente = leer(TAREA);

    expect(fuente).toContain('guardarMetricasDelDia');
  });

  it('la tarea pasa por la puerta unica de las tareas programadas', () => {
    const fuente = leer(TAREA);

    // El control se movio de la ruta a `puerta-de-las-tareas.ts`, y se hizo mas
    // estricto, no menos: ahora decide en un solo lugar para las cuatro tareas.
    expect(fuente).toContain('abrirPuertaDeLaTarea');
    expect(fuente).toContain('puerta.permitido');
  });

  it('la puerta exige la clave cuando esta configurada', () => {
    const puerta = leer('src/lib/automatico/puerta-de-las-tareas.ts');

    expect(puerta).toContain('process.env.CRON_SECRET');
    expect(puerta).toContain("mensaje: 'Unauthorized'");
  });

  it('guardar los numeros no hace dano si se repite, por eso puede correr sin clave', () => {
    const puerta = leer('src/lib/automatico/puerta-de-las-tareas.ts');
    const biblioteca = leer('src/lib/presencia-digital/guardado-diario.ts');

    // Lo que la habilita a correr sin clave es su propio freno: no guarda dos
    // veces el mismo dia. Si eso se saca, hay que sacarla de la lista.
    expect(biblioteca).toContain("history.some((h) => h.date === hoy)");
    expect(puerta).toContain("'metricas-de-redes'");
  });

  it('el guardado vive aparte de la pantalla, para que la tarea pueda usarlo', () => {
    const biblioteca = leer('src/lib/presencia-digital/guardado-diario.ts');

    // La pantalla pide permiso; la tarea programada no tiene sesion. Por eso el
    // guardado vive en una biblioteca y no en una accion, igual que el escaneo
    // de recordatorios de pago: asi lo usan las dos sin abrir una accion sin
    // control.
    expect(biblioteca).toContain('export async function guardarMetricasDelDia');
  });

  it('no guarda dos veces el mismo dia', () => {
    const biblioteca = leer('src/lib/presencia-digital/guardado-diario.ts');

    expect(biblioteca).toContain("history.some((h) => h.date === hoy)");
  });
});
