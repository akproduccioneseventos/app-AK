# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 31 de agosto de 2026.
**Rama:** `claude/ponte-al-dia-qtrho3` (traía adentro la entrega v2 de la orden 19 de Gemini).
**Estado:** la puerta completa se estaba corriendo al cerrar. **Mirar el resultado antes de
fusionar.**

## Lo que se cerró hoy

- **Se probó EN PANTALLA que lo que se configura se ve.** La Plataforma 360 y Bogue muestran
  el texto de marca de la fiesta en la pantalla del QR. Probado abriendo la app, no leyendo el
  código: `tests/e2e/las-estaciones-respetan-los-ajustes.spec.ts`.
- **Foto de pantalla de las seis estaciones**, y pasaron:
  `tests/e2e/como-se-ven-las-estaciones.spec.ts` deja las imágenes en
  `test-results/como-se-ven/`. Falla si una no dibuja, no tiene botones o muestra texto técnico.
- **La deuda medida bajó de 259 a 255.**

## Lo que quedó SIN comprobar (y no hay que decir que está hecho)

- **Touchpix**: que muestre el texto de marca en la ventanita del QR. Dos intentos, no se llegó,
  se paró. **No está verificado.**
- **El Salón 3D** sigue sin dibujarse. La pantalla se usa igual. Necesita sesión dedicada.

## La orden 20, escrita y lista para Gemini

`docs/ordenes/20-que-las-estaciones-tengan-todo.md`. Sale de **investigar trece plataformas
del rubro** en agosto de 2026 y de mirar nuestras seis estaciones en pantalla.

**Lo que falta de verdad:** cambiar el fondo (con y sin telón, varios para elegir), la cámara
vertical u horizontal, marcos animados, filtro de belleza, la galería de la noche en tres
estaciones, y ocho ajustes que se tocan y no hacen nada.

**Tres cosas ya existen y NO hay que rehacerlas** (un ayudante las reportó mal): el filtro
"glam" que dijo que teníamos es sólo un estilo llamado así; los "marcos animados" son el
armador de GIF de Bogue; la galería por cara es un filtro por autor. Está todo anotado en la
orden y en `YA-RESUELTO.md`.

**Y algo que sí tenemos y ninguna plataforma tiene:** la estación **habla en castellano**
(fotocabina, 360, Bogue y Espejo). Faltan Touchpix y el Buzón.

## Decisión para el dueño, pendiente

**Convertir la foto en un video de 5 segundos con inteligencia artificial**, que salió en enero
y casi nadie tiene. Probablemente cueste por mes: **no se contrata sin preguntarle.**

## Lo que costó tiempo hoy, y no se repite

- **Tres pruebas dieron rojo y las tres eran de la prueba, no de la app**: el texto de marca no
  se dibuja al abrir sino en la pantalla de compartir; el Espejo abre en modo firma si no se le
  pide otro; y el modo se pide con `mode`, no con `modo`. **Verificar antes de devolverle
  trabajo a Gemini.**
