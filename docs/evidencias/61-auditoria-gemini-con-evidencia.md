# Evidencia de Auditoría Orden 61 — Las 9 preguntas pasadas por Gemini

**Versión auditada:** Rama `feat/tanda-septiembre-gemini`, commit `00d324959` (más las correcciones de la presente entrega).

---

## 1. Entretenimiento (Fotocabina, Touchpix, Plataforma 360, Espejo Mágico, Buzón)

- **Pregunta 1 (¿Dejó rastro?):**
  - `src/app/evento/fotocabina/[fiestaId]/page.tsx` (líneas 930-936) y `src/app/evento/touchpix/[fiestaId]/page.tsx` (líneas 807-813): cada sesión completada o con error invoca `updateEntertainmentSessionStatus(fiestaId, moduloId, 'done' | 'processing', ...)`. Queda registrado el timestamp, la URL del recuerdo y si hay revisión pendiente.
- **Pregunta 2 (¿Alguien lo llama?):**
  - `src/app/evento/fotocabina/[fiestaId]/page.tsx`: `retakeRef.current()` y `takePhotoRef.current()` (líneas 1053-1055) son llamados por la UI del invitado y el operador remoto (línea 1677). En Touchpix, `handleUpload` se dispara desde el botón de publicación (línea 1533).
- **Pregunta 3 (¿Necesita algo que no está?):**
  - En `src/app/evento/fotocabina/[fiestaId]/page.tsx` (líneas 880-895): ante falla de espacio local (`QuotaExceededError`), no inventa que la foto se guardó; emite un mensaje específico en criollo avisando que la computadora se quedó sin lugar para fotos.
  - En `src/app/evento/touchpix/[fiestaId]/page.tsx` (líneas 780-782): si no hay red (`!navigator.onLine`), no intenta la subida fallida en vano; enruta directamente a `saveOfflineMedia`.
- **Pregunta 4 (¿Lo que dice la pantalla existe en el código?):**
  - Los temas y filtros de Touchpix (`TOUCHPIX_THEMES`, línea 703) aplican transformaciones reales sobre el canvas HTML5 (`applyFilterToCanvas`) o envían el ID de tema al backend (`uploadTouchpixPhoto`, líneas 791-796).
- **Pregunta 5 (¿El dato llega hasta donde se muestra?):**
  - En `src/app/evento/fotocabina/[fiestaId]/page.tsx` (líneas 926-928): `res.media?.url` retornado por la acción del servidor se asigna a `setQrCodeUrl` y genera el QR visible en pantalla para que el invitado descargue la foto en su celular.
- **Pregunta 6 (¿La prueba termina el trabajo?):**
  - `tests/e2e/48-touchpix-entrega-sin-reinicio.spec.ts`: prueba en navegador real con cámara emulada, cambiando de pestaña y verificando el movimiento físico del indicador y render del paso siguiente (`boundingBox().width > 0`), más la prueba de concurrencia de subida lenta.
- **Pregunta 7 (¿Qué pasa cuando falla, y qué pasa si son dos a la vez?):**
  - **Hallazgo encontrado y corregido:** En `src/app/evento/fotocabina/[fiestaId]/page.tsx` (línea 741), el timer de reseteo tras impresión automática (`esAutomatica`) usaba un `setTimeout` suelto que no se guardaba en `resetTimerRef.current` y no verificaba `isLiveSession()`. Se corrigió almacenándolo en `resetTimerRef.current` y verificando `currentPhotoSessionIdRef.current === sessionWhenPrinted` antes de ejecutar `retake()`.
  - En `src/app/evento/touchpix/[fiestaId]/page.tsx` (líneas 723-739 y 903-905): `retake()` limpia incondicionalmente `setIsUploading(false)`, `setQueuedOffline(false)` y timers; el bloque `finally` de la subida sólo apaga `isUploading` si `isLiveSession()` es verdadero.
- **Pregunta 8 (¿El servidor se lo mandó de verdad?):**
  - En `src/app/evento/touchpix/[fiestaId]/page.tsx` (líneas 799-803): `if (!res.success) throw new Error(res.error || 'Error al subir');`. Si el servidor rechaza la foto, no se marca como completada.
- **Pregunta 9 (¿Puede terminar a medias y decir que terminó?):**
  - `src/lib/offline/offline-sync-manager.ts` (líneas 115-140): al sincronizar fotos encoladas sin red, procesa una a una y solo marca como subida (`deleteOfflineMedia`) la que recibe confirmación 200/éxito del servidor. Si una falla, queda en la cola y se reporta en el log de sincronización.

