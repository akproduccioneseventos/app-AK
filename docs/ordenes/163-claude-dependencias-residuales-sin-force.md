# 163 - Claude: dependencias que requieren una tanda estructural

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE: su HEAD no se conoce.
No empezar si una entrega activa ya cubre este tema. Escribir esta orden no inicia otra IA.

## Base comprobada

- Main publico096f228f integrado en el candidato; propuestaPR1293 abierta,
  ultima cabeza remota contrastada09a411000ae5128fcce74a43fdaa551b94ffaac5.
- Codigo candidato34f45fbb1a75b7ddc92edadc7831d55f098a9cdb; contrastar
  main y la tanda actual de Claude antes de programar. Codex deja listo; Claude fusiona.
- Parche compatible ya aplicado en package.json/package-lock.json: no repetirlo.
- Npm audit:86avisos unicos antes,30despues;56retirados.107entradas agregadas
  NO son107fallos de la app. Queda1critical de herramienta,19high/87moderate
  agregados; ver cada version, rango, ruta y URL primaria en
  docs/evidencias/123-dependencias-residual.json.

## Trabajo restante, sin instalar a ciegas

1. firebase-tools14.27.0 conserva tar6.2.1 interno vulnerable. El tar7 de
   node-gyp ya quedo7.5.21. No forzar tar7 en el consumidor tar6 ni degradar
   la app para silenciar el aviso. Evaluar una version oficial de Firebase CLI
   que actualice ese consumidor; comprobar Node y Java requeridos y emuladores.
   La corrida actual avisa que Firebase15 requiere Java21 o superior.
2. Genkit1.20 y la familia OpenTelemetry contienen avisos reales. No mezclar
   core1 con core2 o instrumentaciones0.x de otros minor sin compatibilidad
   demostrada. Evaluar la familia completa desde versiones/documentacion oficiales,
   preservando contratos Gemini, aislamiento, presupuestos de uso y privacidad.
3. uuid8/9/10, procesadores legacy sin arreglo en su linea y re2 con componente
   nativo requieren revision del consumidor/API/ABI. Una version publicada o
   npm fixAvailable NO demuestra compatibilidad. Registrar por que cada cambio
   puede aplicarse o requiere otra familia/runtime.

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

```comprobar
archivo: package.json
usa: spawn en docs/evidencias/123-ejecutar.mjs
prueba: docs/evidencias/123-deps-smoke.mjs y docs/evidencias/123-npm-audit.mjs; pendientes de repetir para la futura tanda estructural
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
