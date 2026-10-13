/** @jest-environment node */
export {};
const Busboy = require('@fastify/busboy');
const { SourceMapConsumer, SourceNode } = require('source-map-js');

function multipart(disposition: string, extraHeader = ''): Promise<{ fields: string[]; files: string[] }> {
  return new Promise((resolve, reject) => {
    const parser = new Busboy({ headers: { 'content-type': 'multipart/form-data; boundary=ak106' } });
    const fields: string[] = [];
    const files: string[] = [];
    parser.on('field', (name: string) => fields.push(name));
    parser.on('file', (_name: string, stream: NodeJS.ReadableStream, filename: string) => {
      files.push(filename);
      stream.resume();
    });
    parser.on('error', reject);
    parser.on('finish', () => resolve({ fields, files }));
    parser.end(`--ak106\r\nContent-Disposition: ${disposition}\r\n${extraHeader}\r\ncontenido\r\n--ak106--\r\n`);
  });
}

test('multipart acepta headers llamados como propiedades del prototipo sin caerse', async () => {
  const result = await multipart('form-data; name="nombre"', 'constructor: valor\r\n__proto__: valor\r\n');
  expect(result.fields).toEqual(['nombre']);
  expect(result.files).toEqual([]);
});

test('multipart rechaza CR/LF desnudos en archivos y conserva nombres normales', async () => {
  for (const separator of ['\r', '\n']) {
    const rejected = await multipart(`form-data; name="foto"; filename="ak${separator}falso.jpg"`, 'Content-Type: image/jpeg\r\n');
    expect(rejected.files).toEqual([]);
    expect(rejected.fields).toEqual([]);
  }
  expect((await multipart('form-data; name="foto"; filename="ak.jpg"', 'Content-Type: image/jpeg\r\n')).files).toEqual(['ak.jpg']);
});

test('mapas indexados rechazan offsets enormes sin procesar millones de lineas', () => {
  const map = { version: 3, sources: ['ak.js'], sourcesContent: ['const ak = 1;'], names: [], mappings: 'AAAA' };
  expect(() => new SourceMapConsumer({ version: 3, sections: [{ offset: { line: 10000001, column: 0 }, map }] })).toThrow();
  const ordinary = new SourceMapConsumer(map);
  expect(SourceNode.fromStringWithSourceMap('const ak = 1;', ordinary).toString()).toBe('const ak = 1;');
});
