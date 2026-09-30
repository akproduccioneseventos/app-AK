# 103 — Devolución de la propuesta 1247 (orden 100)

**Para:** Gemini.
**Escrita por:** Claude, el 30 de septiembre de 2026, al revisar `feat/orden-100-v2` (229d59a0c).

Bien resuelto: la lista de pantallas que se pueden medir, la limpieza de parámetros, la tarea del
asistente que ya no se elige por un pedazo de texto, y las pruebas de navegador de la entrega
anterior. **Pero hay un defecto que borra las conversaciones del asistente, y faltan cinco cosas
de la orden 100.**

## Cómo se entrega

- **Seguí en la misma rama `feat/orden-100-v2`** y la misma propuesta 1247. No abras otra.
- `npm run "publicar?"` completo y la última pantalla pegada en la propuesta.
- Pasá por `docs/ANTES-DE-ENTREGAR.md`.

---

## 1. GRAVE — Después del primer mensaje, el asistente pierde todas las conversaciones

`mutarDocumentoConTransaccion` (`src/lib/generic-json-store.ts` ~l.163) guarda
`{ _filePath, _data: nuevo, _syncedAt }` en `multiagent/chats` y `multiagent/memory`. Pero **quien
lee** esos documentos es `readData` → `readFromFirestore` (`src/lib/firebase-sync.ts` ~l.472-485),
que devuelve el documento **tal cual**, sin desenvolver `_data`. Entonces `readChatState`
(`src/lib/multiagent/chat-store.ts` ~l.37) recibe un objeto sin `sessions` y muestra la lista
vacía. Lo mismo la memoria. Tu prueba no lo ve porque simula la base con el mismo formato de los
dos lados.

**Qué hacer:** que la transacción escriba **igual que `syncToFirestore`** para un documento de dos
partes (`firebase-sync.ts` ~l.384-400): `transaction.set(ref, { ...sanitizeForFirestore(nuevo),
_syncedAt })` si es objeto, y `{ _arrayData: [...] , _syncedAt }` si es lista. Al leer adentro de
la transacción, `unwrapGenericDocument` ya entiende los dos formatos: dejalo. Si hay documentos ya
guardados con `_data`, que `readFromFirestore` también los desenvuelva (una línea: si
`data._data` es objeto y no hay otros campos, devolver `data._data`).

**Y el candado local no cuida nada:** ~l.139 crea `new AsyncMutex()` **en cada llamada**, así que
dos llamadas no se esperan. Tiene que ser un mutex por archivo, creado una vez a nivel de módulo
(un `Map<string, AsyncMutex>`).

**La prueba** (sumala a `src/__tests__/el-asistente-no-pierde-ni-elige-mal.test.ts`): con una base
de mentira que guarda lo que escribe la transacción **y lo devuelve por el mismo camino que
`readFromFirestore`** (sin desenvolver), `appendMultiAgentChatTurn` dos veces seguidas y después
`readChatState` / la función pública que lista sesiones: tienen que aparecer las dos. Tiene que
ponerse en rojo con el código de hoy. Y dos llamadas locales simultáneas
(`AK_USE_LOCAL_JSON_ONLY=true`) quedan las dos.

## 2. Google todavía puede recibir la dirección entera

`src/components/google-analytics.tsx` ~l.31 manda sólo `page_path`. La orden pedía también
`page_location: window.location.origin + direccionParaMedir(...)` y `page_referrer` limpio (si el
referente es de `akproducciones.uy`, pasarlo por `direccionParaMedir`; si es de afuera, sólo el
origen). Sin `page_location`, Google toma `document.location` entero, con cualquier parámetro que
traiga la portada.

## 3. Meta carga el píxel en las pantallas privadas

`src/components/meta-pixel.tsx`: si la primera pantalla **no** se puede medir, no se carga el
script ni el `<noscript>` (devolver `null`). Además, el píxel manda por su cuenta la
dirección entera de la página (`location.href`), sin importar lo que le pases: por eso, si
`window.location.search` tiene algún parámetro que no está en la lista segura, **no se manda el
`PageView`** a Meta. En una página de venta con `?token=` no sale nada.

La prueba `tests/e2e/medicion-no-envia-llaves.spec.ts` suma: en `/invitacion/x/invitado/y?token=…`
no se pide `connect.facebook.net`; y en `/?token=LLAVE-FICTICIA` no sale `PageView` a Meta.

## 4. Los tres bloques de la orden 100 que no están

Se agregaron a la orden 100 mientras trabajabas; van en esta misma propuesta, tal como están
escritos ahí:

- **En el PDF del presupuesto, un nombre largo tapa "Invitados".**
- **El PDF dice la misma plata que la pantalla** (sólo pruebas).
- **La fotocabina no tiene cámara lenta** (decisión del dueño: la cámara lenta es de la
  Plataforma 360).

```comprobar
no-usa: new AsyncMutex(); en src/lib/generic-json-store.ts
no-usa: _data: nuevo, en src/lib/generic-json-store.ts
usa: page_location en src/components/google-analytics.tsx
usa: page_referrer en src/components/google-analytics.tsx
usa: splitTextToSize en src/lib/budget/simulator-budget-pdf.ts
no-usa: duracion-recuerdo-lenta en src/app/evento/fotocabina/[fiestaId]/page.tsx
prueba: src/__tests__/el-asistente-no-pierde-ni-elige-mal.test.ts
```
