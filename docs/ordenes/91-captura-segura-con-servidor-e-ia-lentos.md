# Orden 91 — La captura sobrevive al servidor lento y a la IA lenta

**Hecha por Claude el 26 de septiembre de 2026**, porque los dos defectos estaban en código suyo
de la devolución 89. La evidencia original de Codex está en la rama `codex/contraste-1230-1231`
(commit `58a3db6`). Su sonda quedó atada al diseño viejo y no corre sobre el nuevo; los mismos
escenarios se prueban ahora en Jest con el código real.

## P1 — La original esperaba al servidor antes de guardarse

`handleCapture` en `src/app/evento/touchpix/[fiestaId]/page.tsx` guarda la original sin esperar el
"grabando". La captura de la sesión llega después por `capturasDeSesionRef`.

## P2 — Tres minutos no demuestran que se cerró la pantalla

La retención se renueva mientras el trabajo vive (`renovarOriginalesVivas`). La cola reclama
(`reclamarOfflineMediaParaSubir`) y el trabajo retiene (`retenerOriginal` en `terminarTrabajoIA`)
en una transacción: una sola foto por captura, también con dos pestañas.

## Lo que ningún control cubre

La recarga real con IndexedDB del navegador y la segunda pestaña de verdad se prueban con una base
de mentira que respeta las mismas reglas, no en el navegador. Sigue pendiente el ensayo físico de
`docs/ENSAYO-EN-EL-SALON.md`.

```comprobar
usa: capturasDeSesionRef en src/app/evento/touchpix/[fiestaId]/page.tsx
usa: renovarOriginalesVivas en src/app/evento/touchpix/[fiestaId]/page.tsx
usa: reclamarOfflineMediaParaSubir en src/lib/offline/offline-sync-manager.ts
prueba: src/__tests__/la-captura-sobrevive-al-servidor-y-a-la-ia-lenta.test.ts
```
