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

  it('la tarea esta protegida con la clave de las tareas programadas', () => {
    const fuente = leer(TAREA);

    expect(fuente).toContain('CRON_SECRET');
    // Sin clave configurada no corre, a proposito: es preferible que no guarde a
    // que cualquiera pueda dispararla desde afuera.
    expect(fuente).toContain('no corre');
    expect(fuente).toContain('Unauthorized');
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
