# 163 - Claude: dependencias que requieren una tanda estructural

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE: su HEAD no se conoce.
No empezar si una entrega activa ya cubre este tema. Escribir esta orden no inicia otra IA.

## Estado vigente125 - 14/10/2026 (prima sobre historial)

- Main4b6d6620/1300: CLI15.33, UUID11 y FTP6 YA integrados por Claude.
  No volver a encomendarlos. Delta125 finalb520f7ce agrega selector6.1.4:
  conserva contrato6.x, quita un aviso; otro exige7.x y sigue pendiente.
- RE21.27 probado Node24 pero RECHAZADO por engines incompatibles con Node20;
  se conserva1.24. No declarar ese candidato parcheado ni forzarlo otra vez.
- Npm42 (blobs package/lock iguales a b520):11GHSA/87entradas,
  0critical/15high/72moderate. Artefactos125-npm-audit*, no seguridad completa.
- Guardias de Claude evitan imports directos/SDKnode real, pero no certifican
  por si solas todas las cadenas transitivas. No confundir guardia con prueba
  de explotabilidad ni convertir cada entrada agregada en fallo funcional.
- Java21 portable solo para QA local (global17 intacto), CI ya21. Cuatro
  smokes y29reglas emuladas ejecutados; No despliegue/OAuth/Node20 real certificado.
- Historial debajo conserva decisiones/resultados anteriores, no es nueva
  lista de tareas. No ejecutar otra tanda estructural sin cambio verificable.

## Base historica (no reencomendar a partir de ella)

- Main remoto d8800936, integrado por Claude mediante PR1298; PR1297 ya cerrada.
- Dependencias125 probadas en543b7f83; conjunto final congelado en58691f22
  desde ese main, lock identico entre ambos.
  Contrastar main y tanda actual antes de programar. Codex deja listo; Claude fusiona.
- Parche compatible ya aplicado en package.json/package-lock.json: no repetirlo.
- Npm audit:86avisos unicos antes,30despues;56retirados.107entradas agregadas
  NO son107fallos de la app. Queda1critical de herramienta,19high/87moderate
  agregados; ver cada version, rango, ruta y URL primaria en
  docs/evidencias/123-dependencias-residual.json.

## Trabajo planteado originalmente (historico)

1. HISTORICO antes de125: firebase-tools14.27.0 conservaba tar6.2.1 interno vulnerable. El tar7 de
   node-gyp ya quedo7.5.21. No forzar tar7 en el consumidor tar6 ni degradar
   la app para silenciar el aviso. Evaluar una version oficial de Firebase CLI
   que actualice ese consumidor; comprobar Node y Java requeridos y emuladores.
   La corrida actual avisa que Firebase15 requiere Java21 o superior.
   Delta125 cambia CLI a15.33.0 y elimina tar6; Java21 portable aislado verificado
   por SHA256, sin alterar Java global17. Cuatro smokes y29pruebas de3suites
   Firestore/Storage en emuladores PASS; Node24.19.0 local, CI ya declara Java21.
   No repetirlo si ya fue integrado; aun no certifica despliegue real ni Node20.
2. Genkit1.20 y la familia OpenTelemetry contienen avisos reales. No mezclar
   core1 con core2 o instrumentaciones0.x de otros minor sin compatibilidad
   demostrada. Evaluar la familia completa desde versiones/documentacion oficiales,
   preservando contratos Gemini, aislamiento, presupuestos de uso y privacidad.
3. uuid8/9/10, procesadores legacy sin arreglo en su linea y re2 con componente
   nativo requieren revision del consumidor/API/ABI. Una version publicada o
   npm fixAvailable NO demuestra compatibilidad. Registrar por que cada cambio
   puede aplicarse o requiere otra familia/runtime.
   Delta125: RE2 nativo1.27.0 cargado/probado; selector-parser6.1.4 conserva
   su contrato6.x y quita un aviso, pero otro exige7.1.6 y sigue pendiente.
   Npm125:9avisos unicos/104entradas agregadas,0critical,19high/85moderate.
   Quedan OpenTelemetry, basic-ftp, braces, selector7, sprintf-js y uuid;
   detalle primario actual en125-npm-audit.json.gz. No equivale a9fallos de uso.

## Comprobacion

- Identificar archivo/simbolo/consumidor actuales y si el aviso afecta produccion,
  herramienta o entrada concreta; no descartarlo solo por ser dev o poco usado.
