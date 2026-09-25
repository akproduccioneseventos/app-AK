# Encuestas y guias - revalidacion 25/09/2026
Main2c652dddeaf33e4d709256a60a57ceac6376a225, sin cambio respecto de tanda anterior.
Solo correcciones historicas PF01/PF02/PF03/GUI01, sin nuevas mejoras81.
Sonda AST con funciones reales, persistencia y sesion simuladas; conTopeDeEspera sustituido por identidad (NO prueba timeout).7 casos:6 PASS/1 FAIL. No navegador/build/Firebase/WhatsApp real.

## Aprobaciones acotadas
- PF01: envio normal termina, envio rechazado avisa y libera estado ocupado.
- PF03: nota99 rechazada; googleReviewRequested enviado por cliente no pasa a encuesta saneada.
- PF02 local: dos respuestas con un mismo mutex se conservan.
- GUI01: handler actual de playbooks ante success:true+historialNoAnotado muestra aviso "No vuelvas a aplicarla", cierra dialogo y libera ocupado. Una llamada, sin reintento automatico.
Esto descarta interpretar la sonda historica que reintentaba forzosamente como reproduccion de la UI actual. No certifica idempotencia del backend ante repeticion manual, ni concurrencia de aplicar guias.

## PF02 parcial: dos servidores pierden una respuesta
src/app/actions/feedback.ts saveFeedback sigue leyendo/escribiendo lista entera dentro de turnoDeEncuestas, mutex local.
Dos instancias con mutex independiente y almacen compartido: dos success:true, una encuesta guardada. Una instancia: dos guardadas.
Consumidor verificado: src/app/feedback/[fiestaId]/page.tsx handleSubmit llama saveFeedback.
Es intercalado reproducido con almacenamiento simulado, no perdida constatada en produccion.
Claude, integridad de datos: persistir alta individual o mutacion atomica del almacen correspondiente, no agregar otro mutex local. Mantener validacion y rate limit. Probar dos instancias, errores de guardado y aislamiento de fiesta; definir idempotencia para reenvio de una misma respuesta sin descartar opiniones distintas.
La peticion de resena ocurre antes del guardado: no alterar mensajes ni prometer deduplicacion externa con estos tests; al tocar persistencia comprobar efectos de reintento con proveedor simulado. No enviar mensajes reales.

## Evidencia y limites
docs/evidencias/postfiesta-guias-2c652dd.cjs y -resultados.json.
Primeras ejecuciones de adaptacion carecian de isSubmitting/conTopeDeEspera; fallos del harness, NO de la app, excluidos de resultados finales.
No reabrir PF01/PF03 ni pedir repetir GUI01 antiguo sin reproducir nuevo problema.
Codigo app sin cambios; no merge. Registrar como correccion parcial, no encuesta integral certificada.
Prueba integrada siguiente PROPUESTA/PENDIENTE.

```comprobar
archivo: src/app/actions/feedback.ts
usa: saveFeedback en src/app/feedback/[fiestaId]/page.tsx
prueba: src/__tests__/encuestas-dos-servidores-no-pierden-respuestas.test.ts
```
