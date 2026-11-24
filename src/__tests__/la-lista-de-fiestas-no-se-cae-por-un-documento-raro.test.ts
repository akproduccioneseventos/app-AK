/**
 * MATAFUEGO — Auditoría general del 23/11/2026: la lista de fiestas daba error en producción y arrastraba nueve pantallas.
 * Tres puntos que la tiraban con un solo documento raro: una fecha de la base (Timestamp) que no puede viajar a la
 * pantalla, un documento sin su número adentro, y una fiesta sin `configuracion` al ordenar el historial.
 */
import fs from 'fs';
import path from 'path';
import { aObjetoPlano } from '@/lib/firebase-sync';

jest.mock('server-only', () => ({}));

it('las fechas de la base salen como texto y el resto queda igual', () => {
  const timestamp = { toDate: () => new Date('2026-12-23T00:00:00.000Z') };
  expect(aObjetoPlano({ id: 'f1', creada: timestamp, pagos: [{ fecha: timestamp, monto: 10 }], nada: null })).toEqual({
    id: 'f1',
    creada: '2026-12-23T00:00:00.000Z',
    pagos: [{ fecha: '2026-12-23T00:00:00.000Z', monto: 10 }],
    nada: null,
  });
});

it('el documento sin número toma el de la base, y la colección entera tiene más tiempo', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), 'src/lib/firebase-sync.ts'), 'utf8');
  expect(fuente).toMatch(/if \(!data\.id\) data\.id = doc\.id;/);
  expect(fuente).toMatch(/dbAdmin\.collection\(collectionName\)\.get\(\), 15_000\)/);
});

it('ordenar el historial no se cae con una fiesta sin configuración', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), 'src/lib/fiesta/leer-fiestas.ts'), 'utf8');
  expect(fuente).not.toMatch(/\.configuracion\.fechaEvento/);
});
