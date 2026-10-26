import fs from'node:fs';import assert from'node:assert/strict';import{fileURLToPath}from'node:url';
const dir=new URL('./',import.meta.url),source='d4c69f2b2395ad3abcaee4fb166bcefbdc1457e0';
const read=name=>JSON.parse(fs.readFileSync(new URL(name,dir),'utf8'));
const build=read('680-entorno.json'),unit=read('681-canonical.json'),native=read('682-nativos.json'),sequence=read('684-secuencia.json');
for(const r of[build,unit,native,sequence])assert.equal(r.source,source);
assert.equal(build.buildExit,0);assert.equal(build.sourceDiff,'');assert.equal(unit.phase,'passed');assert.equal(unit.diff,'');assert.equal(unit.counts.fail,0);assert.equal(unit.counts.pending,0);
assert.equal(native.phase,'passed');assert.equal(native.diff,'');assert.equal(native.counts.total,22);assert.equal(native.counts.fail,0);assert.equal(native.officialTitle.exit,0);assert(sequence.finished);
const rows=native.cases.map(c=>`| ${c.name} | PASS |`).join('\n');
const text=`# Cierre tecnico comprobado - 26/10/2026

Fuente congelada: ${source}. Propuesta1363 complementaria de1362, no main.
No fusionada ni desplegada por Codex. Cambios privados NO CONTRASTADOS.

## Dictamen

La matriz de aceptacion de esta entrega queda aprobada: compilacion con tipos
y lint, bateria canonica completa y veintidos comprobaciones de navegador.
Esto NO es un certificado de cero errores en todo contexto ni una prueba de
cada boton en cada rol. No se infiere produccion a partir de un entorno local.

## Resultado sobre la misma fuente

- Build680 exit0, tipos/lint incluidos; acentos exit0; fuente sin cambios QA.
- Canonica681: ${unit.counts.suites}suites, ${unit.counts.pass}PASS,
  ${unit.counts.fail}FAIL, ${unit.counts.pending}omitidas. No suma intentos viejos.
- Navegador682: ${native.counts.pass}/${native.counts.total}PASS.
- Prueba oficial buzon-titulo-legible.spec.ts ejecutada SIN modificar en PC
  y Pixel7 por Playwright683; no basta con que el archivo exista.
- Audios de videos importados y capturados decodificados con FFmpeg y RMS>0.01.
  Entrada sintetica canvas/tono; grabador y codecs reales del navegador.

## Correcciones

1. Perfiles explicitos invalidos ya no heredan permisos por role admin antiguo.
2. Un fallo de WebAudio no se presenta como video importado exitoso y mudo.
3. Captura vacia/indecodificable no se ofrece como VideoGrabado; error y reintento.
4. Cuenta regresiva unica distingue vista previa de grabacion activa y se limpia.
5. Tema oscuro local coherente: titulos, campos, texto escrito, reintento, envio y
   pie con contraste; carga y error tambien conservan tokens compatibles.677
   confirmo el fallo de formulario;678/679 fueron SOLO prototipos DOM.682 y683
   ejecutan el codigo real sin esos cambios de diagnostico (prototype=false).
6. Test antiguo de administrador usa el perfil real dueno y conserva el caso
   negativo de perfil inventado. NO se amplio el permiso para hacer pasar el test.

## Recorridos observados

| Criterio | Resultado |
| --- | --- |
${rows}

## Recuento historico, sin volver a empezar

Se conserva el recuento253/650 de la propuesta1361: catorce areas con auditoria
documentada, inventario421rutas y siete perfiles. Ese inventario NO equivale a
aceptacion funcional por control. Libro640 historico258claves:211PASS/11FAIL/
36SKIP, dosMuro adicionales. No se reescriben esos recibos ni se suman a681.
Las omisiones por guardas y los oraculos viejos no se convierten en funciones
inexistentes. Los cierres de contratos, dinero, comida, portales, redes,
planificacion, personal, tareas y entretenimiento conservan su SHA y alcance.

Los defectos concretos229/230/231 se contrastaron con2b17 antes de reparar;
no se reimplemento lo ya entregado por Gemini. Esta entrega agrega las
fronteras y regresiones que faltaban y documenta el delta, no otra app entera.

## Limites y transparencia

No se probaron proveedores/cuentas reales, modelo o voz externos, Hosting,
equipos fisicos ni una instalacion npm-ci limpia. Dependencias reutilizadas:
estree instalado1.0.8 frente a lock1.0.9. No se agregaron dependencias productivas.
El grafo se actualizo sin LLM tras los nuevos helpers; parse warnings no se
confunden con errores de TypeScript. No se reconstruye por archivos de evidencia.

Los errores propios de QA permanecen:654/657 interrupciones por cambios propios;
658 galeria publica vaciada indebidamente;656 cleanup previo al snapshot SOLO
en copiaQA restaurada;660 entornoJSON/dummy,664 emulador inexistente y sin
reciclado de workers;663 selector con mayusculas incorrectas.665 confirma el
protocolo canonico correcto,668 la subida y el defecto real de contraste.
Estos intentos NO son bugs adicionales ni se usan como aprobacion del fuente actual.

Sin cuentas, cobros, mensajes o fotos humanas enviados. No se detuvieron
procesos de otras IA. Los rojos de facturacion GitHub no son diagnostico de app.
La revision/fusion sigue en manos de Claude/el dueno.
`;
const out=new URL('685-cierre-comprobado.md',dir);assert(!fs.existsSync(out));fs.writeFileSync(out,text);console.log(JSON.stringify({source,unit:unit.counts,native:native.counts,report:fileURLToPath(out)}));
