/**
 * El contador de Codex tiene un final (pedido del dueño, 2/10/2026).
 * Un área limpia vuelve sola a revisarse si su código cambió; el día que todas están limpias,
 * el contador lo dice.
 */
import fs from 'fs';
import path from 'path';
// @ts-ignore: script de node
import { resumen, estadoReal } from '../../scripts/codex-limpio.mjs';

const area = (estado: string, extra: object = {}) => ({ id: 'x', nombre: 'X', carpetas: ['src/x'], estado, ...extra });
const sinCambios = () => '';
const conCambios = () => 'src/x/a.ts\n';

describe('El contador de Codex tiene un final', () => {
  it('limpia con su commit y sin cambios queda limpia', () => {
    expect(estadoReal(area('limpia', { commit: 'abc' }), sinCambios)).toBe('limpia');
  });

  it('si el código cambió después, vuelve a mirarse (se prueba rompiéndolo)', () => {
    expect(estadoReal(area('limpia', { commit: 'abc' }), conCambios)).toBe('volver-a-mirar');
  });

  it('limpia sin commit no cuenta como limpia', () => {
    expect(estadoReal(area('limpia'), sinCambios)).toBe('sin-revisar');
  });

  it('dice "terminado" sólo con todas limpias', () => {
    expect(resumen([area('limpia', { commit: 'a' }), area('limpia', { commit: 'b' })], sinCambios).terminado).toBe(true);
    expect(resumen([area('limpia', { commit: 'a' }), area('con-hallazgos')], sinCambios).terminado).toBe(false);
  });

  it('cada carpeta de cada área existe (si no, un área quedaría limpia sin mirar nada)', () => {
    const datos = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs/codex/areas.json'), 'utf8'));
    const faltan = datos.areas.flatMap((a: any) => a.carpetas.filter((c: string) => !fs.existsSync(path.join(process.cwd(), c))));
    expect(faltan).toEqual([]);
  });
});
