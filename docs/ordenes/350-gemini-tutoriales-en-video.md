# Orden 350 — Botón "¿Cómo funciona?" con un video tutorial en toda pantalla que ve gente de afuera

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
1. Tipo nuevo `TutorialesSettings` en `src/types/settings.ts`: `Record<string, { youtubeUrl?: string; videoId?: string }>`.
   La lista de temas vive en **un solo archivo**, `src/lib/tutoriales/temas.ts` → `TEMAS_TUTORIAL`: `{ clave, titulo, grupo }`.
   Grupos y temas (el dueño pidió TODA la app que ve gente de afuera, no sólo los ejemplos que dio):
   - **Prospecto:** `simulador`, `invitados-y-precio` (cuánto sale si sumo invitados), `club-uruguay`, `experiencia`
     (`/experiencia` y `/experiencia-ak`), `paginas-por-tipo` (bodas, 15, cumpleaños, empresas, infantiles), `reunion-led`
     (la presentación LED que se usa adelante del cliente).
   - **Cliente:** `portal-cliente` (cómo se usa el portal entero), y una clave por cada sección de
     `src/app/portal-cliente/[id]/page.tsx`: **recorré esa página y armá una clave por cada sección que tenga título propio**
     (como mínimo: pendientes, pagos y cuotas, contrato, invitados y confirmaciones, mesas, música, fotos y Video de Vida,
     decoración y moodboard, menú, mensajes, página pública / invitación digital). Además `video-vida`, `contrato-y-pagos`
     (`/portal/[fiestaId]/contrato`), `mesas` (`/portal/mesas`), `decoracion`, `moodboard`, `mercado-pago` (`/pago/mercadopago`),
     `encuesta` (`/feedback/[fiestaId]`), `post-fiesta` (`/post-fiesta/[fiestaId]`).
   - **Invitado:** `portal-invitado`, `invitacion` (`/invitacion/[fiestaId]` e `/i/[slug]`), `confirmar-asistencia`
     (`/invitacion/[fiestaId]/rsvp`), `mi-mesa` (`/evento/mi-mesa`, `/evento/actual/mesa`), `subir-fotos-videos`
     (galería, muro en vivo y zona digital), `buzon` (dedicatorias), `pedir-trago` (`/evento/barra/[fiestaId]`),
     `pedir-cancion` (`/evento/dj/[fiestaId]`), `fotocabina`, `plataforma-360`, `espejo-magico`, `vogue`, `touchpix`,
     `realidad-aumentada` (`/evento/ar`), `en-vivo` (`/evento/en-vivo`), `buscarme` (búsqueda por cara), `album`
     (`/evento/album`), `video-recuerdo` (`/evento/[id]/video-recuerdo` y `/invitacion/[fiestaId]/recap`), `hub` (`/evento/hub`).
   - **Proveedor y personal:** `portal-proveedor` (`/proveedor/acceso/[token]`), `acceso-personal` (`/acceso-personal/[tokenId]`
     y `/personal/[empleadoId]`).
   - **Equipo en el salón** (para que el dueño grabe cómo se opera): `barman`, `recepcion` (`/recepcion`, `/evento/actual/checkin`),
     `moderacion`, `control-pantalla`, `impresion`, `totem`.
   Si encontrás otra pantalla pública con funciones propias que no está acá, **sumala a `TEMAS_TUTORIAL`** y avisá cuál.
2. `getTutorialesSettings()` (**pública de lectura**, la usan pantallas sin sesión) y `saveTutorialesSettings()` con
   `requirePermisoAlguno(PERMISOS.ADMINISTRACION)`, archivo `tutoriales-settings.json`. Sólo acepta claves de `TEMAS_TUTORIAL`.
3. **La dirección se valida al guardar**: sólo `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/` o
   `youtube.com/embed/`; se guarda el id. Cualquier otra cosa → "Pegá un enlace de YouTube". Los videos ocultos (no
   listados) se ven igual con el enlace.
4. En Ajustes, sección **"Tutoriales en video"**, agrupada por grupo (Prospecto, Cliente, Invitado, Proveedor y personal,
   Equipo en el salón): una fila por tema con su título en criollo, la casilla para pegar el enlace, miniatura
   (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`) cuando hay uno, "Probar", y arriba un contador "12 de 48 con video".

## Bloque 2 — El botón en cada pantalla
1. Componente único `src/components/tutorial/BotonComoFunciona.tsx` (`clave`): botón chico **"¿Cómo funciona?"** con ícono
   de play. Abre un modal con `https://www.youtube-nocookie.com/embed/<id>` (ancho completo en celular, 16:9, cerrar de
   44px). **Sin video cargado para esa clave, el botón no aparece.** Las pantallas de estación a pantalla completa
   (fotocabina, 360, espejo, vogue, touchpix, tótem) lo muestran en la pantalla de espera, no durante la captura.
2. Va en **cada pantalla de la lista del bloque 1**, una vez arriba cerca del título; en el portal del cliente, además, uno
   en el encabezado de cada sección con su clave.
3. **No muevas ni cambies nada más de esas pantallas** (textos, reloj del simulador, orden de los pasos).

## Lo que NO hay que hacer
- No subir videos a la app ni guardar archivos: sólo el enlace de YouTube.
- Nada que se pague por mes.

## Qué tiene que comprobar la prueba
- `src/__tests__/los-tutoriales-solo-aceptan-youtube.test.ts`: un enlace `youtu.be/abc123` se guarda como id `abc123`; un
  enlace de otra página se rechaza; el personal sin ADMINISTRACION no puede guardar.
- `tests/e2e/el-boton-como-funciona.spec.ts`: con un video cargado para `simulador`, el simulador muestra "¿Cómo funciona?"
  y al tocarlo aparece un `iframe` con `youtube-nocookie.com/embed/<id>`; sin video cargado, el botón **no** está. Y que cada `clave` usada en un `<BotonComoFunciona>` de `src/app` exista en `TEMAS_TUTORIAL` (prueba Jest que recorra los archivos).

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
usa: BotonComoFunciona en src/app/invitacion/[fiestaId]/rsvp/page.tsx
usa: BotonComoFunciona en src/app/evento/barra/[fiestaId]/page.tsx
usa: BotonComoFunciona en src/app/evento/dj/[fiestaId]/page.tsx
usa: BotonComoFunciona en src/app/evento/fotocabina/[fiestaId]/page.tsx
usa: BotonComoFunciona en src/app/proveedor/acceso/[token]/page.tsx
usa: BotonComoFunciona en src/app/presentacion-led/page.tsx
usa: TEMAS_TUTORIAL en src/lib/tutoriales/temas.ts
usa: saveTutorialesSettings en src/app/actions/settings.ts
prueba: src/__tests__/los-tutoriales-solo-aceptan-youtube.test.ts
prueba: tests/e2e/el-boton-como-funciona.spec.ts
```
