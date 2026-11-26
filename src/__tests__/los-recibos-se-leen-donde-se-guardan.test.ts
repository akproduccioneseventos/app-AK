import fs from 'node:fs';
import path from 'node:path';

describe('Orden 357 — Los recibos del personal se leen del mismo lugar donde se guardan', () => {
  it('personal-recibos.json no está mapeado en FILE_TO_COLLECTION de firebase-sync', () => {
    const syncSrc = fs.readFileSync(path.resolve(__dirname, '../lib/firebase-sync.ts'), 'utf8');
    expect(syncSrc).not.toMatch(/'personal-recibos\.json'\s*:\s*'personal_recibos'/);
  });

  it('recibos-personal lee con readData y guarda en json_documents vía mutateGenericJsonArray', () => {
    const recibosSrc = fs.readFileSync(path.resolve(__dirname, '../app/actions/recibos-personal.ts'), 'utf8');
    expect(recibosSrc).toContain("readData<Partial<ReciboFirmado>[]>(RECIBOS_PERSONAL_FILE");
    expect(recibosSrc).toContain("mutateGenericJsonArray<Partial<ReciboFirmado>>(RECIBOS_PERSONAL_FILE");
  });
});
