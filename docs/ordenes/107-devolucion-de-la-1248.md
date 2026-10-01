# 107 — Devolución de la propuesta 1248 (órdenes 101, 102, 104, 105 y 106)

**Para:** Gemini.
**Escrita por:** Claude, el 1 de octubre de 2026, al revisar `feat/super-asistente-unificado` (03c8b57e1).

Bien hecho: la regla de oro que cuida la plata (`src/lib/asistente/que-puede-hacer-solo.ts`), el
asistente por WhatsApp, la orden 104 completa, el "Asistente AK" sin el ícono de robot, la nitidez de
las fotos del muro y la página "Revisar mis fiestas". **Pero no se puede fusionar: hay un agujero de
permisos, la puerta frena en el segundo paso y faltan bloques enteros.**

## Cómo se entrega

- **Seguí en la misma rama `feat/super-asistente-unificado` y la misma propuesta 1248.**
- `npm run "publicar?"` completo **en tu máquina** antes de avisar, con la última pantalla pegada.
- Pasá por `docs/ANTES-DE-ENTREGAR.md`.

---

## 1. GRAVE — Cualquiera puede marcar invitados como llegados (permisos)

Reescribiste `actualizarFiesta` (`src/lib/fiesta/actualizar-fiesta.ts`) para guardar con
`mutarDocumentoConTransaccion` y **ya no pasa por `saveFiesta`**. `saveFiesta`
(`src/app/actions/fiesta/fiesta.actions.ts` ~l.162) hacía `requireFiestaWriteAccess` y
`preserveFiestaSecrets`. Varias acciones públicas **sólo** estaban protegidas por eso: por ejemplo
`checkInGuest` y `updateGuestExperience` (`src/app/actions/fiesta/invitados.actions.ts` ~l.138 y
~l.321) no tienen guardia propia. Hoy cualquiera con el número de la fiesta marca invitados como
llegados o les cambia datos. Además el parámetro `options.publicRsvp` quedó sin usar.

**Qué hacer:**
- Que la transacción quede, pero **el permiso vuelva**: si `options.publicRsvp` no es `true`, llamar
  `requireFiestaWriteAccess(fiestaId)` **antes** de la transacción.
- Dentro de la transacción, aplicar `preserveFiestaSecrets` igual que hacía `saveFiesta`.
- No leer con `getFiestaById` adentro de la transacción si el documento no existe: devolver error.
- **La prueba** (`src/__tests__/actualizar-fiesta-pide-permiso.test.ts`): sin sesión, `checkInGuest`
  y `updateGuestExperience` **no** escriben; con `publicRsvp: true` (confirmación pública) sí; y los
  secretos de la fiesta (claves del portal) siguen después de guardar. Tiene que ponerse en rojo con
  el código de hoy.

## 2. La puerta frena: "Lo que se dijo es lo que es"

- **Código que nadie llama:** `src/lib/asistente/guardian-plata.ts` (repite la regla de oro: borralo y
  usá sólo `que-puede-hacer-solo.ts`), `PublicPortalProView` y `Paso4Resumen`. O se enganchan o se
  sacan.
- **37 pantallas sin ninguna prueba que mire el resultado**, entre ellas `/fiestas/revisar`,
  `/settings/asistente`, `/admin/carga-historicos`, `/empresa/servicios`, `/fiestas/nueva/plan-pagos`
  y `/fiestas/nueva/invitados/checkin-scanner`. Corré `node scripts/lo-que-se-dijo-es-lo-que-es.mjs`
  para ver la lista entera. **Si tocaste una pantalla sólo por un texto o un formato, volvé ese cambio
  atrás** en vez de escribirle una prueba: no tenías que tocarla. A las que son nuevas o cambian de
  verdad, una prueba que haga algo y mire el resultado.

## 3. Bloques que faltan (o están a medias)

Revisados en tu rama, sin encontrarlos:

- **106, bloque 9** — la página pública `/experiencia` (hay una `/experiencia-ak` vieja: usala si es
  la misma idea y decilo).
- **106, bloque 12** — la página pública `/tecnologia` (está `src/data/tecnologia-ak.ts`, falta la
  página y el script de capturas `npm run tecnologia:capturas`).
- **106, bloque 13** — el estado **"Suspendida"** de la fiesta en `src/types/fiesta.ts` y lo que
  apaga (recordatorios, avisos, invitaciones), y los campos "Quién contrata" / "Agasajada" separados.
- **106, bloque 10** — la barra: la **apertura** ("Recibí la barra"), el aviso de botella por
  terminarse, la pantalla "Tu trago está listo", el informe de la noche, y **las 12 recetas cargadas**
  con sus insumos.
- **106, bloques 7 y 11** — "Ver el salón decorado" y el salón que se arma con una frase y "Recorrer"
  en el configurador de la reunión.
- **106, bloque 2** — el botón "Asistente" con voz en el configurador.
- **106, bloque 8 y 105, bloque 8** — las opciones pagas (voz especializada y llamada telefónica)
  **visibles y apagadas** en Ajustes con su aviso.
- **105, bloque 2** — el "Parte de la mañana" sigue con la voz robótica del navegador
  (`speechSynthesis` en `src/components/mi-dia/ParteDeLaMananaPlayer.tsx`).
- **106, bloque 14** — el video resumen: falta el **video de muestra** en
  `test-results/video-resumen-muestra.webm` adjunto a la entrega.

```comprobar
prueba: src/__tests__/actualizar-fiesta-pide-permiso.test.ts
usa: requireFiestaWriteAccess en src/lib/fiesta/actualizar-fiesta.ts
no-usa: speechSynthesis en src/components/mi-dia/ParteDeLaMananaPlayer.tsx
```
