# Orden de trabajo: testimonios, recontacto y lo que se ve en Google

Fecha: 12 de agosto de 2026.

**Entregá UNA SOLA propuesta de cambio con los cuatro bloques adentro.** Si uno se
traba, entregá los otros igual en la misma propuesta y avisá cuál faltó y por qué.
No abras una propuesta por bloque: cada fusión dispara un despliegue y eso se paga.

Antes de arrancar, leé `docs/QUE-HAY-EN-LA-APP.md`: ahí está el inventario de lo
que existe de verdad, ya verificado. No vuelvas a auditar lo que ya está anotado, y
**actualizá esas líneas en esta misma propuesta** cuando cambies algo.

Los cuatro hallazgos están verificados leyendo el código, no son sospechas.

---

## Bloque 1 — La presentación al cliente muestra testimonios inventados

**Dónde:** `src/app/presentacion-led/slides/testimonios-slide.tsx`, líneas 6 y 47.

**Qué hace hoy:**

```tsx
import { sharedTestimonials } from '@/data/event-catalogs/shared';
...
{sharedTestimonials.map((t, i) => (
```

Es una lista fija escrita a mano en el código.

**Por qué está mal:** la aplicación junta opiniones reales de clientes después de
cada evento, y el dueño las revisa y aprueba una por una. Esas opiniones aprobadas
**ya se muestran en la portada del sitio**, pero la presentación grande —la que se
le proyecta al cliente cuando se le está vendiendo— sigue mostrando la lista
inventada. O sea que el testimonio real de una clienta feliz de Salto no llega
justo a la pantalla donde más vendería.

**Qué hay que hacer:** que la pantalla de testimonios de la presentación use los
testimonios reales aprobados, con `getTestimonials()` de
`src/app/actions/feedback.ts`.

**REGLA QUE NO SE PUEDE ROMPER, es orden del dueño:** una opinión mala **nunca**
se publica. Hoy hay tres candados y los tres se respetan:

1. La opinión que deja el cliente va a una lista privada y no se publica sola.
2. El dueño elige cuál convertir en testimonio, y nace **sin aprobar**.
3. Sólo se muestra lo que él aprueba a mano.

Usá **únicamente** `getTestimonials()`, que ya devuelve nada más que las aprobadas.
**Nunca** uses `getAllTestimonials()` ni leas el archivo de testimonios directo:
esas dos vías traen también las no aprobadas. Dejá un comentario en el código
explicando por qué, para que nadie lo "arregle" al revés más adelante.

**Si todavía no hay testimonios aprobados**, no dejes la pantalla vacía ni muestres
la lista inventada: caé a los testimonios de ejemplo actuales sólo en ese caso, y
en cuanto haya uno real aprobado, que manden los reales.

---

## Bloque 2 — El planificador de redes dice "Publicado" cuando no publicó nada

**Dónde:** `src/app/actions/social-media.ts`, alrededor de la línea 307.

**Qué hace hoy:** cuando la aplicación importa las publicaciones de Instagram, las
guarda con `status: 'Publicado'`.

**Por qué está mal:** es cierto que esa publicación ya está en Instagram, pero en el
planificador de contenido se lee como si la aplicación la hubiera publicado. La
aplicación **no publica en ninguna red**: el contenido se redacta acá y se copia y
pega a mano. El equipo puede creer que algo ya salió cuando en realidad no salió.

**Qué hay que hacer:** distinguir en pantalla las dos cosas. Lo importado de
Instagram tiene que verse como **"Ya está en Instagram"** (o similar), con un color
distinto de lo que el equipo redactó y todavía tiene que publicar. Si hace falta un
estado nuevo, agregalo; no alcanza con cambiar el texto si el filtro y el color
siguen mezclándolos. Revisá también la pantalla `empresa/redes-sociales` para que
el conteo no sume las importadas como "trabajo hecho".

---

## Bloque 3 — Recontacto automático del que no señó (está escrito y apagado)

**Dónde:** `src/lib/marketing/whatsapp-remarketing.ts`, línea 39,
`processUnbookedLeadsRemarketing()`.

**Qué pasa hoy:** la función está escrita, con el mensaje redactado, para escribirle
por WhatsApp al prospecto que pidió presupuesto y no señó a las 48 horas.
**Ningún lugar del código la llama nunca.** Es trabajo hecho que no rinde nada.

**Qué hay que hacer:** engancharla al proceso automático que ya existe
(`runMarketingAutomation()` en `src/lib/marketing-automation.ts`, que ya corre por
la entrada de `src/app/api/cron/`), con estas condiciones, que son obligatorias:

1. **Apagado de fábrica.** Tiene que haber un interruptor en Ajustes para prenderlo,
   y arranca apagado. Nadie manda mensajes a clientes reales por sorpresa.
2. **Sólo a quien dio permiso.** Se respeta el campo `marketingConsent` del
   prospecto. Sin permiso, no se le escribe.
3. **Una sola vez por prospecto.** Se anota que ya se le escribió y no se repite
   nunca. Un cliente que recibe el mismo mensaje tres veces se va a la competencia.
4. **Nada de mensajes a los que ya contrataron**, ni a los marcados como perdidos o
   descartados.
5. **Que quede registrado** qué se mandó y a quién, para poder revisarlo después.
6. **El mensaje se personaliza** con lo que esa persona presupuestó: tipo de evento,
   fecha, cantidad de invitados. Un mensaje igual para todos se nota y no sirve.

Si algo de esto no se puede resolver bien, **dejalo apagado y avisá**: es preferible
que no mande nada a que mande mal.

---

## Bloque 4 — Páginas de venta a las que Google no les ve título

**Contexto:** la propuesta anterior destrabó el bloqueo que impedía que el sitio
apareciera en Google, y agregó el listado de páginas. Falta la terminación.

**Qué hay que hacer:**

1. **Título y descripción propios** en las páginas de venta que no los tienen. La
   lista de cuáles están y cuáles no está en `docs/QUE-HAY-EN-LA-APP.md`. Escribilos
   pensando en lo que busca alguien en Salto: "salón para casamientos en Salto",
   "fiesta de quince años Salto", y no en jerga de la empresa.
2. **La ficha de negocio para Google** (nombre, dirección, teléfono, coordenadas,
   redes) hoy está sólo en la portada. Ponela también en las páginas de bodas,
   quince, cumpleaños y en el blog.
3. **Nada nuevo se abre a Google por tu cuenta.** La lista de páginas permitidas
   vive en `src/lib/seo/paginas-publicas.ts` y está cerrada a propósito: el portal
   del cliente, las invitaciones con la lista de invitados y las pantallas del
   equipo tienen que seguir afuera. Si creés que hay que abrir una página más,
   **preguntá antes**, no la agregues.

---

## Cómo se comprueba

1. `npm run check:acentos` limpio.
2. `npx tsc --noEmit` en cero.
3. `npx jest --silent` todo en verde.
4. `npm run build` termina bien.
5. Una prueba nueva que verifique que la pantalla de testimonios **nunca** muestra
   uno sin aprobar. Ese es el punto más delicado de esta tanda.

Y anotá todo lo que hiciste en `docs/YA-RESUELTO.md` y en
`docs/QUE-HAY-EN-LA-APP.md`, en esta misma propuesta.