- Mantener PWA, Firebase, PDF, salon3D, fechas Uruguay, permisos y centavos.
- No usar npm audit fix --force, downgrade ciego ni anular controles de seguridad.
- Probar imports/formatos/parsers afectados y recorridos ficticios; una validacion
  amplia del conjunto congelado. No tocar cuentas/datos/cargos/mensajes reales.
- Registrar SHA, resultados y avisos residuales; no certificar0avisos ni0errores
  solo porque la compilacion pase. Los rojos de GitHub por facturacion no son estos avisos.

Las pruebas existentes que siguen abajo prueban el parche compatible123, NO
son certificado del trabajo estructural pendiente. Para una nueva tanda adaptar
sus casos y ejecutarlos sobre el SHA nuevo antes de afirmar entrega.

## Cierre 14/10/2026

- basic-ftp 5.3.1 a 6.2.3 (override; get-uri sólo usa `Client`, cuya interfaz no cambió). Avisos
  únicos 13 a 12.
- Los 12 que quedan no llegan a la app publicada, y la prueba de abajo lo hace cumplir:
  OpenTelemetry vive debajo de `@opentelemetry/sdk-node`, que la compilación reemplaza por
  `src/lib/telemetria-apagada-node-sdk.js`, y de los plugins de telemetría de Genkit, que nadie
  importa; braces, sprintf-js, re2 y postcss-selector-parser son de tailwind, jest y el emulador.
- Sacarlos del todo pide Genkit con OpenTelemetry 2, tailwind 4 y jest nuevo: cambios mayores
  que no arreglan nada que hoy corra en el servidor. No se hacen sin un pedido.

```comprobar
archivo: package.json
usa: spawn en docs/evidencias/123-ejecutar.mjs
prueba: src/__tests__/los-avisos-de-dependencias-no-llegan-a-la-app.test.ts
```

## Resultado 14/10/2026

Hecho sin `npm audit fix --force`, sin bajar versiones y sin tocar firebase,
firebase-admin, next ni react. `tsc --noEmit` en cero; pruebas de reglas de la
base (`npm run test:rules`, 29 de 29) en verde con el emulador nuevo.

Que se aplico:
- **firebase-tools 14.27.0 a 15.33.0** (solo herramienta de desarrollo). Trae
  su `tar` ya corregido: desaparece el unico aviso critico. El contenedor tiene
  Java 21, asi que los emuladores corren (probado con `test:rules`).
- **uuid**: la app no lo usa directo; lo piden genkit, firebase-admin y otras
  librerias, todas con `v4()` (nombrado, sin buffer). Se agrego en `overrides`
  `"uuid@<11.1.1": "11.1.1"`, que sigue teniendo export nombrado y version
  para `require`. Con eso salen tambien firebase-admin, firestore, storage,
  gax, gaxios, googleapis y logging de la lista de avisos.
- Por arrastre salieron `stream-json`, `csv-parse` y `retry-request`.

Que quedo y por que:
- **Genkit 1.20 / OpenTelemetry**: genkit 1.42 (la ultima estable) sigue
  pidiendo OpenTelemetry 1.25/0.52, o sea las mismas versiones con aviso. La
  correccion esta en OpenTelemetry 2.x, otra familia mayor; mezclarla con
  genkit rompe el contrato. No se toca `src/ai/`. Queda a la espera de un
  genkit que suba OpenTelemetry.
- **braces / micromatch / fast-glob / next-pwa / tailwind / eslint-config-next**:
  no existe version corregida de `braces` (la ultima, 3.0.3, es la afectada).
  Son herramientas de compilacion, no corren en el servidor.
- **sprintf-js / jest / ts-jest**: tampoco hay version corregida de `sprintf-js`;
  solo pruebas.
- **basic-ftp (firebase-tools)**: la correccion es un salto mayor (5 a 6) dentro
  de proxy-agent, sin compatibilidad demostrada; solo herramienta de desarrollo.
- **re2** (opcional de superstatic, nativo): la 1.27 exige Node 22.22.2 o mas
  y npm la descarta como opcional; forzarla sacaba el modulo. Se deja 1.24.
- **postcss-selector-parser**: la correccion es 7.x, mayor, dentro de tailwind 3.

Avisos de `npm audit` (entradas): antes 1 critico / 20 altos / 87 moderados
(108); despues 0 / 20 / 71 (91). Unicos (GHSA): 30 a 13. Siguen quedando altos
de produccion (OpenTelemetry via genkit), por eso la linea `prueba:` del bloque
comprobar no se cambia.
