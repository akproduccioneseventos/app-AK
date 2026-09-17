# Evidencia de Auditoría Orden 61 — Las 9 preguntas pasadas por Gemini

**Versión auditada:** Rama `feat/entretenimiento-sesion-segura`, commit actual sobre el que se corre la verificación.

---

## 1. Entretenimiento (Fotocabina, Touchpix, 360, Espejo Mágico, Buzón)

- **Pregunta 8 (Concurrencia, turnos y estado compartido):**
  - `src/app/evento/touchpix/[fiestaId]/page.tsx` (líneas 723-728): `retake()` limpia incondicionalmente `setIsUploading(false)`, `setQueuedOffline(false)` y cancela `resetTimerRef.current`. Nadie hereda el cartel ni los timers de la persona anterior.
  - `src/app/evento/touchpix/[fiestaId]/page.tsx` (líneas 814, 837 y 875): `setShowSuccess(true)`, `setQueuedOffline(false)` y `setQueuedOffline(true)` se ejecutan únicamente si `isLiveSession()` sigue siendo verdadero. Si la subida de A termina tarde cuando B ya está en pantalla, no le altera el estado a B.
  - `src/app/evento/touchpix/[fiestaId]/page.tsx` (línea 903) y `src/app/evento/fotocabina/[fiestaId]/page.tsx` (línea 997): el bloque `finally` de la subida apaga `isUploading` únicamente si `if (isLiveSession())`. Si B ya empezó su propia subida, la finalización de A no le apaga el cartel a B.
  - `src/app/evento/fotocabina/[fiestaId]/page.tsx` (líneas 1021-1026): `retake()` apaga incondicionalmente `setIsUploading(false)` y cancela `resetTimerRef.current`.
  - **Pruebas que lo cierran:** `src/__tests__/entretenimiento-sesion-segura.test.ts` comprueba con 7 tests unitarios los dos casos reales: (1) A pendiente -> B mira captura -> A termina (B limpio), y (2) A pendiente -> B inicia subida -> A termina (a B no se le apaga su subida).
- **Pregunta 3 (Necesita algo que hoy no está):**
  - En `src/app/evento/fotocabina/[fiestaId]/page.tsx` (línea 448): si no hay cámara web disponible o el navegador niega permisos, se muestra una alerta visual en pantalla solicitando permisos en lugar de pantalla negra.
- **Pregunta 9 (¿Termina a medias y dice que terminó?):**
  - En `src/lib/sync/offline-sync-service.ts`: si se pierde la conexión durante la noche, las fotos quedan encoladas con ID y no se marcan como sincronizadas hasta que Firestore confirma el guardado efectivo.

**Estado:** LIMPIA con el arreglo de DEVOLUCION-48 aplicado y probado.

---

## 2. Pantallas del invitado (Invitación, RSVP, Muro interactivo, Trivia)

- **Pregunta 9 (¿El servidor se lo mandó?):**
  - `src/lib/social-fiesta/public-event.ts` (líneas 110-150): utiliza `mapProgramaParaElCliente`. Sólo envía hitos marcados como públicos; notas internas, horarios de descanso de mozos y teléfonos de contacto quedan filtrados en el backend.
- **Pregunta 9 bis (¿Puede terminar a medias y decir que terminó?):**
  - `src/lib/invitados/aviso-importacion-invitados.ts` y `src/__tests__/la-importacion-de-invitados-no-miente.test.ts`: al importar listas de invitados (Excel/CSV), si fallan filas no anuncia "Éxito"; detalla exactamente cuántos entraron y lista nominalmente a los que faltaron con su motivo.
- **Pregunta 5 (¿El visitante lo ve?):**
  - La invitación web y el muro adaptan el layout para pantallas móviles y salones oscuros (`tests/e2e/la-portada-aparece-al-toque.spec.ts`).

**Estado:** LIMPIA con filtrado de backend y reporte explícito de importaciones.

---

## 3. Portal del cliente

- **Pregunta 9 (¿El servidor se lo mandó?):**
  - `src/lib/client-portal/public-fiesta.ts` (líneas 85-115): el endpoint público del portal excluye notas del equipo y datos de margen/costos. El campo expuesto es `notaDecoracionParaElCliente`, evitando publicar las anotaciones internas del equipo.
- **Pregunta 4 (¿Lo que dice la pantalla existe en el código?):**
  - La vista del cliente lee los estados de presupuesto y cronograma directamente de los campos sanitizados del backend.

**Estado:** LIMPIA.

---

## 4. Impresos (Tiras de fotos, Recuerdos, QR)

- **Pregunta 6 (¿El dato llega?):**
  - `src/lib/entretenimiento/tira-fotocabina.ts` (línea 42): `componerTiraDeFotos` recibe la plantilla (`strip_3`, `single_photo`, `strip_4`), la imagen de fondo de la fiesta y los textos de los homenajeados.
- **Pregunta 7 (¿La prueba termina el trabajo?):**
  - `tests/e2e/la-decoracion-se-baja-y-se-genera.spec.ts`: verifica que la exportación descargue un archivo real que termina en `.png`, sin fallbacks ni salidas de emergencia.

**Estado:** LIMPIA.

---

## 5. Operación de la noche (Pantalla gigante, Recepción, Modo offline)

- **Pregunta 1 (¿Dejó rastro?):**
  - `src/app/actions/fiesta/recepcion.actions.ts`: cada check-in de recepción almacena la hora exacta de llegada y número de mesa asignada en Firestore.
- **Pregunta 8 (Concurrencia):**
  - `src/app/evento/muro-en-vivo/[fiestaId]/page.tsx` (línea 2104): el juego de trivia procesa `game.tableLeaderboard` al finalizar sin interferir con las publicaciones del muro social.

**Estado:** LIMPIA.
