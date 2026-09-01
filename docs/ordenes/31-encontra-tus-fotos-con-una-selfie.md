# Orden 31 — "Encontrá tus fotos": el invitado se saca una selfie y aparecen las suyas

**Para Gemini. Escrita el 1 de septiembre de 2026.**

> **Lo pidió el dueño** después de ver que Wfolio lo tiene y la app no.

## Lo investigado

**Es una categoría entera del rubro y está creciendo:** Kamero, FotoOwl, Memzo, Samaro,
Turtlepic, Cam-Shot y Pixs. Todas hacen exactamente lo mismo:

> El invitado escanea el QR, toca "encontrar mis fotos", **se saca una selfie**, y ve todas las
> fotos donde aparece. **Sin instalar nada y sin registrarse.** Menos de 3 segundos.

**Lo que cobran: unos 3 centavos de dólar por foto procesada.** Una fiesta de 1.000 fotos son 30
dólares; un casamiento grande de 5.000, unos 150. FotoOwl además se queda una comisión del 10%.

**Nosotros lo hacemos sin pagar por foto**, con la misma tecnología que ya usamos para quitar el
fondo sin telón: corre en la máquina, no en un servicio de afuera.

## Lo que NO es, para que no lo confundas

**Ya existe `src/lib/social-gallery/face-indexer.ts` y NO reconoce caras:** agrupa las fotos por
**quién las subió**, leyendo el nombre que escribió el invitado. Si la tía sale en veinte fotos
que subieron otros, no la encuentra. **Eso queda como está** —sirve para lo suyo— y esto es otra
cosa.

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** `npm run "publicar?"` en verde, `npm run limpiar:corrida`, y anotado en
`docs/YA-RESUELTO.md` **con su línea en el bloque `comprobar`**.

---

## BLOQUE 0 — LAS REGLAS DE LA CARA. SE LEEN PRIMERO Y NO SE NEGOCIAN.

**Esto son caras de gente en una fiesta de quince. Muchas, menores.** Reconocer caras no es
agrupar fotos: si se hace mal, es un problema serio y de los que no se arreglan pidiendo
disculpas.

1. **Todo pasa en el teléfono del invitado.** La selfie **no se manda a ningún servidor, no se
   guarda en ningún lado y no sale del teléfono**. Se usa en el momento y se descarta.
2. **Nunca se guarda una "cara" de nadie en la base.** Ni de los invitados, ni del homenajeado.
   Lo que se guarda por foto es un puñado de números que describen la cara **sin permitir
   reconstruirla**, y **se borran cuando se cierra la fiesta**.
3. **El invitado tiene que aceptar antes**, con un cartel claro: *"Vamos a mirar tu cara en este
   teléfono para buscar tus fotos. No se guarda ni se manda a ningún lado."* Si no acepta, la
   galería funciona igual: mira todas las fotos como hasta ahora.
4. **Sólo busca entre las fotos aprobadas de esa fiesta.** Lo que la moderación ocultó no entra
   nunca, ni para buscar.
5. **Nunca se muestra el nombre de nadie junto a una cara.** Esto encuentra fotos, **no
   identifica personas**. No hay etiquetas, no hay "esta es Fulana".
6. **Se puede apagar por fiesta.** Si el cliente no lo quiere, se apaga y listo.

**Si algo de esto obliga a mandar una foto a un servicio de afuera, PARÁ Y AVISÁ.** No se hace.

---

## BLOQUE 1 — Que funcione, y en el teléfono

- **La biblioteca corre en el navegador**: `face-api.js` sobre TensorFlow.js, o el equivalente de
  MediaPipe. **Sin servicios que se paguen por uso.** El modelo pesa unos 6 megas y se descarga
  una sola vez.
- **Las fotos se preparan una vez**, cuando el equipo cierra la galería de la fiesta: se recorren
  las fotos aprobadas y se guardan los números de cada cara. **Eso lo dispara una persona**, no
  pasa solo.
- **La búsqueda del invitado es instantánea**: compara su selfie contra esos números. Tiene que
  contestar en menos de 3 segundos, como las de ellos.
- **Si la fiesta todavía no está preparada**, el botón no aparece. Nunca un botón que no hace
  nada.

---

## BLOQUE 2 — Cómo se ve, que es lo que lo hace fácil

En la galería de la fiesta (`/evento/album/[fiestaId]` y `/evento/galeria/[fiestaId]`):

- **Un botón grande: "Encontrá tus fotos".**
- Al tocarlo, el cartel del permiso (bloque 0.3) y la cámara.
- **Una foto sola, de frente.** Si no se ve bien la cara, que lo diga en criollo: *"No te vimos
  bien. Probá con más luz."*
- Después, **sus fotos**, con un botón para bajarlas todas juntas.
- **Y siempre a la vista: "Ver todas las fotos de la fiesta"**, para volver.

**Aplican las reglas de estética del bloque 7 de la orden 22.**

---

## BLOQUE 3 — Cuando no encuentra nada

Es el caso que más va a pasar y el que peor se resuelve en las plataformas del rubro.

- **"No encontramos fotos tuyas todavía"**, y que explique por qué puede ser: que las fotos
  todavía se están cargando, o que no salió en ninguna.
- **Nunca una pantalla vacía**, y nunca un cartel técnico.
- Que ofrezca **probar de nuevo con otra selfie**.

---

## LO QUE NO SE TOCA

- **`face-indexer.ts` y la tira del muro social**: agrupan por autor y sirven. No se tocan.
- **La moderación**: lo oculto sigue oculto.
- **Nada que se pague por mes ni por foto.**
- **Y lo del bloque 0 no se negocia ni se simplifica "para que ande".** Si algo de eso no se
  puede cumplir, **la función no se entrega**: se avisa y decide el dueño.

## Y la prueba que hay que dejar

Una prueba que **abra la galería y compruebe en pantalla**: que el botón esté; que **sin aceptar
el permiso no se prenda la cámara**; y que **con la fiesta sin preparar el botón no aparezca**.

**Y una que compruebe lo más importante: que la selfie no sale del teléfono.** Que no se dispare
ninguna llamada al servidor con la imagen. Si eso no se puede comprobar, decilo y lo revisa
Claude: **es lo único de esta orden que no puede quedar sin comprobar.**
