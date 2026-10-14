# 163 - Claude: dependencias que requieren una tanda estructural

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE: su HEAD no se conoce.
No empezar si una entrega activa ya cubre este tema. Escribir esta orden no inicia otra IA.

## Base comprobada

- Main remoto d8800936, integrado por Claude mediante PR1298; PR1297 ya cerrada.
- Dependencias125 probadas en543b7f83; conjunto final congelado en58691f22
  desde ese main, lock identico entre ambos.
  Contrastar main y tanda actual antes de programar. Codex deja listo; Claude fusiona.
- Parche compatible ya aplicado en package.json/package-lock.json: no repetirlo.
- Npm audit:86avisos unicos antes,30despues;56retirados.107entradas agregadas
  NO son107fallos de la app. Queda1critical de herramienta,19high/87moderate
  agregados; ver cada version, rango, ruta y URL primaria en
  docs/evidencias/123-dependencias-residual.json.

## Trabajo restante, sin instalar a ciegas

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

```comprobar
archivo: package.json
usa: spawn en docs/evidencias/123-ejecutar.mjs
prueba: docs/evidencias/123-deps-smoke.mjs y docs/evidencias/123-npm-audit.mjs; pendientes de repetir para la futura tanda estructural
```