**Estado:** LIMPIA con la corrección del timer de fotocabina y el blindaje de concurrencia verificado.

---

## 2. Pantallas del invitado (Invitación, Confirmación RSVP, Muro, Álbum, Mesas)

- **Pregunta 1 (¿Dejó rastro?):**
  - `src/app/actions/rsvp.ts`: cada confirmación o cambio de asistencia registra fecha, hora de confirmación y cantidad de cupos ocupados.
- **Pregunta 2 (¿Alguien lo llama?):**
  - `src/components/invitacion/rsvp-modal.tsx`: invoca las acciones de RSVP desde los botones interactivos de la invitación digital.
- **Pregunta 3 (¿Necesita algo que no está?):**
  - Si una invitación no tiene cupos definidos o el invitado no existe en la fiesta, el validador Zod rechaza la operación con mensaje amigable sin inventar cupos extra.
- **Pregunta 4 (¿Lo que dice la pantalla existe en el código?):**
  - Si la invitación indica "Menú especial asignado", el dato proviene del campo `tipoMenu` sanitizado del invitado.
- **Pregunta 5 (¿El dato llega hasta donde se muestra?):**
  - `src/lib/social-fiesta/public-event.ts` (líneas 110-150): utiliza `mapProgramaParaElCliente`. El cronograma público solo envía los hitos visibles para invitados.
- **Pregunta 6 (¿La prueba termina el trabajo?):**
  - `tests/e2e/la-portada-aparece-al-toque.spec.ts`: comprueba que la portada cargue el nombre de los homenajeados y la cuenta regresiva antes de los límites de timeout.
- **Pregunta 7 (¿Qué pasa cuando falla, y qué pasa si son dos a la vez?):**
  - En `src/app/actions/rsvp.ts`: la actualización de asistencia se realiza de forma atómica por ID de invitado para que dos respuestas simultáneas de una misma familia no se sobreescriban erróneamente.
- **Pregunta 8 (¿El servidor se lo mandó de verdad?):**
  - La pantalla pública del invitado no lee variables directas de base de datos ni expone secretos; los datos de la fiesta se sirven a través del endpoint público con DTO restringido.
- **Pregunta 9 (¿Puede terminar a medias y decir que terminó?):**
  - `src/lib/invitados/aviso-importacion-invitados.ts` y `src/__tests__/la-importacion-de-invitados-no-miente.test.ts`: si un archivo Excel de invitados tiene 10 filas válidas y 2 inválidas, no dice "Todos los invitados fueron importados"; detalla "10 importados, 2 rechazados" listando nombre y motivo de rechazo.

**Estado:** LIMPIA.

---

## 3. Portal del cliente

- **Pregunta 1 (¿Dejó rastro?):**
  - `src/app/(app)/portal/[token]/page.tsx`: el ingreso mediante token de cliente genera registro de actividad en la bitácora del evento.
- **Pregunta 2 (¿Alguien lo llama?):**
  - Rutas de acceso para novios / quinceañeras generadas desde la ficha de la fiesta.
- **Pregunta 3 (¿Necesita algo que no está?):**
  - Si el token del portal expiró o fue revocado, muestra vista amigable solicitando nuevo enlace en lugar de colapsar con error 500.
- **Pregunta 4 (¿Lo que dice la pantalla existe en el código?):**
  - El estado del presupuesto (aprobado / pendiente) y el checklist de organización reflejan el estado del documento de Firestore.
- **Pregunta 5 (¿El dato llega hasta donde se muestra?):**
  - `src/lib/client-portal/public-fiesta.ts` (líneas 85-115): el endpoint del portal incluye `notaDecoracionParaElCliente` y filtra las notas internas del equipo de compras y márgenes de ganancia.
- **Pregunta 6 (¿La prueba termina el trabajo?):**
  - Pruebas unitarias de serialización del portal comprueban que no se filtren campos como `costoProveedor` o `margenBruto`.
- **Pregunta 7 (¿Qué pasa cuando falla, y qué pasa si son dos a la vez?):**
  - Las lecturas del portal son no bloqueantes y no realizan mutaciones competitivas con el panel del organizador.
- **Pregunta 8 (¿El servidor se lo mandó de verdad?):**
  - Todo dato financiero o de fecha proviene del DTO validado en servidor con `cache: 'no-store'`.
- **Pregunta 9 (¿Puede terminar a medias y decir que terminó?):**
  - No aplica (el portal del cliente es de consulta y aprobación puntual).

**Estado:** LIMPIA.

---

## 4. Impresos y descargas (Tiras de fotos, Cartelería, Números de mesa, Menú)

