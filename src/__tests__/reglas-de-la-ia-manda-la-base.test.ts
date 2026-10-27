import fs from 'fs';
import os from 'os';
import path from 'path';

const readDataConDetalle = jest.fn();
jest.mock('@/lib/data-service', () => ({
  readDataConDetalle: (...a: unknown[]) => readDataConDetalle(...a),
  writeData: jest.fn(),
}));

describe('Las reglas de la IA: manda la base, la copia local es respaldo', () => {
  const cwd = process.cwd();
  let tmp: string;
  beforeEach(() => {
    jest.resetModules();
    readDataConDetalle.mockReset();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reglas-'));
    fs.mkdirSync(path.join(tmp, 'data'));
    fs.writeFileSync(path.join(tmp, 'data', 'reglas-de-la-ia.json'), JSON.stringify({ vigilante_fiestas: 'sola' }));
    jest.spyOn(process, 'cwd').mockReturnValue(tmp);
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  });
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.FIRESTORE_EMULATOR_HOST;
    fs.rmSync(tmp, { recursive: true, force: true });
    expect(process.cwd()).toBe(cwd);
  });

  it('si la base dice apagada, vale la base aunque la copia local diga sola', async () => {
    readDataConDetalle.mockResolvedValue({ valor: { vigilante_fiestas: 'apagada' }, huboFalla: false });
    const { getReglaParaTarea } = await import('@/lib/ia/reglas-de-la-ia');
    expect(await getReglaParaTarea('vigilante_fiestas')).toBe('apagada');
  });

  it('si la base falla, usa la copia local', async () => {
    readDataConDetalle.mockResolvedValue({ valor: null, huboFalla: true });
    const { getReglaParaTarea } = await import('@/lib/ia/reglas-de-la-ia');
    expect(await getReglaParaTarea('vigilante_fiestas')).toBe('sola');
  });
});
