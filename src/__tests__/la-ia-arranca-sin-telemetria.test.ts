/** @jest-environment node */
import path from 'path';

// La primera consulta de la IA de un proceso nuevo caía con "NodeSDK is not a constructor":
// el alias de next.config.js dejaba el paquete en `false`.
function aliasDelSdk(): unknown {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nextConfig = require('../../next.config.js');
  const webpack = {
    NormalModuleReplacementPlugin: class {},
    DefinePlugin: class {},
    IgnorePlugin: class {},
    ProvidePlugin: class {},
  };
  const cfg = nextConfig.webpack(
    { resolve: { alias: {} }, plugins: [], module: { rules: [] }, ignoreWarnings: [], externals: [], output: {}, optimization: {} },
    { isServer: true, dev: false, buildId: 'test', webpack, config: { ...nextConfig, pageExtensions: ['tsx', 'ts'] }, dir: process.cwd() },
  );
  return cfg.resolve.alias['@opentelemetry/sdk-node'];
}

describe('la IA arranca sin telemetría', () => {
  it('el alias del NodeSDK no es false: apunta a un archivo con constructor', () => {
    const alias = aliasDelSdk();
    expect(alias).not.toBe(false);
    expect(typeof alias).toBe('string');
    expect(path.isAbsolute(alias as string)).toBe(true);
  });

  it('new NodeSDK({}) no tira y tiene start/shutdown, como los llama Genkit', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NodeSDK } = require(aliasDelSdk() as string);
    expect(typeof NodeSDK).toBe('function');
    const sdk = new NodeSDK({ spanProcessors: [] });
    expect(typeof sdk.start).toBe('function');
    expect(() => sdk.start()).not.toThrow();
    await expect(sdk.shutdown()).resolves.toBeUndefined();
  });
});
