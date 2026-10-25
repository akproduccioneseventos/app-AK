import fs from 'node:fs';import assert from 'node:assert/strict';
let code=fs.readFileSync(new URL('433-leer-respuestas-traza.mjs',import.meta.url),'utf8');
const excluded=";if($s.request.url -notmatch '/simulador-de-presupuesto|/evento/fotocabina/'){continue}";
assert(code.includes(excluded));code=code.replace(excluded,'').replaceAll('433','434');
const file=new URL('434-parser-generado.mjs',import.meta.url);assert(!fs.existsSync(file));fs.writeFileSync(file,code);await import(file.href);
