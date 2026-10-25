jest.mock('@/lib/generic-json-store', () => {
  const turns = new Map();
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const change = (file, empty, callback) => {
    const turn = (turns.get(file) || Promise.resolve()).then(async () => {
      const io = require('@/lib/data-service');
      if (!jest.isMockFunction(io.readData) || !jest.isMockFunction(io.writeData)) {
        throw new Error('QA370 requires the original test memory IO, never real storage');
      }
      const current = await io.readData(file, empty);
      const next = await callback(clone(current));
      if (next === null) return null;
      await io.writeData(file, next);
      return clone(next);
    });
    turns.set(file, turn.catch(() => undefined));
    return turn;
  };
  return {
    mutateGenericJsonArray: (file, callback) => change(file, [], callback),
    mutarDocumento: (file, empty, callback) => change(file, empty, callback),
    mutateGenericJsonArrayConTransaccion: () => { throw new Error('QA370 unsupported transaction, no silent fallback'); },
    mutarDocumentoConTransaccion: () => { throw new Error('QA370 unsupported transaction, no silent fallback'); },
  };
});
