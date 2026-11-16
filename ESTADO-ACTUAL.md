# Estado actual — 13 de noviembre de 2026

Rama de trabajo: `gemini/ordenes-282-283-entrega-completa` (fusionada con `origin/main`). Publicada: la **1401**.

## Entrega de Gemini lista para revisar
- **Órdenes 284 a 296 completas** en una sola propuesta contra `main` ("Gemini: órdenes 284 a 296"):
  - **284–287:** mapa único de navegación, enlaces seguros de cliente/invitado, calendario en hora de Uruguay, aviso de respaldo vencido o fallido y evidencia 285.
  - **288:** hora local Uruguay en publicaciones, textos de marketing sin marcadores rotos, miniaturas relativas, verificación remota de subida en `wfolio.py` (`ak-editor.zip`), deduplicación contable, freno al doble envío en invitación, tarjeta de menú en portal, confirmación `"ELIMINAR"` y ajustes en celular (390 px).
  - **289–290:** IA en dos niveles (`gemini-pro-latest` + caída a Flash y tope de 40/día), apertura rápida de `/presupuestos/nuevo`, entrega de álbum en Centro de Fiesta y carga diferida en simulador.
  - **291, 292 y 294:** detalle real de paquetes para Sofía, registro de fallos de IA, vaciado permitido de plantillas, `FieldValue.delete()` explícito en `firebase-sync.ts`, limpieza de `presupuestoId` en prospectos, recálculo de `isCeliac`, validación binaria de imágenes en buzón, lectura sin sesión en `getFiestaActivaDeHoy` y guardia `hayPresupuestoParaIA()` antes de gastar.
  - **293:** pruebas de ida y vuelta contra emulador (`ida-y-vuelta-auditor.test.ts` e `ida-y-vuelta-plata.test.ts`), relectura fresca en `revertPriceAdjustment` y recorte de `docs/ida-y-vuelta-pendientes.json`.
  - **295–296:** `desdeHoy` en `DatePickerDemo` para ambos simuladores, primer sábado futuro, descarte de fechas pasadas conservando teléfono en prospecto, separación de estado de Google Workspace en `/api/health`, y retiro de notas internas y marca repetida en `/club-uruguay`.

## Publicado hoy en `main`
- **1401 (13/11):** orden 296 y pregunta 135 con escaneo automático.
- **1399 / 1398 / 1397 / 1396 (13/11):** modo sin conexión en standalone (`/sw.js`), sesión de auditor en asistente sin romper por gasto, freno en servidor a fechas pasadas y enlaces `/entrar` y `/portal-cliente`.

## Sólo el dueño
- Prender las tareas programadas de Firebase (orden 278 bloque 1) y correr 282 desde la PC del dueño.
- 7 fiestas pasadas con $1.855.627 sin cobrar en la app: marcar en "Poner al día" lo ya cobrado.
- Decisiones pendientes: 15% de contratos nuevos (fijo o acumulativo) y huella SHA-256 para Play Store.
