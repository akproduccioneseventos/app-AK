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
 * **Y la regla que no se toca: preparar si, mandar no.** Los recordatorios de
 * cuota si entran, porque **no le escriben a nadie**: dejan el aviso en la bandeja
 * de salida y el mensaje sale cuando una persona lo toca, desde su propio
 * WhatsApp. El dueno usa su WhatsApp personal y ningun bot escribe ni contesta
 * solo. Si alguna vez una de estas tareas manda sola, sale de aca el mismo dia.
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

  it('prepara los recordatorios de cuota, que no le escriben a nadie', () => {
    expect(fuente).toContain('ejecutarEscaneoDeRecordatorios');
  });

  it('NO manda ningun mensaje por su cuenta', () => {
    // Esta es la linea que no se cruza: preparar si, mandar no.
    expect(fuente).not.toContain('sendMetaWhatsAppMessage');

    const motor = leer('src/lib/whatsapp-automation-engine.ts');
    expect(motor).not.toContain('sendMetaWhatsAppMessage');
    expect(motor).toContain("status: 'pendiente'");
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