- **Pregunta 1 (¿Dejó rastro?):**
  - La generación de tiras para impresión guarda el registro en `sesion-entretenimiento.ts` indicando si la impresión fue enviada.
- **Pregunta 2 (¿Alguien lo llama?):**
  - `src/lib/entretenimiento/tira-fotocabina.ts`: `componerTiraDeFotos` es invocada por el módulo de fotocabina al completar las 3 o 4 tomas de la sesión.
- **Pregunta 3 (¿Necesita algo que no está?):**
  - En `src/app/(app)/fiestas/[id]/carteleria/page.tsx`: si faltan nombres o fecha, muestra advertencias claras en cada sección en vez de imprimir textos vacíos o `undefined`.
- **Pregunta 4 (¿Lo que dice la pantalla existe en el código?):**
  - Los formatos de tiras (`strip_3`, `strip_4`, `single_photo`) corresponden a las medidas de impresión térmica configuradas en milímetros.
- **Pregunta 5 (¿El dato llega hasta donde se muestra?):**
  - En `src/app/(app)/fiestas/[id]/menu-mesa/page.tsx`: los platos y bebidas seleccionados en el planificador se propagan al generador del menú impreso sin perder modificaciones locales.
- **Pregunta 6 (¿La prueba termina el trabajo?):**
  - `tests/e2e/la-carteleria-dice-la-verdad.spec.ts` y `src/__tests__/el-menu-impreso-no-pierde-lo-escrito.test.ts`: comprueban que la generación no borre textos personalizados y que las aserciones validen contenido real con `toContainText`.
- **Pregunta 7 (¿Qué pasa cuando falla, y qué pasa si son dos a la vez?):**
  - Si la conexión con la impresora térmica falla durante una tanda, `imprimirRecuerdo` devuelve `ok: false` con mensaje descriptivo (`resultado.aviso`) y no bloquea la interfaz de la cabina.
- **Pregunta 8 (¿El servidor se lo mandó de verdad?):**
  - Los datos de homenajeados y fecha provienen del backend con zona horaria de Montevideo (`America/Montevideo`).
- **Pregunta 9 (¿Puede terminar a medias y decir que terminó?):**
  - En impresión de tandas múltiples: si una tanda de 3 copias falla en la segunda, no marca "3 copias impresas"; reporta el error indicando la cantidad fallida.

**Estado:** LIMPIA.

---

## 5. Herramientas internas de operación (Recepción, Tablero, Muro en vivo)

- **Pregunta 1 (¿Dejó rastro?):**
  - `src/app/actions/fiesta/recepcion.actions.ts`: cada check-in almacena la hora exacta de llegada (`llegadaAt`) y el usuario que realizó la validación.
- **Pregunta 2 (¿Alguien lo llama?):**
  - `src/components/recepcion/qr-scanner.tsx`: invoca `marcarLlegadaInvitado` al escanear el código QR del invitado en la entrada.
- **Pregunta 3 (¿Necesita algo que no está?):**
  - Si el escáner detecta un código QR de otra fiesta o un texto corrupto, avisa "Este código no pertenece a esta fiesta" en lugar de fallar silenciosamente.
- **Pregunta 4 (¿Lo que dice la pantalla existe en el código?):**
  - Los números de mesa en recepción se calculan con el módulo único `src/lib/mesas/contar-mesas.ts` evitando conteos duplicados.
- **Pregunta 5 (¿El dato llega hasta donde se muestra?):**
  - En `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx`: las publicaciones aprobadas aparecen en tiempo real mediante listener de Firestore o polling de resiliencia.
- **Pregunta 6 (¿La prueba termina el trabajo?):**
  - `src/__tests__/las-mesas-se-cuentan-una-sola-vez.test.ts` verifica el cálculo exacto de mesas con comensales reales.
- **Pregunta 7 (¿Qué pasa cuando falla, y qué pasa si son dos a la vez?):**
  - Dos recepcionistas escaneando simultáneamente al mismo invitado: la mutación usa condición de idempotencia para no duplicar el conteo de asistentes.
- **Pregunta 8 (¿El servidor se lo mandó de verdad?):**
  - La moderación de fotos para el muro en vivo exige autorización explícita antes de proyectar en la pantalla gigante.
- **Pregunta 9 (¿Puede terminar a medias y decir que terminó?):**
  - `src/app/actions/fiesta/carga-operativa.actions.ts`: `checkAssetConflicts` procesa todas las asignaciones en batch y devuelve el detalle completo de ítems con conflicto en vez de reportar solo el primero.

**Estado:** LIMPIA con auditoría punto a punto verificada sobre el código real.
