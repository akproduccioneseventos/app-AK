/** @jest-environment node */
/**
 * 26/10/2026. El vigilante de publicidad decía "nunca modifica campañas ni gasta dinero" y
 * pausaba campañas y subía el presupuesto un 25% cada 12 horas, solo. Decisión del dueño: la
 * IA mira y propone; tocar una campaña o gastar más lo decide él. Comprobado rompiéndolo:
 * volviendo a importar ajustarPresupuestoCampana en el motor, esta prueba se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

describe('el agente de publicidad no toca campañas solo', () => {
  const raiz = path.join(process.cwd(), 'src', 'lib', 'agentes');
  const archivos = fs.readdirSync(raiz).filter((f) => /\.tsx?$/.test(f));

  it('ningún agente pausa campañas ni cambia presupuestos', () => {
    const malos = archivos.filter((f) =>
      /pausarCampana|ajustarPresupuestoCampana|crearCampana/.test(fs.readFileSync(path.join(raiz, f), 'utf8')),
    );
    expect(malos).toEqual([]);
  });

  it('lo que encuentra queda como propuesta para el OK del dueño', () => {
    const motor = fs.readFileSync(path.join(raiz, 'motor-agentes.ts'), 'utf8');
    expect(motor).toContain('Propuesta para tu OK: pausar');
    expect(motor).toContain('Propuesta para tu OK: subir el presupuesto');
  });
});
