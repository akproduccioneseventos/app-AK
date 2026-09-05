# Orden 38 — El panel del cliente y del invitado: atractivo y fácil

**Escrita el 2 de septiembre de 2026.** Pedido del dueño: *"mejorá la estética, el movimiento y
las funciones; debe ser muy atractivo y fácil"*.

> **UNA SOLA PROPUESTA con todos los bloques.** Si uno se traba, entregá el resto y decí cuál.

## De qué NO se trata esta orden

**Se auditó el panel y está sano:** cero pantallas vacías sin gracia, cero textos en jerga, cero
pantallas que se vean rotas mientras cargan, cero botones sin jerarquía. **No hay nada roto para
arreglar acá.**

Esta orden es lo otro: **que además de andar, enamore.** Es lo último que ve el cliente cuando
la fiesta terminó, y es lo que va a mostrarle a la amiga que está organizando la suya.

**Leé antes las habilidades instaladas:** `animaciones-pro` (curvas, tiempos y lo que NUNCA se
anima), `celular-primero` (es donde lo miran casi todos) y `vende`.

---

## LO MEDIDO — dónde estás parado

Comprobado archivo por archivo el 2 de septiembre de 2026:

| Pantalla | Líneas | Se mueve |
|---|---|---|
| **El portal del cliente** `src/app/portal-cliente/[id]/page.tsx` | 1344 | **NADA. Cero.** |
| **La pantalla del invitado** `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx` | 719 | **NADA. Cero.** |
| El resumen post-fiesta `src/components/social-wall/PostEventMemoryHub.tsx` | 299 | 16 entradas, pero **nada al bajar** |
| El álbum `src/app/evento/album/[fiestaId]/page.tsx` | 615 | 6 |
| La galería `src/app/evento/galeria/[fiestaId]/page.tsx` | 367 | 4 |

**En las cinco pantallas juntas, `whileInView` aparece CERO veces.** O sea: **nada entra al
llegar a la pantalla**. Todo está o no está.

**Las dos que están completamente quietas son las dos principales:** el panel del cliente —donde
sigue su fiesta— y la pantalla del invitado. Son 2.063 líneas sin una sola animación.

## Las secciones que ya existen — NO las rehagas

**El portal del cliente** (17 secciones): cabecera con el nombre del evento (569) · foto del
protagonista (585) · bienvenida (617) · mensaje del organizador (623) · evento concluido (634) ·
progreso (655) · **los seis botones grandes** —Menú, Música, Muro, Fotos, Invitados, FAQ— (659) ·
catálogo (679) · llegadas en vivo (708) · **cosas pendientes** (809) · las solapas Progreso /
Invitados / Pagos (876) · resumen (889) · **lo que tenés que llevar** (929) · menú e itinerario
(984) · video de vida (1042) · decoración (1092) · invitados con mesa (1158).

**La pantalla del invitado** (11 secciones): portada (360) · accesos rápidos (384) · todo tu
evento (407) · **mi asistencia / pase VIP** (424) · **la credencial con el QR** (470) · datos del
evento (508) · gastronomía (555) · recuerdos en vivo (587) · programa (617) · pie de AK (635).

**Todo eso anda y se ve bien. Lo que falta es que se sienta vivo, no rehacerlo.**

## BLOQUE 1 — EL MOMENTO EN QUE SE ABRE

**Es el que decide todo, y hoy no existe.** El cliente entra al portal por primera vez el día
después de la fiesta, con las emociones a flor de piel.

- **Una portada que reciba**: la mejor foto de la fiesta de fondo, el nombre del homenajeado
  grande, la fecha, y **un número que impresione** — *"312 fotos y 47 videos de tu noche"*.
- **Los números suben contando** cuando aparecen. Es lo que más engancha y es barato de hacer.
- **El título, la foto y el botón principal se ven de entrada**, sin animación de entrada. Eso
  no se negocia: está en `animaciones-pro` y ya nos costó una vuelta.
- **Debajo, una sola cosa para tocar**, la más importante: *"Ver todas tus fotos"*. **No cinco
  botones iguales.**

## BLOQUE 2 — QUE SE SIENTA VIVO

Aplicando `animaciones-pro`, **sin inventar tiempos ni curvas**:

- **Cada sección entra al llegar a la pantalla**, una sola vez, en cascada de 0,08 segundos.
- **Las fotos de la grilla aparecen escalonadas** al cargar, no todas de golpe.
- **Al tocar una foto, que se agrande desde donde estaba**, no que aparezca un cuadro encima.
  Es la diferencia entre una galería que se siente cara y una que se siente hecha en casa.
- **Al descargar, que se note que pasó algo**: el botón cambia y avisa cuando terminó.
- **Nada rebota, nada gira, nada hace esperar.**

## BLOQUE 3 — QUE SEA FÁCIL DE VERDAD

- **Descargar todo en un toque**, y **que diga cuánto pesa antes** —*"312 fotos, 1,2 GB"*— para
  que el cliente sepa si conviene esperar al wifi.
- **Compartir en un toque**: un botón que copie el enlace y lo diga en pantalla (*"Enlace
  copiado"*), y el de WhatsApp con el mensaje ya escrito. **Copiá y pegá no es una entrega.**
- **Que no haya que volver atrás para nada.** Desde cualquier pantalla del panel se llega a
  todas las demás.
- **Los números que ya sabe la app, no se piden.** Ver el bloque 5.b de la orden 35.

## BLOQUE 4 — LO QUE HACE QUE LO MUESTRE

El cliente le va a mostrar esto a la amiga que organiza su fiesta. **Que eso sea fácil y que nos
traiga el próximo cliente:**

- **Al pie, discreto, "Hecho por AK Producciones"**, que lleve a la web de venta. Sin cartel de
  publicidad: el material tiene que ser el protagonista.
- **El botón de reseña** ya existe y aparece solo si hay enlace cargado. **No lo toques.**

---

## LO QUE NO SE TOCA

- **Ningún texto de venta, precio, promesa ni promoción.** Se mejora **cómo se ve**, no lo que
  dice.
- **El cliente NO elige fotos.** Decisión del dueño: el álbum se arma solo y se entrega
  terminado. **Nada de "elegí tus favoritas" ni pantallas de aprobación.**
- **No se pide el mail ni el teléfono al invitado.**
- **Las cuatro tarjetas de descarga ya se arreglaron** (van a la galería filtrada por estación).
  **Podés mejorarles el aspecto; no les cambies a dónde van.**
- **Nada que aumente lo que se paga por mes.**

## Y las pruebas

1. **Que se mueva de verdad**: la posición de una sección cambia entre el momento de entrar y
   medio segundo después. **Una prueba que sólo mire que hay texto pasa con la página quieta.**
2. **Que lo importante se vea de entrada**: el nombre de la fiesta y el botón principal, visibles
   antes de que termine ninguna animación.
3. **Que ande en un celular de 360 píxeles** y **que la página no se corra para el costado**.
4. **Que descargar y compartir avisen** qué pasó.

```comprobar
usa: whileInView en src/components/social-wall/PostEventMemoryHub.tsx
usa: whileInView en src/app/portal-cliente/[id]/page.tsx
usa: whileInView en src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx
usa: whileInView en src/app/evento/galeria/[fiestaId]/page.tsx
usa: layoutId en src/app/evento/galeria/[fiestaId]/page.tsx
usa: Enlace copiado en src/components/social-wall/PostEventMemoryHub.tsx
prueba: tests/e2e/el-panel-del-cliente-enamora.spec.ts
```
