/**
 * NINGÚN NÚMERO DE CONTACTO INVENTADO EN LA APP
 *
 * Costó dos veces encontrarlo a mano:
 *
 * 1. El simulador público caía en `59899123456` cuando no podía leer la conexión
 *    de WhatsApp. El prospecto armaba su presupuesto, tocaba "consultar" y **caía
 *    en la nada**.
 * 2. La agenda del simulador tenía `59899000000` escrito fijo, **sin alternativa**:
 *    todos los que agendaban una reunión recibían un número muerto.
 *
 * Las dos tenían la misma forma: un número que parece de verdad, escrito a mano,
 * en el camino por donde llega la plata. No las agarró ninguna prueba porque
 * **compilaban y la pantalla abría igual**.
 *
 * Esta prueba no pide que nadie escriba el número desde un solo lugar —eso sería
 * otra discusión—: pide algo más básico y que no se puede discutir. **Si hay un
 * número de teléfono en el código, tiene que ser EL de AK.**
 */

import fs from 'fs';
import path from 'path';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

const RAIZ = process.cwd();

/** Dónde buscar: el código que corre, no las pruebas ni los datos de ejemplo. */
const CARPETAS = ['src/app', 'src/lib', 'src/components'];

function esArchivoDeCodigo(archivo: string) {
  if (!/\.tsx?$/.test(archivo)) return false;
  // Las pruebas y los datos de ejemplo SÍ pueden tener números inventados: para
  // eso son. Lo que no puede tenerlos es el código que ve un cliente.
  return !/(\.test\.tsx?$|\.spec\.tsx?$|__tests__|__mocks__|\/seeds?\/|fixture)/.test(archivo);
}

function recorrer(dir: string): string[] {
  const completo = path.join(RAIZ, dir);
  if (!fs.existsSync(completo)) return [];
  return fs.readdirSync(completo, { withFileTypes: true }).flatMap((entrada) => {
    const relativo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return recorrer(relativo);
    return esArchivoDeCodigo(relativo) ? [relativo] : [];
  });
}

/**
 * Sólo se mira dónde la app LLAMA de verdad, no dónde muestra un ejemplo.
 *
 * Al escribir esta prueba, la primera versión marcó nueve archivos. Se revisaron
 * uno por uno: **seis eran ejemplos de formato** dentro de un `placeholder`, del
 * tipo "Ej: 59899123456 (con código de país)". Eso está BIEN: le muestra al
 * operador cómo se escribe un teléfono. Marcarlos habría hecho perder el viaje.
 *
 * Lo que sí es un error es un número al que la app **manda** a alguien: metido en
 * un enlace de WhatsApp, o puesto como valor de respaldo de un contacto.
 */
const DESTINO_DE_WHATSAPP = /wa\.me\/(\d{8,15})/g;
const RESPALDO_DE_CONTACTO = /\|\|\s*["'`](\d{10,15})["'`]/g;

describe('Ningún número de contacto inventado', () => {
  const archivos = recorrer(CARPETAS[0]).concat(recorrer(CARPETAS[1]), recorrer(CARPETAS[2]));

  it('se pudo leer el código: si no, esta prueba no sirve de nada', () => {
    expect(archivos.length).toBeGreaterThan(100);
  });

  it('todo número al que la app MANDA a alguien es EL de AK', () => {
    const ajenos: string[] = [];

    for (const archivo of archivos) {
      const texto = fs.readFileSync(path.join(RAIZ, archivo), 'utf8');
      const lineas = texto.split('\n');
      lineas.forEach((linea, i) => {
        for (const patron of [DESTINO_DE_WHATSAPP, RESPALDO_DE_CONTACTO]) {
          for (const hallado of linea.matchAll(new RegExp(patron.source, 'g'))) {
            const numero = hallado[1];
            if (numero === AK_WHATSAPP_NUMBER) continue;
            ajenos.push(`${archivo}:${i + 1} manda al número ${numero}`);
          }
        }
      });
    }

    // El aviso va DENTRO del valor que se compara: asi el que lea el rojo entiende
    // que hacer sin abrir este archivo. (`expect` de Jest toma un solo argumento;
    // la forma de dos es de Playwright, y escribirla aca hacia que la prueba
    // fallara por error de uso y no por encontrar algo.)
    const aviso =
      ajenos.length === 0
        ? ''
        : [
            'Hay numeros a los que la app manda gente y NO son el de AK:',
            ...ajenos,
            '',
            'Un numero inventado en una pantalla publica manda al cliente a la nada.',
            'Usa AK_WHATSAPP_NUMBER o buildAkWhatsAppUrl de src/lib/public-contact.ts.',
          ].join('\n');

    expect(aviso).toBe('');
  });

  it('el simulador público no puede quedarse sin número que dar', async () => {
    const texto = fs.readFileSync(
      path.join(RAIZ, 'src/app/actions/public-simulator-bootstrap.ts'),
      'utf8'
    );
    // Lo que importa no es que exista una alternativa: es QUE ALTERNATIVA ES.
    expect(texto).toContain('AK_WHATSAPP_NUMBER');
    expect(texto).not.toMatch(/\|\|\s*["']598\d+["']/);
  });
});
