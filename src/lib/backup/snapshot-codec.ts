export const SNAPSHOT_CHUNK_BYTES = 450_000;

export interface EncodedSnapshotChunk {
  index: number;
  content: string;
}

export function encodeSnapshotValue(
  value: unknown,
  chunkBytes = SNAPSHOT_CHUNK_BYTES,
): EncodedSnapshotChunk[] {
  if (!Number.isInteger(chunkBytes) || chunkBytes <= 0) {
    throw new Error('El tamano del bloque de respaldo debe ser mayor que cero.');
  }

  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error('El valor del respaldo no se puede serializar.');
  }

  const bytes = Buffer.from(serialized, 'utf8');
  const chunks: EncodedSnapshotChunk[] = [];

  for (let offset = 0, index = 0; offset < bytes.length; offset += chunkBytes, index += 1) {
    chunks.push({
      index,
      content: bytes.subarray(offset, offset + chunkBytes).toString('base64'),
    });
  }

  return chunks.length > 0 ? chunks : [{ index: 0, content: '' }];
}

export function decodeSnapshotValue(chunks: EncodedSnapshotChunk[]): unknown {
  if (chunks.length === 0) {
    throw new Error('El respaldo no contiene bloques para restaurar.');
  }

  const ordered = [...chunks].sort((a, b) => a.index - b.index);
  ordered.forEach((chunk, expectedIndex) => {
    if (chunk.index !== expectedIndex) {
      throw new Error('El respaldo esta incompleto o tiene bloques fuera de orden.');
    }
  });

  const serialized = Buffer.concat(
    ordered.map((chunk) => Buffer.from(chunk.content, 'base64')),
  ).toString('utf8');

  return JSON.parse(serialized);
}
