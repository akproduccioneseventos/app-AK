# Ya resuelto — NO lo vuelvas a reportar ni a "arreglar"

## 24/11/2026 - Órdenes 339 y 340 (Auditor robot en emuladores y alineación de modelos IA)

- **Orden 339 (Auditor robot sobre emuladores):** Se agregó el proyecto `auditor-robot` en `playwright.config.ts` junto con `tests/robot/sembrar.ts`, `tests/robot/reglas.ts`, `tests/robot/pdf-inspector.ts`, `tests/robot/las-reglas-del-robot.spec.ts`, `docs/robot-excepciones.json`, `scripts/robot-correr.mjs` (`npm run robot:todo`), `scripts/robot-puerta.mjs` y su integración en `scripts/lista-de-cierre.mjs` y `scripts/se-puede-publicar.mjs`, además de la prueba de los 4 casos rotos (`src/__tests__/el-robot-marca-rojo-lo-que-encontro-el-auditor.test.ts`).
  - **Por qué se eligió así:** El robot trabaja únicamente contra el emulador local (`FIRESTORE_EMULATOR_HOST`, `demo-ak-producciones`) con la sesión limpia para no tocar datos reales ni cuota de IA. Corre en tandas de 25 rutas (`ROBOT_BATCH_SIZE=25`, `ROBOT_WORKERS=2`) reiniciando `next start` entre tandas y acumulando parciales en memoria antes de consolidar `test-results/robot/resultados.json`, porque un único servidor se colgaba pasada la mitad de las 152 rutas y Playwright vacía `test-results/` al iniciar cada lote. En `tests/robot/pdf-inspector.ts` usa carga dinámica de `pdfjs-dist` con respaldo estructural porque en este entorno sin red no corrió `npm install` (ejecutar `npm install` fuera del sandbox para habilitar el análisis completo de texto PDF).
  - **Foto inicial (sin tocar pantallas de la app, según la orden):** `LISTA DE CIERRE: 537 casilleros en rojo o sin mirar (de 1672)` (`456` visuales `sin-mirar`, `1135` `robot:verde`, `81` `robot:rojo`, `0` `robot:sin-mirar`; `147/152` rutas terminadas, `148` guardadas en `resultados.json` y `4` sin guardar tras superar `120s` junto con `/`: `/evento/totem/[fiestaId]/[totemId]`, `/landing/eventos`, `/portal/[fiestaId]/decoracion`, `/q/[fiestaId]`). Fallas detectadas para atender después: `65` errores HTTP 500 en consola bajo emulador, `5` de persistencia ida y vuelta (`/asistente`, `/empresa/landing-editor`, `/empresa/salones`, `/empresa/salones/[id]/croquis`, `/empresa/salones/[id]/diseno`), `3` de `lectura-fallida-no-es-cero` (`/customers`, `/empresa/contabilidad`, `/empresa/contabilidad/reportes`), `2` de contexto (`/evento/actual/mesa` enlace vacío y `/portal-invitado/[fiestaId]/[guestId]`), `2` errores de cámara en `/evento/bogue/[fiestaId]`, error RSC en `/empresa/presentacion-led/configuracion`, error React #419 en `/portal/c/[accessKey]` y error fetch/CORS en `/enlaces`.

- **Orden 340 (Modelos Gemini centralizados e instructivo Jules):** Se creó `src/ai/modelos.ts` con `MODELOS_GEMINI` (`googleai/gemini-4-hydrogen` primero en `texto`, sin variantes pagas `carbon`/`argon`/`neon`), `esErrorModeloRetirado`, `esErrorCuotaIA` e `isRecoverableGeminiModelError`. Se migraron `src/ai/genkit.ts`, `src/lib/asistente/voz-en-vivo.ts`, `src/lib/asistente/voz-gemini.ts` y `src/lib/asistente/whatsapp-media.ts` (quitando el uso directo de `models/gemini-2.5-flash:generateContent` para usar `generateWithGeminiFallback` y registrar fallos con `anotarFalloIA('gemini-modelo-retirado', ...)`). Se agregó `docs/jules/tarea-diaria.md` y la prueba `src/__tests__/los-modelos-de-ia-tienen-respaldo.test.ts`.
  - **Por qué se eligió así:** Centralizar el catálogo de modelos y sus criterios de respaldo en un único archivo evita versiones viejas o pagas dispersas y garantiza caída ordenada ante modelos retirados.

## 23/11/2026 - La lista de fiestas no se cae por un documento raro (auditoría general)

- En producción, `/eventos` y ocho pantallas más daban error. Se arreglaron los tres puntos donde un solo documento raro tiraba la lectura entera: las fechas de la base (Timestamp) ahora salen como texto, el documento sin su número toma el de la base, y ordenar el historial no se cae con una fiesta sin `configuracion`. La colección entera tiene 15 s en vez de 3,5. **La causa exacta en producción no se pudo medir** (sin registros del servidor); si sigue, la orden 337 hace que el error diga el motivo.
- `/fiestas/nueva` se caía con una fiesta sin invitados estimados: ahora muestra 0.

## 24/11/2026 - El recorrido no confunde "evento no encontrado" con pantalla rota
- Cinco pantallas públicas (mi mesa, red social, encuesta, confirmar asistencia y video de vida) explican bien que el enlace no sirve, pero el recorrido sólo aceptaba "no encontrado" y no "no encontramos" ni "no está disponible", y la encuesta y la confirmación no lo mostraban como título o aviso. Se amplió la regla y esas dos marcan el cartel como aviso/título.

## Auditoría funcional del 23/11/2026 → orden 338 (Gemini)
- 15 hallazgos de la prueba en la app publicada, ubicados en el código y pasados a la orden 338; preguntas 218 a 226, seis con escaneo automático. **H14 (el manual arranca con 10% de descuento) no es un error**: es la promoción del dueño; la orden sólo pide que la línea se vea. Los datos "PRUEBA" que dejó el auditor no se borran en masa.

```comprobar
prueba: src/__tests__/la-lista-de-fiestas-no-se-cae-por-un-documento-raro.test.ts
usa: aObjetoPlano en src/lib/firebase-sync.ts
```

## 23/11/2026 - Revisión de la entrega 1464 (orden 335)
