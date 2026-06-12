import { decodeSnapshotValue, encodeSnapshotValue } from '@/lib/backup/snapshot-codec';

describe('snapshot codec', () => {
  it('preserves data across multiple chunks', () => {
    const value = {
      cliente: 'Maria Nunez',
      notas: 'Cumpleanos con salon y musica',
      items: Array.from({ length: 20 }, (_, index) => ({ index, nombre: `Servicio ${index}` })),
    };

    const chunks = encodeSnapshotValue(value, 40);

    expect(chunks.length).toBeGreaterThan(1);
    expect(decodeSnapshotValue([...chunks].reverse())).toEqual(value);
  });

  it('rejects incomplete chunk sequences', () => {
    const chunks = encodeSnapshotValue({ items: Array.from({ length: 20 }, (_, index) => index) }, 20);

    expect(() => decodeSnapshotValue(chunks.slice(1))).toThrow('incompleto');
  });
});
