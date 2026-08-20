import fs from 'fs';
import path from 'path';
import { TAREAS_AUTOMATICAS, estadoDeLasTareas } from '@/lib/automatico/tareas-automaticas';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue({}),
  writeData: jest.fn().mockResolvedValue(undefined),
}));

/**
 * Lo que la app promete hacer sola tiene que poder demostrar que paso.
 *
 * Por que existe esta prueba: el 20 de agosto de 2026 aparecieron **cuatro tareas
 * automaticas escritas y ninguna con quien la dispare**. Compilaban, tenian
 * pruebas en verde, y no habian corrido nunca: el blog no publicaba, los numeros
 * de las redes no se guardaban, los posteos programados no salian y al cliente con
 * la cuota vencida no le llegaba el aviso.
 *
 * Las auditorias preguntaban "esta programado?" y la respuesta era si. **La
 * pregunta correcta es "esto paso alguna vez?".** Esta prueba obliga a que cada
 * tarea este declarada y sepa contestarla.
 */
const CARPETA_DE_TAREAS = 'src/app/api/cron';

describe('las tareas automaticas', () => {
  const carpetas = fs
    .readdirSync(path.join(process.cwd(), CARPETA_DE_TAREAS), { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name);

  it('no puede haber una tarea que no este en la lista', () => {
    const declaradas = TAREAS_AUTOMATICAS.map((t) => t.id).sort();

    expect(carpetas.sort()).toEqual(declaradas);
  });

  it.each(carpetas)('%s deja constancia cuando corre', (carpeta) => {
    const fuente = fs.readFileSync(
      path.join(process.cwd(), CARPETA_DE_TAREAS, carpeta, 'route.ts'),
      'utf8',
    );

    expect(fuente).toContain(`marcarCorrida('${carpeta}')`);
  });

  it('cada tarea explica en criollo que se pierde si no corre', () => {
    for (const tarea of TAREAS_AUTOMATICAS) {
      expect(tarea.nombre.length).toBeGreaterThan(5);
      expect(tarea.siNoCorre.length).toBeGreaterThan(30);
      expect(tarea.cadaHoras).toBeGreaterThan(0);
    }
  });

  it('sin ninguna marca, todas figuran como que nunca corrieron', async () => {
    const estado = await estadoDeLasTareas();

    expect(estado).toHaveLength(TAREAS_AUTOMATICAS.length);
    for (const tarea of estado) {
      expect(tarea.estado).toBe('nunca');
      expect(tarea.ultimaCorrida).toBeNull();
    }
  });
});
