import {fileURLToPath,pathToFileURL} from 'node:url';import path from 'node:path';import fs from 'node:fs';import assert from 'node:assert/strict';
const dir=fileURLToPath(new URL('./',import.meta.url));assert(!fs.existsSync(path.join(dir,'472-ejecucion.json')));
await import(pathToFileURL(path.join(dir,'470-preparar-tres-controles.mjs')).href);
await import(pathToFileURL(path.join(dir,'471-sdk-emuladores.mjs')).href);
