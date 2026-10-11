/**
 * Sustituto del NodeSDK de OpenTelemetry (`@opentelemetry/sdk-node`).
 *
 * La telemetría sigue APAGADA a propósito (ese paquete es pesado y no se mete en la compilación).
 * Pero Genkit 1.20 hace `new NodeSDK(config)`, `.start()` y, al apagarse, `.shutdown()`. Con el
 * alias en `false` el constructor no existía y la primera consulta de cada proceso nuevo caía con
 * "NodeSDK is not a constructor". Esto sólo evita que Genkit se caiga al construirla: no recoge
 * nada, no habla con ningún servidor y NO finge respuestas del modelo.
 */
class NodeSDK {
  constructor() {}
  start() {}
  shutdown() {
    return Promise.resolve();
  }
}

module.exports = { NodeSDK };
module.exports.NodeSDK = NodeSDK;
