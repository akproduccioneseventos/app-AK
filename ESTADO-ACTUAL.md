# Estado actual — 23 de noviembre de 2026

## Publicado
- **#1462** (órdenes 331–334), **#1463** (mirar no escribe, orden 336), **#1464** (orden 335 + escaneos 211/212/214).

## En revisión: orden 336 (rama `gemini/orden-336`, una sola propuesta)
- Hecho: los 5 bloques (Secciones A–H + escaneos 211/214 + AK Editor reempaquetado), sin pisar los cambios de PR #1465 (`listCollectionFromFirestore`/`readFromFirestore`/`leer-fiestas.ts`/`invitadosEstimados`).
- **Para revisión línea por línea de Claude (plata, cobros y permisos):**
  - **Datos/Transacciones:** `data-service.ts`, `marca-de-lectura.ts`, `firebase-sync.ts` (`syncToFirestore`), `invoices.ts` (`deleteInvoiceInner`), `fiesta.actions.ts`, `actualizar-fiesta.ts`, `portal.actions.ts` (`actualizarFiesta` en `changeEventDate`/`cambiarClavePortal`/`cancelServicesOrParty`, `initializePortalSession`, `entrarAlPortalPorTelefono`).
  - **Permisos/Seguridad/Webhooks:** `entretenimiento.actions.ts`, `games.actions.ts`, `carga-operativa.actions.ts`, `social-live-stream.ts`, `video-vida.actions.ts`, `buzon.ts`, `social-media.ts`, `documentos.actions.ts`, `comentarios-redes.ts`, `simple-auth.ts`, `roles.ts`, `auth.ts`, `settings.ts`, `marketing-ads.ts`, `accesos-personal.ts`, `multiagent.ts`, `google-workspace-extended.ts`, `fiesta-actual.ts` (`getFiestasParaKiosco`), `/api/backup/upload`, los 4 `/api/*/download`, `/api/meta/webhook`, `/api/whatsapp/webhook`.
  - **Plata y topes IA:** `total-tras-cancelar.ts`, `presupuestos.ts`, `cupones.ts`, `reportes.ts`, `price-adjustments.ts`, `crm.ts`, `simulador-de-presupuesto`, `consumo.ts`, `genkit.ts`, `touchpix-ai.ts`, `multiagent-flow.ts`, `assistant.ts`, `executors.ts`, `encargado.ts`, `salon-ia.actions.ts`, `asistente-virtual.ts`, `social-gallery.ts`.

## Siguiente para Gemini (rama nueva `gemini/orden-337`)
- **Orden 337** (actualmente en borrador en **PR #1465** de Claude): arrancarla apenas Claude revise/fusione #1465 hacia `main`.

## Ojo
- `las-formas-que-mienten` y `ordenes-cumplidas` (336: HECHA) en verde; `tests/e2e/` no corrido localmente (queda para puerta de publicación).
