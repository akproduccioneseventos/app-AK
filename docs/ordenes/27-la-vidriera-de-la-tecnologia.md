# Orden 27 — La vidriera de la tecnología: que el cliente VEA lo que tenemos

**Para Gemini. Escrita el 1 de septiembre de 2026.**

> **Pedido del dueño, textual:** *"hacer una sección que muestre cada cosa, cada tecnología que
> tiene esta aplicación, para poder conseguir clientes. Si no le mostramos la tecnología que
> tenemos, va a ser imposible que nos contraten. Es lo que nos va a diferenciar, aparte del
> servicio integral."*

## Lo primero: ESTO NO SE HACE DE CERO

**Verificado.** Ya existen dos páginas:

- `src/app/experiencia-ak/page.tsx` (198 líneas)
- `src/app/marketing/demo-tecnologia/page.tsx` (254 líneas)

**Las dos hablan de la fotocabina, la 360, el espejo y la tecnología.** No las rehagas.

## El problema real, y es de venta pura

**A `/experiencia-ak` sólo se llega desde una pantalla interna del equipo**
(`src/app/(app)/empresa/marketing/page.tsx`). **Un prospecto que entra a la web NUNCA la ve.**

Está hecha, se ve, y no la mira nadie. **Ése es el trabajo: que se llegue.**

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** `npm run "publicar?"` en verde y anotado en `docs/YA-RESUELTO.md`.

---

## BLOQUE 1 — Que se llegue desde la web  ← LO MÁS IMPORTANTE

Un lugar destacado en la portada y en las páginas de venta (bodas, quince, cumpleaños), que
lleve a la vidriera de la tecnología.

**No un enlace escondido en el pie.** Va donde se ve, con un texto que dé ganas de tocar.

**La prueba:** desde la portada se llega a la vidriera **en un toque**, y la prueba lo comprueba
navegando de verdad.

---

## BLOQUE 2 — Que muestre TODO lo que hay, no cuatro cosas

Hoy nombra cuatro estaciones. **La app tiene mucho más, y todo eso es lo que te contrata.**
La lista completa, medida:

**Las once estaciones de la fiesta:** fotocabina, plataforma 360, Bogue (boomerang), espejo
mágico (foto, firma y cambio de cara con inteligencia artificial), Touchpix, buzón de recuerdos
(audio, video, foto y cabina telefónica retro), muro social en vivo, tótem, karaoke, zona
digital y video de vida.

**La pantalla gigante del salón:** fotos en vivo con moderación, encuestas, sorteo con rueda,
chat, pedidos al DJ, seis juegos con podio por mesa, momentos a pantalla completa, cuenta
regresiva a lo que viene y modo cine.

**Lo que se lleva el invitado:** el QR sin instalar nada, su foto al instante, el álbum de la
noche y el video recuerdo con música.

**Lo del cliente:** invitación digital con ocho diseños, confirmación con menú y alergias,
portal propio, moodboard de decoración, elección de menú y música, y el álbum al final.

**La inteligencia artificial:** la estación **habla en castellano** y dice el nombre del
homenajeado, cambia caras, arma textos y ayuda a organizar.

**Y lo que ninguna plataforma del rubro puede hacer, que es el remate de la página:** todo eso
**sabe de qué fiesta se trata**. Sparkbooth no sabe quién cumple años. Instawall no sabe qué
música pidieron. Nosotros sí, y por eso la voz dice el nombre, el álbum se arma solo y la lista
de compras sale del presupuesto.

---

## BLOQUE 3 — Que se vea, no que se lea

Una lista de 40 cosas no la lee nadie. **Que cada cosa entre por los ojos:**

- **Una foto o un video corto por estación**, de fiestas reales (ya hay material: el muestrario
  de decoración y la galería de fiestas anteriores).
- **Agrupado por momento**: "cuando llegan", "durante la cena", "cuando se prende la pista",
  "al otro día". Así el cliente se imagina su fiesta, no lee un catálogo.
- **Un número que impresione y sea cierto**: la cantidad de estaciones, las conexiones, las
  fiestas hechas. **Sin inventar nada.**

**Aplican las reglas de estética del bloque 7 de la orden 22.**

---

## LO QUE NO SE TOCA

- **No prometas plazos de respuesta ni precios sostenidos.** Está prohibido: *"promesas no, y
  menos congelar precio"*. Sí se puede decir por dónde se contesta y qué da una promoción
  vigente.
- **No toques los textos de venta que ya están** ni el reloj del simulador: son decisiones
  comerciales del dueño.
- **No inventes funciones que no tenemos.** Todo lo de la lista está verificado; si dudás de
  algo, sacalo.
- **Plata, cobros, comida y permisos: los hace Claude.**

---

## CÓMO SE COMPRUEBA QUE ESTA ORDEN ESTÁ HECHA

Lo verifica `npm run ordenes?` solo.

```comprobar
usa: InteractiveTechShowcase en src/app/page.tsx
usa: InteractiveTechShowcase en src/app/public/[eventType]/page.tsx
prueba: tests/e2e/la-vidriera-de-la-tecnologia.spec.ts
```

La primera línea es la que faltaba: **que se llegue desde la PORTADA**, que es por donde entra
el que llega de Google. Hoy se ve sólo en las páginas por tipo de evento.
