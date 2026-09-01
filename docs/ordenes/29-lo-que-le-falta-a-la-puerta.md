# Orden 29 — Lo que le falta a la puerta para que "sin errores" sea de verdad

**Para Gemini. Escrita el 1 de septiembre de 2026.**

> **Pedido del dueño:** *"verificá si no falta nada más para poner en el mecanismo, para que la
> app esté pronta, sin errores."*

## Lo que la puerta controla hoy

`npm run "publicar?"` corre ocho pasos, del más barato al más caro, y corta en la primera falla:
acentos, "lo que se dijo es lo que es", el trinquete, el revisor de tipos, las pruebas, la
compilación, la seguridad de la base y las pruebas de navegador.

**Está bien y no se toca.** Lo que sigue es lo que le falta.

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA.** `npm run "publicar?"` en verde y anotado en `docs/YA-RESUELTO.md`.

---

## BLOQUE 1 — El recorrido de las 353 pantallas quedó AFUERA de la puerta

Se construyó, anda, y **se corre a mano con `npm run recorrido`**. Si nadie se acuerda, no
sirve: es exactamente el problema que vino a resolver.

**Qué hacer:** que la puerta lo corra **como último paso**, después de las pruebas de navegador.

- **Sólo cuando se va a publicar de verdad**, no en cada cambio: es lo más lento de todo (unos
  40 minutos). `npm run "publicar?:rapido"` **lo saltea**, como saltea el navegador.
- **Frena si hay pantallas rotas** (ya frena: se le arregló para que no informe en verde con
  todo roto).
- **En el resumen final, el número**: *"353 pantallas: 328 andan, 25 rotas"*.

---

## BLOQUE 2 — Nadie controla las conexiones con afuera

**Hay 17 conexiones** —Google, WhatsApp, Instagram, Facebook, YouTube, Spotify, MercadoPago,
el píxel de Meta y más—. **Si mañana se cae una, la puerta da verde igual** y te enterás en una
fiesta, o peor: cuando un cliente no puede pagar.

**Qué hacer:** un paso nuevo, `npm run conexiones?`, que use lo que ya existe
(`src/app/actions/conexiones-estado.actions.ts`, que ya sabe preguntar por cada una) y conteste
en criollo cuáles están conectadas y cuáles no.

**OJO, y esto es lo importante:** **NO frena la publicación.** Una conexión caída no es un error
del código y puede ser culpa del otro lado. **Avisa, no frena.** Que salga en el resumen final:

    Conexiones: 10 de 13 andando. Sin conectar: TikTok, Threads, X.

**Que se pueda correr solo**, para mirarlo antes de una fiesta grande.

---

## BLOQUE 3 — Nadie controla que la app se vea bien

Compila, anda, pasa todo... y puede estar desprolija. **Las reglas de estética ya están escritas**
(orden 22, bloque 7) y **se pueden controlar solas**:

- **Ningún texto que se toca o se lee de lejos por debajo del mínimo** (14 píxeles en lo que se
  toca; en la pantalla gigante, 2% del alto).
- **Nada importante pegado al borde**: margen del 5%, que es lo que come un proyector.
- **Ninguna pantalla que se desborde para el costado** en el celular.

**Empezá por las pantallas que ve el cliente y el invitado** —las estaciones, la pantalla
gigante, la invitación, el álbum y la web de venta—, **no por las 353**. Y **que avise, no que
frene**, hasta que esté limpio: si frena de entrada, alguien lo va a apagar.

---

## BLOQUE 4 — Dos pantallas para conectar lo mismo

**Verificado:** las conexiones se manejan en dos lugares distintos —
`src/app/(app)/settings/sincronizaciones/page.tsx` y
`src/app/(app)/settings/social-connections/page.tsx`— y por eso Pinterest **parece** que no se
puede conectar: está en la segunda.

**Una pantalla vive en un solo lugar.** Juntalas en una. **No copies: mové y dejá un enlace si
hace falta.**

---

## LO QUE NO SE TOCA

- **Los ocho pasos que ya tiene la puerta.** Andan.
- **No saques ningún control para que dé verde.** Si molesta, se arregla lo que marca.
- **Plata, cobros, comida y permisos: los hace Claude.**
