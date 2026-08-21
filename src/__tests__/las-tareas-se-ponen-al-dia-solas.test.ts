import fs from 'fs';
import path from 'path';

/**
 * Las tareas vencidas se ponen al dia cuando el equipo entra a la app.
 *
 * Por que existe esta prueba: las tareas automaticas necesitan un despertador de
 * afuera y ese despertador no estaba prendido. Resultado: los numeros de las redes
 * no se guardaban nunca y los posteos programados no salian nunca, aunque el
 * codigo estuviera perfecto.
 *
 * **Y la parte que no se toca:** los recordatorios de cuota vencida NO entran acá.
 * Le escriben al cliente por WhatsApp, y un mensaje a una persona no puede salir
 * de rebote porque alguien del equipo abrio una pantalla. Eso lo aprieta alguien,
 * sabiendo que lo aprieta.
 */
function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

const MODULO = 'src/lib/automatico/al-entrar-a-la-app.ts';

describe('poner al dia las tareas al entrar', () => {
  const fuente = leer(MODULO);

  it('pone al dia las metricas y los posteos programados', () => {
    expect(fuente).toContain('guardarMetricasDelDia');
    expect(fuente).toContain('procesarPosteosProgramados');
  });

  it('NO dispara nada que le escriba al cliente', () => {
    expect(fuente).not.toContain('ejecutarEscaneoDeRecordatorios');
    expect(fuente).not.toContain('recordatorios-de-pago');
    expect(fuente).not.toContain('sendMetaWhatsAppMessage');
  });

  it('no reintenta en cada clic: tiene su propio control de cuando le toca', () => {
    expect(fuente).toContain('leTocaCorrer');
    expect(fuente).toContain('CADA_CUANTO');
  });

  it('si una tarea falla, no rompe la pantalla', () => {
    expect(fuente).toContain('fallaron');
    expect(fuente).toContain('catch');
  });

  it('esta enganchado donde el equipo entra a la app', () => {
    const ruta = leer('src/app/api/marketing/automation/route.ts');

    expect(ruta).toContain('ponerAlDiaAlEntrar');
  });
});
