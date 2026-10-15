import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const read=name=>JSON.parse(fs.readFileSync(`docs/evidencias/${name}.json`));
const source='b520f7cee28546634e1c87391efd7a80e1a40f48';
const templates=read('126-plantillas-native'),decoration=read('126-decoracion-native');
const cleanup=read('126-entorno-detenido'),sdk=read('126-limpieza-sdk'),fixture=read('126-fixtures-execution');
const registry=read('126-registro-jest');
assert.equal(templates.applicationSourceSha,source);assert.equal(decoration.applicationSourceSha,source);
assert.equal(templates.gate,'DEFECT_REPRODUCED');assert.equal(decoration.gate,'DEFECT_REPRODUCED');
const cases=[...templates.results,...decoration.results];
assert.equal(cases.length,8);assert.equal(cases.filter(x=>x.status==='FAIL').length,4);
assert.equal(cases.filter(x=>x.status==='PASS').length,4);
assert.ok(templates.results.filter(x=>x.status==='FAIL').every(x=>x.samePayload&&x.originalIdRetained&&x.afterReload.length===2));
assert.equal(registry.numPassedTests,3);assert.equal(registry.numFailedTests,0);
assert.equal(cleanup.bytesRestored,true);assert.equal(cleanup.total,0);assert.deepEqual(cleanup.listeners,[]);
assert.equal(sdk.total,0);assert.equal(fixture.status,'finished');
assert.equal(read('125-build-execution').sha,source);
assert.equal(read('125-build-execution').exitCode,0);
const paths=['src/app/actions/invitacion-digital-templates.ts','src/app/(app)/settings/templates/invitaciones/page.tsx','src/app/portal/[fiestaId]/decoracion/page.tsx'];
const main='4b6d66201cf9828f7a5328a8640e82f8eb291f5a';
const blobs=paths.map(file=>{
  const get=ref=>execFileSync('git',['rev-parse',`${ref}:${file}`],{encoding:'utf8'}).trim();
  const a=get(main),b=get(source);assert.equal(a,b);return {file,mainBlob:a,sourceBlob:b};
});
fs.writeFileSync('docs/evidencias/126-aceptacion.json',JSON.stringify({applicationSourceSha:source,mainSha:main,blobs,
  gate:'AUDIT_126_TWO_OPEN_DEFECTS',allAppCertified:false,applicationEdited:false,fixVerified:false,
  nativeScenarios:8,passed:4,failed:4,uniqueDefects:2,registryTestsPassed:3,acentos:{exitCode:0,filesReviewed:2906},
  buildReusedFrom125:true,privateClaudeHead:'NO_CONTRASTADO',realAccounts:false,hardware:false,
  dataRestored:cleanup.bytesRestored,sdkRemaining:sdk.total,ownedListenersRemaining:cleanup.listeners,
  next:'Gemini implementa orden164, Claude valida nuevo SHA y fusiona; orden163 residual sigue vigente.'},null,2)+'\n');
const prefix=`## Actualizacion de auditoria126 - dos fallos pendientes de Gemini\n\n`+
  `Gemini programa por nueva orden del dueno; Codex solo reviso/probo/documento.\n`+
  `Esta subida NO corrige la app ni certifica lanzamiento. Fuente app sigue ${source}.\n`+
  `- Crear plantilla, perder respuesta despues del guardado y reintentar crea dos copias.\n`+
  `- Boton Quiero cambiar algo en decoracion casi invisible: contraste real1.2016.\n`+
  `- Ocho casos nativos PC/Pixel7: cuatro controles PASS, cuatro FAIL de esos dos defectos.\n`+
  `- Orden164 y evidencia126 adjuntas; no repetir125 ni tratar borrador Jest descartado como prueba.\n`+
  `- Control del registro3tests PASS; acentos2906 PASS; SDK0, bytes restaurados, servicios/agentes cerrados.\n`+
  `- NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE. Claude fusiona, Codex no.\n\n`;
fs.writeFileSync('docs/evidencias/126-pr-description.md',prefix+fs.readFileSync('docs/evidencias/125-pr-description.md','utf8'));
console.log(JSON.stringify({gate:'AUDIT_126_TWO_OPEN_DEFECTS',source,uniqueDefects:2,deliveryPrepared:true}));
