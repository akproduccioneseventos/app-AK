# Orden `vende-02` — lo que ve el cliente cuando todavía no hay nada, y cuando algo falla

Para Gemini. **UNA sola propuesta con los dos bloques adentro.** Si un bloque se
traba, entregá el otro igual y decí cuál faltó.

Antes de subir tiene que dar todo verde: `npx tsc --noEmit`, `npx jest --silent`,
`npm run build`, `npm run check:acentos`.

Contexto: la regla del dueño es que **toda la app vende**. El invitado que usa la
fotocabina es el cliente de la fiesta del año que viene. Estas dos cosas se ven
justo en los momentos donde alguien decide si esto es serio o no.

---

## Bloque 1 — Ocho vacíos que hoy son una línea gris suelta

Ya existe el componente compartido `EmptyState` en `src/components/ui/empty-state.tsx`.
Recibe `icon`, `title`, `description` y `action`. Ya se usa en la pantalla del muro
social; hay que llevarlo a estos ocho lugares.

La diferencia importa: una línea gris sola no distingue entre *"esto todavía no
arrancó"* y *"esto está roto"*. El cliente abre el portal solo, de noche, desde el
celular, y no tiene a quién preguntarle.

Cada uno lleva **ícono + por qué está vacío + qué pasa después**. Los textos van
como los de abajo; no inventes otros.

| Dónde | Texto de hoy | Qué poner |
|---|---|---|
| `src/app/portal-cliente/[id]/page.tsx:1167` — lista de invitados del cliente | "Todavía no hay invitados cargados." | Título: *Todavía no confirmó nadie*. Detalle: *Compartí el enlace de invitación y acá vas a ver quién confirma, con cuántas personas viene y en qué mesa está.* |
| `src/app/portal-cliente/[id]/fotos-video/page.tsx:287` — fotografía y video | "Aún no hay servicios de fotografía o filmación oficiales registrados." | Título: *Todavía no cargamos las fotos*. Detalle: *Cuando el fotógrafo entregue el material, aparece acá y lo vas a poder descargar.* |
| `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx:172` — fotos, visto por el invitado | "Todavía no hay fotos publicadas." | Título: *Las fotos empiezan cuando arranca la fiesta*. Detalle: *Sacá las tuyas y compartilas desde el muro: aparecen acá y en la pantalla grande.* |
| `src/app/invitacion/[fiestaId]/recap/page.tsx:100` — recuerdo del día después | "Todavía no hay fotos aprobadas para mostrar." | Título: *Estamos eligiendo las fotos*. Detalle: *En unas horas vas a poder ver y descargar las mejores de la noche.* |
| `src/app/portal/c/[accessKey]/PublicPortalView.tsx:1625` — simulador sin presupuesto | "Aún no hay presupuesto cargado para tu evento…" | Título: *Tu presupuesto está en preparación*. Detalle: *Apenas AK lo cargue vas a poder ver el detalle y simular cambios acá mismo.* Acción: botón de WhatsApp para consultar. |
| `src/app/portal/c/[accessKey]/PublicPortalProView.tsx:412` — reuniones | "No hay reuniones cargadas todavía." | Título: *Todavía no hay reuniones agendadas*. Detalle: *Cuando coordinemos la próxima, la vas a ver acá con día y hora.* |
| `src/app/portal/c/[accessKey]/PublicPortalProView.tsx:419` — preguntas frecuentes | "Todavía no hay preguntas frecuentes cargadas." | Título: *Todavía no hay preguntas cargadas*. Detalle: *Si tenés una duda, escribinos por WhatsApp y la sumamos acá.* Acción: botón de WhatsApp. |
| `src/app/evento/social/[fiestaId]/page.tsx:921` — ranking de canciones | "Aún no hay canciones en el ranking." | Título: *Todavía no pidió nadie*. Detalle: *Pedí la tuya y votá las de los demás: la más votada la pone el DJ.* |

El último es además una **incoherencia dentro de la misma pantalla**: el chat, la
votación, el juego y las dedicatorias de esa pantalla ya usan `EmptyState`, y sólo
el ranking de canciones quedó con el párrafo gris.

---

## Bloque 2 — Dos errores que le llegan al invitado en inglés

Cuando el WiFi del salón falla, estos dos caminos le muestran al invitado el texto
crudo del navegador. En plena fiesta, eso es *"Error al subir el mensaje: Failed to
fetch"*.

**`src/app/actions/buzon.ts:161`** (buzón de recuerdos, audio y video)
Hoy: `'Error al subir el mensaje: ' + (error.message || error)`

**`src/app/actions/social-gallery.ts:475`** (foto al muro)
Hoy: `'Error al guardar la imagen: ' + error.message`

En los dos casos:

1. Detectar si el fallo es de conexión — el texto del error trae `failed to fetch`,
   `networkerror`, `load failed`, `fetch failed` o `timeout`.
2. Si es de conexión, devolver: *No pudimos subirlo. Revisá la señal y probá de
   nuevo: no se perdió nada.*
3. Si es cualquier otra cosa, devolver: *No pudimos subirlo. Probá de nuevo en unos
   segundos.* Sin pegar el texto del error.
4. El detalle técnico sigue yendo al registro con `logger`, como ahora. Lo que
   cambia es lo que ve la persona.

También corregir el acento en `src/app/actions/social-gallery.ts:280`:
`'Sesion no autorizada.'` → `'Sesión no autorizada.'`

---

## Lo que NO hay que tocar

- Los colores que **elige el usuario** (croquis del salón, decoración, números de
  mesa, invitaciones): son elección suya, no colores mal puestos.
- El `bg-white` de facturas, recibos y contratos: esos documentos se imprimen.
- El ajuste anual del 15%, el descuento del Salón Club Uruguay y el del presupuesto:
  son decisiones de marketing del dueño.

## Al terminar

Anotar los dos bloques en `docs/YA-RESUELTO.md`, en la sección de estética, con una
línea cada uno. La documentación viaja en la misma propuesta.
