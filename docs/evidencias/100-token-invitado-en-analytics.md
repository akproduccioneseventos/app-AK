# Seguridad P1 — token de invitado entregado a Google Analytics

Fecha de revisión: 2026-09-28
SHA publicado registrado por `docs/YA-RESUELTO.md` (verificación 2026-09-27): `5e384c684c326dbcf79a12dae760ba4fe7e0b705`.
PR abierta #1240: HEAD `79dae2cd75f1ffc572f28f6ee890174c3912fff8`, base declarada `b52b1f013d21bd2831b918fb04649636ce24033a`.
Clasificación: riesgo de seguridad comprobable por flujo de código, presente en el SHA publicado registrado y en la candidata; sin captura de tráfico de navegador en esta auditoría. Requiere corrección prioritaria antes de certificar seguridad.

## Evidencia exacta

- En ambos SHAs, `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx` obtiene `token` desde `searchParams` y lo entrega a `getPublicGuestPortalData(fiestaId, guestId, guestAccessToken)`.
- `src/app/actions/public-guest-portal.ts` sólo devuelve el portal cuando `buildPublicGuestPortalData(fiesta, guestId, guestAccessToken)` acepta la credencial. `src/lib/guest-portal-public-data.ts` llama `hasPublicGuestAccess(guest, guestId, guestAccessToken)` y, si valida, entrega datos del evento e información personal/operativa del invitado. Es una credencial de acceso, no un parámetro inocuo.
- La página arma además un QR con `/evento/accesos/<fiestaId>?fiestaId=...&token=<guestAccessToken>&guestId=...`; el lector lo vuelve a comparar con el token almacenado del invitado.
- El layout global `src/app/layout.tsx` monta `<GoogleAnalytics />` y `<MetaPixel />` para todas las rutas.
- `src/components/google-analytics.tsx` configura `const url = pathname + window.location.search` y ejecuta `window.gtag('config', gaId, { page_path: url })`. Por tanto pasa a la etiqueta la ruta con el token query incluido. El identificador GA4 tiene fallback hardcodeado `G-KBNKPZ02N9` en `src/lib/medicion/identificadores.ts`, así que no depende de una variable opcional.
- La documentación oficial de Google indica que `config` envía page_view por defecto y que `page_location` usa `location.href` por defecto: https://developers.google.com/analytics/devguides/collection/ga4/views. El componente sí desactiva pageview en el primer `config`, pero su segundo `config` de SPA no incluye `send_page_view: false`; además entrega explícitamente `pathname + search`.
- La misma configuración está en el SHA de publicación registrado y en PR #1240: los blobs de `layout.tsx` y `google-analytics.tsx` coinciden. La presencia de Pixel en esas rutas está comprobada en el código; no afirmo aquí el contenido exacto de los parámetros que Meta registra, porque no capturé su solicitud de red.

## Riesgo

Una visita o apertura del QR puede transmitir a Google Analytics una credencial bearer reutilizable del invitado. Quien tenga acceso a esos datos analíticos, exportaciones o integraciones podría obtenerla y usarla mientras siga vigente, sujeto a los controles y límites del portal. También quedan rutas/token en historial y registros; esas superficies no se midieron aquí.

Esto **no** es una propuesta de banner ni reabre la decisión del dueño de no agregar un “aparato” de privacidad. Es evitar enviar un secreto de autenticación a terceros.

## Corrección propuesta para Gemini (pendiente de autorización de cambio funcional)

- Excluir analítica y Pixel de todas las páginas con credenciales de invitado/operador/entretenimiento; como mínimo, antes de cualquier evento eliminar `token`, `guestAccessToken` y otros tokens, y no transmitir la query completa.
- Revisar todos los enlaces firmados que consumen `token`, incluidos invitación, QR de acceso y estaciones de entretenimiento. No asumir que redacción sólo en una página cierra el flujo.
- Mantener autenticación y enlaces funcionales. No retirar ni rotar credenciales productivas en esta auditoría.
- Agregar prueba de navegador con token ficticio y captura de requests: ningún request a Google/Meta ni evento de pageview debe incluir el valor; probar también QR/estaciones. Validar el límite mediante publicación controlada después de corregir.
- Codex no modifica comportamiento; pedir autorización del dueño antes de implementar la exclusión/redacción.

## No probado

Sin browser network capture, sin uso de token real, sin acceso a Analytics/Meta Events Manager, sin prueba de explotación y sin cambios/build. La conclusión documenta el dato sensible que el código entrega a GA, no acceso efectivo de un tercero ni cumplimiento legal.
