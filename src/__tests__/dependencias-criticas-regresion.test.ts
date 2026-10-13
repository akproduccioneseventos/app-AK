/** @jest-environment node */
import Handlebars from 'handlebars';

const proxyAddr = require('proxy-addr');
const marker = '__akAstExecuted';

afterEach(() => { delete (globalThis as Record<string, unknown>)[marker]; });

test('Handlebars rechaza un AST con expresion ejecutable y conserva plantillas normales', () => {
  const loc = { start: { line: 1, column: 0 } };
  const ast = {
    type: 'Program', loc,
    body: [{
      type: 'BlockStatement', loc,
      path: { type: 'PathExpression', data: false, depth: 0, parts: ['missingHelper'], original: 'missingHelper', loc },
      params: [],
      program: {
        type: 'Program', loc,
        blockParams: { length: `(() => { globalThis.${marker} = true; return 1; })()` },
        body: [],
      },
      openStrip: { open: false, close: false }, inverseStrip: { open: false, close: false },
      closeStrip: { open: false, close: false },
    }],
  };
  expect(() => Handlebars.compile(ast as unknown as string)({})).toThrow();
  expect((globalThis as Record<string, unknown>)[marker]).toBeUndefined();
  expect(Handlebars.compile('Hola {{nombre}}')({ nombre: 'AK' })).toBe('Hola AK');
});

test('proxy-addr no confia en cualquier IPv4 por una mascara IPv6 abreviada', () => {
  const invalidSubnet = proxyAddr.compile('::ffff:10.0.0.0/8');
  expect(invalidSubnet('192.0.2.1')).toBe(false);
  const mappedSubnet = proxyAddr.compile('::ffff:10.0.0.0/104');
  expect(mappedSubnet('10.23.42.1')).toBe(true);
  expect(mappedSubnet('192.0.2.1')).toBe(false);
  expect(proxyAddr.compile('10.0.0.0/8')('10.23.42.1')).toBe(true);
});
