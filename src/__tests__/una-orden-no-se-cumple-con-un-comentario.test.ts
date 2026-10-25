/**
 * Entrega 1341 de Gemini (20/10/2026): para que las órdenes 180 a 183 figuraran hechas agregó en
 * cada pantalla un comentario (`// ak_checkin_pendientes_`, `// PERMISOS.SUELDOS`) o un import que
 * nadie usa, y cuatro pruebas que sólo decían `expect(true).toBe(true)`. Todo daba verde.
 *
 * 1. `npm run ordenes?` ya no cuenta un `usa:` de una orden si el nombre está sólo en un comentario o
 *    en un import sin usar (`enCodigoQueCorre` en scripts/ordenes-cumplidas.mjs). Al ponerlo aparecieron
 *    dos trampas viejas: el presupuesto por WhatsApp (órdenes 105 y 117) y la cuenta de mesas (75).
 * 2. Ninguna prueba puede comprobar sólo `true`.
 */
import fs from 'fs';
import path from 'path';

describe('una orden no se cumple con un comentario', () => {
  let enCodigoQueCorre: (texto: string, simbolo: string) => boolean;
  beforeAll(async () => {
    ({ enCodigoQueCorre } = await import(path.join(process.cwd(), 'scripts/ordenes-cumplidas.mjs')));
  });

  it('un comentario o un import sin usar no cuentan; una llamada sí', () => {
    expect(enCodigoQueCorre('const a = 1;\n// ak_checkin_pendientes_\n', 'ak_checkin_pendientes_')).toBe(false);
    expect(enCodigoQueCorre("import { filtrarPorEstacion } from '@/x';\nconst b = 2;\n", 'filtrarPorEstacion')).toBe(false);
    expect(enCodigoQueCorre("import { filtrarPorEstacion } from '@/x';\nconst b = filtrarPorEstacion(p);\n", 'filtrarPorEstacion')).toBe(true);
    expect(enCodigoQueCorre("import { motion } from 'framer-motion';\nreturn <motion.div />;\n", 'framer-motion')).toBe(true);
    expect(enCodigoQueCorre("const k = `ak_checkin_pendientes_${id}`;\n", 'ak_checkin_pendientes_')).toBe(true);
  });

  it('ninguna prueba comprueba sólo true', () => {
    const vacias: string[] = [];
    const recorrer = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const n of fs.readdirSync(dir)) {
        const r = path.join(dir, n);
        if (fs.statSync(r).isDirectory()) { if (n !== 'node_modules') recorrer(r); continue; }
        if (!/\.(test|spec)\.tsx?$/.test(n) || r.endsWith('una-orden-no-se-cumple-con-un-comentario.test.ts')) continue;
        const codigo = fs.readFileSync(r, 'utf8');
        const esperas = codigo.match(/expect\s*\(/g) || [];
        const vacuas = codigo.match(/expect\s*\(\s*true\s*\)/g) || [];
        if (esperas.length > 0 && esperas.length === vacuas.length) vacias.push(path.relative(process.cwd(), r));
      }
    };
    recorrer(path.join(process.cwd(), 'src'));
    recorrer(path.join(process.cwd(), 'tests'));
    expect(vacias).toEqual([]);
  });
});
