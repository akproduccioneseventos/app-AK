/** Orden 241, grupo H: si la base rechaza el guardado de una regla, no se anuncia éxito ni queda copia local. */
const mockWriteData = jest.fn();
jest.mock('@/lib/data-service', () => ({
  readDataConDetalle: jest.fn(async () => ({ valor: null, huboFalla: false })),
  writeData: (...a: any[]) => mockWriteData(...a),
}));

import fs from 'fs';
import path from 'path';
import { guardarReglaIA } from '@/lib/ia/reglas-de-la-ia';

const archivo = path.join(process.cwd(), 'data', 'reglas-de-la-ia.json');

describe('guardar una regla con la base caída', () => {
  const entorno = { node: process.env.NODE_ENV, local: process.env.AK_USE_LOCAL_JSON_ONLY };
  let copiaPrevia: string | null = null;
  beforeEach(() => {
    copiaPrevia = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null;
    (process.env as any).NODE_ENV = 'production';
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    mockWriteData.mockReset();
  });
  afterEach(() => {
    (process.env as any).NODE_ENV = entorno.node;
    if (entorno.local !== undefined) process.env.AK_USE_LOCAL_JSON_ONLY = entorno.local;
    if (copiaPrevia !== null) fs.writeFileSync(archivo, copiaPrevia, 'utf8');
    else if (fs.existsSync(archivo)) fs.unlinkSync(archivo);
  });

  it('devuelve error y no deja una copia local que parezca guardado', async () => {
    mockWriteData.mockRejectedValue(new Error('base caída'));
    const antes = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null;
    const r = await guardarReglaIA('armar_web_evento', 'apagada', 'dueno');
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
    const despues = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null;
    expect(despues).toBe(antes);
  });

  it('con la base andando, guarda', async () => {
    mockWriteData.mockResolvedValue(undefined);
    const r = await guardarReglaIA('armar_web_evento', 'apagada', 'dueno');
    expect(r.success).toBe(true);
    expect(mockWriteData).toHaveBeenCalled();
  });
});
