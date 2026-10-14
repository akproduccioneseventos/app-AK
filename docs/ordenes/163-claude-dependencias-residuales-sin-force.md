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
