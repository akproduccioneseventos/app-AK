# 123 - Factfinding de dependencias candidatas

Fecha: 2026-10-13. Base local: `09a411000ae5128fcce74a43fdaa551b94ffaac5`. `main` observado: `096f228f70a0c4da4c17582236c07363e80b3100`. El contraste de alcance de `main` (solo trivia/missions/votes/portal/socialtypes; sin cambios de dependencias) y el estado abierto de PR #1293 fueron proporcionados por el dueño. No se cambiaron dependencias.

## Alcance y límites

Se parseó `package-lock.json`, se cotejaron las copias en `node_modules` y se trazaron las rutas de dependencia con `npm explain`. Las versiones candidatas se verificaron con `npm view`; las referencias de avisos apuntan a advisories oficiales de GitHub o del mantenedor. `npm audit --json` no produjo salida durante unos 110 segundos y se interrumpió con Ctrl+C (código 1); por ello no hay un resultado actual de audit que certifique el conjunto.

Sharp 0.35.5 y Node 20.9 se excluyen: evidencia 116 ya cerró ese punto. No se repite aquí.

## Inventario

| Paquete | Copias actuales exactas | Candidato documentado | Ruta observada / nota |
|---|---|---|---|
| `dompurify` | 3.4.14 | 3.4.17 | `jspdf@4.2.1` opcional, producción. El candidato es el latest observado en npm. GHSA-p98j-92pf-mc4p cubre 3.4.13-3.4.15 y fija 3.4.16; además, GitHub muestra GHSA-6688-9rhm-gjv2 y tres advisories nuevos del 12-oct (`GHSA-c6gr-qvv4-5v3f`, `GHSA-mrv2-3pqr-j5jr`, `GHSA-cg2g-xh64-v4q7`). Sus rangos/fixes no quedaron verificables aquí. **3.4.17 no se certifica como suficiente.** [Advisories DOMPurify](https://github.com/cure53/DOMPurify/security/advisories)
| `@grpc/grpc-js` | 1.14.4 | 1.14.6 | Producción por `firebase` y `genkit`; también `firebase-tools` y reglas de Firestore en desarrollo. Último advisory listado: `GHSA-f596-whhp-79r4`; mantenedor publica también `GHSA-88h9-xgvx-hvf2`, `GHSA-m9gg-hp2v-232j`, `GHSA-99f4-grh7-6pcq`, `GHSA-5375-pq7m-f5r2`. La solicitud `~1.9.0` ya recibe override fuera de ese rango, validar compatibilidad. [Advisories gRPC](https://github.com/grpc/grpc-node/security/advisories)
| `fflate` | 0.8.2 y 0.6.10 | 0.8.3 y 0.6.11 | Ambas copias tienen ruta de producción: `jspdf@4.2.1` y `three-stdlib`. `GHSA-px8p-9vwx-vf98` fija esas líneas en 0.8.3 y 0.6.11. [GHSA-px8p-9vwx-vf98](https://github.com/advisories/GHSA-px8p-9vwx-vf98)
| `brace-expansion` | 1.1.18; cuatro copias 2.1.4; 5.0.6 | 1.1.21; 2.1.7; 5.0.12 | Rutas observadas bajo ESLint/`eslint-config-next`, `firebase-tools`, Jest/`ts-jest` y `filelist`, todas en tooling. Advisories primarios: `GHSA-q2hr-2g5m-vwhr`, `GHSA-qhr7-859c-m2p7`, `GHSA-6j4f-fj2g-mc7p`, `GHSA-rgw5-rvv9-x895`, `GHSA-mh99-v99m-4gvg`, `GHSA-3jxr-9vmj-r5cp`, `GHSA-jxxr-4gwj-5jf2`, `GHSA-f886-m6hf-6m8v`. Las líneas 1/2/5 tienen floors distintos; no forzar una sola versión. [Advisories brace-expansion](https://github.com/juliangruber/brace-expansion/security/advisories)
| `undici` | 6.27.0 | 6.29.0 | Ruta `firebase-tools > @modelcontextprotocol/sdk`, desarrollo. npm declara Node `>=18.17.0`; Node 20.9 cumple ese piso. La página del mantenedor lista diez avisos de septiembre: `GHSA-3wwx-pv8p-q78v`, `GHSA-rx4f-c7p8-82vq`, `GHSA-vp8m-p9jh-q5pm`, `GHSA-8436-99hf-9mmv`, `GHSA-w293-vg96-wgc3`, `GHSA-2gqq-gqf2-x968`, `GHSA-2jfj-6hjv-fm6j`, `GHSA-3xpg-4rpp-hhhm`, `GHSA-rfgv-xxqx-mfg5`, `GHSA-r53p-7pc4-xj5r`. Confirmar floors por advisory antes de decidir. [Advisories undici](https://github.com/nodejs/undici/security/advisories)
| `js-yaml` | 4.2.0; 3.14.2 en dos rutas | 4.3.2; 3.15.2 | Solo tooling trazado: ESLint, `firebase-tools` y Jest/`ts-jest`. `GHSA-2883-xcg3-v3hh` fija 4.x en 4.3.2 y 3.x en 3.15.2. La página del mantenedor lista además `GHSA-r3ph-w7gj-g6xm`, `GHSA-5p4m-2wfm-xmqj`, `GHSA-pm4m-ph32-ghv5`, `GHSA-g796-fgmg-93mv`, `GHSA-52cp-r559-cp3m`, `GHSA-h67p-54hq-rp68`, `GHSA-mh29-5h37-fv8m`; revisar rangos por línea. [Advisories js-yaml](https://github.com/nodeca/js-yaml/security/advisories)
| `hono` | 4.12.26 | 4.13.13 | `firebase-tools > @modelcontextprotocol/sdk`, desarrollo; latest observado en npm. `GHSA-hxh3-vqpv-xpqv` fija 4.13.7 y `GHSA-g6gw-c38x-mqfc` fija 4.13.5; también constan `GHSA-5r4p-p66f-jhc7`, `GHSA-gqvv-2mrq-wpjv`, `GHSA-crvj-82cr-hjcx`, `GHSA-f23p-vx2j-j53r`, `GHSA-79qm-7rj5-m7r9`, `GHSA-54fx-42gc-7vw4`, `GHSA-8j4g-w8fx-2239`. Candidate metadata declara Node `>=16.9.0`. [Advisories Hono](https://github.com/honojs/hono/security/advisories)
| `@hono/node-server` | 1.19.14 | 1.19.17 | `firebase-tools > @modelcontextprotocol/sdk`, desarrollo. Ojo: el rango oficial de `GHSA-frvp-7c67-39w9` es `<2.0.5`, así que 1.19.17 permanece dentro del rango publicado. El cambio a 2.0.5 es major y requiere decisión del principal; no dar por bueno 1.x con pruebas indirectas. También están listados `GHSA-rmxm-3fg6-px4f`, `GHSA-9mqv-5hh9-4cgg`, `GHSA-92pp-h63x-v22m`, `GHSA-wc8c-qw6v-h7f6`, `GHSA-hgxw-5xg3-69jx`, `GHSA-rjq5-w47x-x359`. [Advisories node-server](https://github.com/honojs/node-server/security/advisories) · [GHSA-frvp-7c67-39w9](https://github.com/advisories/GHSA-frvp-7c67-39w9)
| `qs` | 6.15.2 | 6.16.0 | Tiene rutas de producción mediante `genkit > express` y `googleapis > googleapis-common`, además de `firebase-tools`. `GHSA-4mjr-xmp4-gh2g` (<6.16.0) y `GHSA-x5fp-wj9c-mxmx` (6.14.2-6.15.3) fijan 6.16.0. Algún padre declara `~6.15.1`; 6.16.0 cruza ese límite y necesita validación explícita. [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) · [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx)

## Propuesta técnica candidata, no autorizada

```json
{
  "dompurify@<=3.4.12": "3.4.17",
  "@grpc/grpc-js@<=1.9.15": "1.14.6",
  "fflate@~0.8.2": "0.8.3",
  "fflate@^0.6.9": "0.6.11",
  "brace-expansion@<1.1.21": "1.1.21",
  "brace-expansion@>=2.0.0 <2.1.7": "2.1.7",
  "brace-expansion@>=5.0.0 <5.0.12": "5.0.12",
  "undici@>=6.0.0 <6.29.0": "6.29.0",
  "js-yaml@^3": "3.15.2",
  "js-yaml@^4": "4.3.2",
  "hono@^4": "4.13.13",
  "@hono/node-server@^1.19.9": "1.19.17",
  "qs@>=6.14.0 <6.16.0": "6.16.0"
}
```

Esto es solo una forma de registrar floors candidatos. No prueba que npm acepte cada selector en el manifiesto actual ni que cada padre sea compatible. DOMPurify tiene avisos del 12-oct sin rango/fix confirmados aquí; `@hono/node-server` 1.19.17 no sale del rango GHSA-frvp; `qs` cruza un rango `~6.15.1`. El principal debe decidir seguridad y alcance antes de cualquier cambio.

## Validación pendiente

- Comprobar en el lock regenerado todas las copias, versiones y rutas; no basta un override escrito.
- Obtener `npm audit --json` utilizable y reconciliar cada ID/rango/fix con GHSA primario; no se obtuvo en esta captura.
- Contrastar consumidores de producción para DOMPurify, fflate, gRPC y qs y consumidores de tooling para el resto; las rutas son evidencia de reachability, no prueba de uso de la función vulnerable.
- Ejecutar pruebas focalizadas de PDF, Firebase/Genkit/gRPC, js-yaml/CLI, glob/Jest/ESLint, MCP/Hono y Express/qs; todas pendientes.
- Claude compila según el reparto vigente. Sin build/tests en este factfinding y sin conclusión final de seguridad.

El JSON adjunto contiene copias/rutas por ubicación, IDs y URLs oficiales, runtimes declarados, propuesta por línea y destinos de validación.
