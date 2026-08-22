# Orden 2: la app instalable y que funcione sin internet

**Para:** Gemini (Antigravity)
**Escrita:** 22 de agosto de 2026.
**Cuándo:** DESPUÉS de `docs/ordenes/ahora.md`, y en **otra propuesta**.

**Por qué va separada:** es un cambio de fondo que toca cómo se guardan y se
mandan los datos en toda la app. Mezclarlo con arreglos chicos haría imposible
saber qué rompió qué el día que algo falle en una fiesta.

## Cómo se entrega

**UNA SOLA propuesta con los bloques que entren.** Si algo se traba, entregá el
resto igual, en la misma propuesta, avisando qué faltó.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

---

## Lo que pidió el dueño

> *"Quiero que la app se pueda instalar en pc o móvil sin tener que ponerla en
> Play Store, porque no la quiero vender. Por ejemplo quiero la fotocabina y que
> solo esté eso en esa pc, y si no hay internet que funcione igual; después,
> cuando haya, se sincroniza sola. Y así todo."*

---

## Lo que YA ESTÁ y NO se rehace

- **La app ya se puede instalar** sin tienda: manifiesto en `src/app/manifest.ts`
  (nombre, iconos, pantalla completa), enlazado desde `src/app/layout.tsx`, y
  `@ducanh2912/next-pwa` configurado en `next.config.js`.
- **El modo quiosco ya existe**: `src/components/kiosk/kiosk-setup.tsx`. Se elige
  fiesta y puesto, se traba con clave de 4 números y queda fijo ahí.
  Roles de hoy: `barra`, `muro-en-vivo`, `plataforma-360`, `totem`.
- **La cola sin internet ya existe**: `src/lib/offline/offline-action-queue.ts`.
  Guarda fotos del muro, registro de llegada y pedidos de la barra.

**No subir nada a ninguna tienda de aplicaciones.** Se instala desde el navegador.

---

## BLOQUE 1 — Faltan estaciones en el modo quiosco

La idea es **una máquina por puesto**: esa computadora o tablet hace una sola cosa
toda la noche y nadie la saca de ahí. Agregá, con el mismo trato (traba con clave
y arranque directo en su pantalla):

- **Fotocabina** (`/evento/fotocabina/:fiestaId`)
- **Espejo mágico** (`/evento/espejo-magico/:fiestaId`)
- **Touchpix** (`/evento/touchpix/:fiestaId`)
- **Buzón de saludos** (`/evento/buzon/:fiestaId`)
- **Video de vida** (`/evento/video-vida/:fiestaId`)
- **Impresión de fotos** (`/evento/impresion/:fiestaId`)
- **Pedidos al DJ** (`/evento/dj/:fiestaId`)

---

## BLOQUE 2 — Ninguna estación que captura aguanta quedarse sin internet

El caso comprobado es la fotocabina
(`src/app/evento/fotocabina/[fiestaId]/page.tsx:500-552`): la foto se sube en el
momento y si falla solo ofrece bajarla al disco, **no queda encolada**. Con el
wifi del salón caído, se pierden las fotos de los invitados.

**Dejá todas iguales**, porque todas capturan algo: fotocabina (tanda de fotos),
espejo mágico (fotos), plataforma 360 (video), touchpix (fotos), tótem de la barra
(foto y video de 8 segundos), buzón (foto, video y audio), video de vida (video).
El muro social ya tiene cola: **verificá que aguante fotos grandes**.

### ⚠️ La trampa que haría fallar la fotocabina en plena fiesta

La cola de hoy guarda en `localStorage`, que aguanta unos pocos megas. **Una tanda
de fotos no entra ahí.** Las fotos y videos van en **IndexedDB**, guardados como
`Blob`, **no como texto**. Si se guardan como texto en `localStorage`, a la décima
foto revienta y el invitado se queda sin su foto.

- **Nunca borres lo local antes de que el servidor confirme que lo recibió.**
- **Que el operador vea cuántas quedan sin subir**: "3 fotos esperando internet".
- **Que se pueda cerrar y reabrir la pantalla sin perder lo pendiente.**
- **Los videos pesan mucho más.** Si uno no entra, avisá **antes** de grabar.
- Si el aparato se queda sin lugar, avisá en criollo. Nunca fallar en silencio.

---

## BLOQUE 3 — Que TODA la app aguante sin internet, por niveles

**Nivel 1 — Ver lo que ya se bajó (toda la app).** Cualquier pantalla que se abrió
con internet tiene que **volver a abrir sin internet**, con lo último que se sabe y
un cartel arriba: "Sin internet — esto es lo último que se guardó, del <fecha y
hora>". **Nunca una pantalla en blanco ni un error técnico.**

**Nivel 2 — Escribir sin internet (solo donde es seguro).** Se encola y se manda al
volver la señal:
- Todo lo que capturan las estaciones.
- Llegada de invitados y confirmaciones.
- Pedidos de la barra y del DJ.
- Tareas del evento, notas e incidentes.
- Consumos y gastos anotados en la noche.

**Nivel 3 — Lo que NO se puede, y hay que decirlo en pantalla.**
- **Cobrar.** Botón apagado: "necesita internet para cobrar".
- **Mandar correos, avisos o WhatsApp.** Se preparan y salen después.
- **Todo lo que usa inteligencia artificial.**
- **Facturas y numeración.** Dos personas sin internet numerando facturas al mismo
  tiempo terminan con dos facturas con el mismo número. **No se encola.**

### La regla de fondo, que evita el desastre

**Se encola lo que se SUMA** (una foto más, un invitado que llegó, un pedido).
**No se encola lo que PISA** lo que otro pudo haber cambiado (editar un
presupuesto, cambiar un precio, numerar una factura). Si dos personas editan lo
mismo sin internet, al volver la señal uno pierde su trabajo **y no se entera**.

### Y una que se paga cara si se olvida

Cuando algo encolado falla al mandarse (el dato ya no existe, el servidor lo
rechaza), **no se puede reintentar para siempre en silencio**. Va a una pantalla de
pendientes, en criollo, con opción de reintentar o descartar. Una cola llena de
cosas que nunca van a entrar es una bomba de tiempo.

---

## BLOQUE 4 — Que se note, y que el dueño pueda instalarlo solo

1. **Cartel de estado** discreto y constante: "Sin internet — se guarda y se manda
   después" y, al volver, "Listo, se subió todo".
2. **Una pantalla que explique cómo dejar una máquina lista en un puesto**, en
   criollo y en pasos. El dueño no es programador y tiene que poder hacerlo solo.
   Sin jerga.

---

## Por dónde empezar si hay que elegir

**La noche de la fiesta.** Es donde el wifi del salón falla y donde perder algo
duele de verdad. Lo de la oficina (presupuestos, facturas, contabilidad) se usa
donde hay internet.

De las estaciones: **fotocabina, tótem de la barra y espejo mágico**, que son las
tres que más se usan.

---

## Cómo se prueba que quedó bien

**No alcanza con que compile.** Hace falta una prueba que:
- corte internet, saque tres fotos, y verifique que quedan guardadas;
- vuelva a poner internet y verifique que se suben solas;
- cierre y reabra la pantalla en el medio, y verifique que **no se perdió ninguna**.

Y **una prueba corta por cada estación que captura**: sin internet la pantalla
sigue andando y lo capturado queda guardado. Son siete pantallas distintas; que
ande una no quiere decir que anden las otras.

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes.
- Textos que ve el cliente, si no están pedidos.
- El WhatsApp prepara mensajes y no los manda.
