# Orden 350 — Botón "¿Cómo funciona?" con un video tutorial en cada pantalla del cliente y del invitado

**Para Gemini. Va en la MISMA propuesta que la 346 a 349, al final.** Si un bloque se traba, entregá el resto y avisá
cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Usá `celular-primero` y `vende`.

## Por qué (pedido del dueño, 25/11/2026)
Palabras suyas: *"para el cliente que no va a entender cómo funciona, que haya un botón donde yo le pueda subir un video de
YouTube en oculto y pueda ver un tutorial de cómo funcionan las cosas: el simulador, el Video de Vida, cómo subir las fotos
o videos, saber cuánto sale si sumo más invitados, todo el módulo del cliente, todo el módulo del invitado"*.

## Lo que YA existe (no lo rehagas)
- Ajustes públicos de lectura, mismo patrón a copiar: `getBudgetDisplaySettings` / `saveBudgetDisplaySettings` en
  `src/app/actions/settings.ts` (~337-371), archivo `budget-display-settings.json` (en
  `src/scripts/migrate-to-firebase.ts` ~230 figura como documento suelto: hacé lo mismo con el nuevo).
- Pantalla de Ajustes: `src/app/(app)/settings/page.tsx`.

## Bloque 1 — Dónde se cargan los videos
1. Tipo nuevo `TutorialesSettings` en `src/types/settings.ts`: `Record<TutorialClave, { youtubeUrl?: string; titulo?: string }>`.
   Claves fijas (`TUTORIALES_CLAVES`): `simulador`, `invitados-y-precio` (cuánto sale si sumo invitados), `video-vida`,
   `subir-fotos-videos`, `portal-cliente` (el módulo del cliente entero), `portal-invitado`, `confirmar-asistencia`,
   `mesas`, `contrato-y-pagos`.
2. `getTutorialesSettings()` (**pública de lectura**, la usan pantallas sin sesión) y `saveTutorialesSettings()` con
   `requirePermisoAlguno(PERMISOS.ADMINISTRACION)`, archivo `tutoriales-settings.json`.
3. **La dirección se valida al guardar**: sólo `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/` o
   `youtube.com/embed/`; se guarda el id del video. Cualquier otra cosa → error "Pegá un enlace de YouTube". Los videos
   "ocultos" (no listados) de YouTube se ven igual con el enlace: no hace falta nada especial.
4. En Ajustes, sección **"Tutoriales en video"**: una fila por clave con su nombre en criollo, la casilla para pegar el
   enlace, una miniatura (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`) cuando hay uno, y "Probar" que abre el video.

## Bloque 2 — El botón en cada pantalla
1. Componente único `src/components/tutorial/BotonComoFunciona.tsx` (`clave`): botón chico **"¿Cómo funciona?"** con
   ícono de play. Al tocarlo abre un modal con el video embebido de `https://www.youtube-nocookie.com/embed/<id>`
   (ancho completo en celular, 16:9, botón cerrar de 44px). **Si esa clave no tiene video cargado, el botón no aparece.**
2. Dónde va (una sola vez por pantalla, arriba, cerca del título):
   - Simulador: `src/app/simulador-de-presupuesto/page.tsx` y `src/app/simulador-ak/page.tsx` → `simulador`; en el paso de
     invitados → `invitados-y-precio`.
   - Video de Vida: `src/app/video-vida/[fiestaId]/page.tsx` y `src/app/evento/video-vida/[fiestaId]/page.tsx` → `video-vida`.
   - Portal del cliente: `src/app/portal-cliente/[id]/page.tsx` y `src/app/portal/[fiestaId]/[module]/page.tsx` →
     `portal-cliente`; en contrato (`src/app/portal/[fiestaId]/contrato/page.tsx`) → `contrato-y-pagos`; en mesas
     (`src/app/portal/mesas/page.tsx`) → `mesas`.
   - Portal del invitado: `src/app/portal-invitado/[fiestaId]/[guestId]/page.tsx` → `portal-invitado`; donde el invitado
     sube fotos o videos → `subir-fotos-videos`; donde confirma asistencia → `confirmar-asistencia`.
3. **No muevas ni cambies nada más de esas pantallas** (textos, reloj del simulador, orden de los pasos).

## Lo que NO hay que hacer
- No subir videos a la app ni guardar archivos: sólo el enlace de YouTube.
- Nada que se pague por mes.

## Qué tiene que comprobar la prueba
- `src/__tests__/los-tutoriales-solo-aceptan-youtube.test.ts`: un enlace `youtu.be/abc123` se guarda como id `abc123`; un
  enlace de otra página se rechaza; el personal sin ADMINISTRACION no puede guardar.
- `tests/e2e/el-boton-como-funciona.spec.ts`: con un video cargado para `simulador`, el simulador muestra "¿Cómo funciona?"
  y al tocarlo aparece un `iframe` con `youtube-nocookie.com/embed/<id>`; sin video cargado, el botón **no** está.

```comprobar
archivo: src/components/tutorial/BotonComoFunciona.tsx
usa: getTutorialesSettings en src/app/(app)/settings/page.tsx
usa: BotonComoFunciona en src/app/simulador-de-presupuesto/page.tsx
usa: BotonComoFunciona en src/app/simulador-ak/page.tsx
usa: BotonComoFunciona en src/app/video-vida/[fiestaId]/page.tsx
usa: BotonComoFunciona en src/app/evento/video-vida/[fiestaId]/page.tsx
usa: BotonComoFunciona en src/app/portal-cliente/[id]/page.tsx
usa: BotonComoFunciona en src/app/portal/[fiestaId]/[module]/page.tsx
usa: BotonComoFunciona en src/app/portal/[fiestaId]/contrato/page.tsx
usa: BotonComoFunciona en src/app/portal/mesas/page.tsx
usa: BotonComoFunciona en src/app/portal-invitado/[fiestaId]/[guestId]/page.tsx
usa: saveTutorialesSettings en src/app/actions/settings.ts
prueba: src/__tests__/los-tutoriales-solo-aceptan-youtube.test.ts
prueba: tests/e2e/el-boton-como-funciona.spec.ts
```
