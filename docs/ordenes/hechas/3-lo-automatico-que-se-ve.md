# Que se vea qué está funcionando de verdad

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 20 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

> **Tercera en la fila.** Primero `ahora.md` (bloques 7 y 8), después
> `2-despues-de-los-comentarios.md`, después ésta. **Una propuesta por orden**, no
> se mezclan: si algo se rompe, con todo junto no se sabe qué fue.
>
> **Cuando le toque: los cuatro bloques de acá van en UNA sola propuesta.**

## Por qué

La app estuvo declarada terminada y en un día aparecieron seis cosas rotas, todas
con la misma forma: **escritas, compilando, con pruebas en verde, y sin producir
nada en el mundo real**. Cuatro tareas automáticas no las disparaba nadie.

**Leé `docs/COMO-AUDITAR.md` antes de empezar.** Esta orden es la parte visible de
ese método.

## Lo que YA existe (verificado, NO lo rehagas)

- **`src/lib/automatico/tareas-automaticas.ts`**: declara las cuatro tareas, cada
  una deja su marca al terminar bien, y `estadoDeLasTareas()` responde "nunca",
  "atrasada" o "al día". **La lógica está hecha. Falta que se vea.**
- Una prueba recorre `src/app/api/cron/` y falla si aparece una tarea sin declarar.

---

# BLOQUE 1 — La pantalla "¿Qué está funcionando?"

Una pantalla nueva, en el menú del equipo, que responda de un vistazo lo único que
importa: **qué cosas la app hace sola, y cuándo pasó cada una por última vez.**

- Una fila por tarea, con el nombre en criollo: las notas del blog, los números de
  las redes, los posteos programados, los recordatorios de cuota.
- Para cada una: **cuándo corrió por última vez** y **qué se pierde si no corre**
  (los dos textos ya están en `tareas-automaticas.ts`).
- **En rojo las que dicen "nunca" y las atrasadas.** Sin adornos: si nunca corrió,
  que se lea "nunca corrió".
- **Decí desde qué botón del menú se llega.** Una pantalla sin puerta no existe.

# BLOQUE 2 — La pantalla "¿Qué está conectado?"

Lo mismo para las conexiones con plataformas de afuera. Hay veinte y el dueño no
tiene forma de saber cuáles andan.

- Una fila por conexión: Google Analytics, Facebook, Instagram, WhatsApp, Mercado
  Pago, Google Calendar, Spotify, YouTube, TikTok, Threads, X, Meta Ads, la ficha
  de Google.
- Tres estados nada más: **conectada**, **falta configurarla**, **no se usa**.
- Para las que falten, **una línea en criollo de qué se pierde**. Nada de nombres
  técnicos en pantalla.

## Lo que no se negocia en estos dos bloques

> **Si un dato no está medido, la pantalla lo dice. Nunca inventa.**

Ya pasó dos veces: los números del panel de redes escritos a mano, y un cartel de
"ficha verificada en Google" sin nada detrás. **Las dos veces el dueño creyó que
algo estaba resuelto y no lo estaba.** Es el peor daño que puede hacer una
pantalla.

# BLOQUE 3 — Que la app se dispare sola cuando alguien la usa

**Dato corregido:** de las cuatro tareas, **el blog ya tiene disparador** —
`MarketingAutomationTrigger` en `src/components/app-shell.tsx` llama a
`/api/marketing/automation` cuando un administrador abre la app—. **Las otras tres
no tienen nada**: los números de las redes, los posteos programados y los
recordatorios de cuota.

Este bloque es para esas tres. Mientras el disparador de verdad no esté prendido
por fuera, **que al menos corran cuando el equipo entra a la app**, con el mismo
mecanismo que ya funciona para el blog. **No lo rehagas: copiá el que está.**

- Al abrir la pantalla del punto 1, si hay una tarea vencida, **que se dispare en
  segundo plano**, sin trabar la pantalla.
- **Sólo las que ya están vencidas.** `runMarketingAutomation` ya tiene el control
  de "¿me toca?": usalo, no lo rehagas.
- **Nada que le escriba a un cliente se dispara así.** Los recordatorios de cuota
  vencida y cualquier cosa que salga por WhatsApp **esperan a que una persona
  apriete el botón**. Es la diferencia entre una tarea al día y un mensaje que le
  llega a alguien a las tres de la mañana.

# BLOQUE 4 — Lo que hay que prender por fuera, escrito para el dueño

El disparador de verdad se prende una sola vez y **no es código**.

- Un documento corto, `docs/PRENDER-LAS-TAREAS.md`, con **los cuatro renglones
  exactos**: la dirección de cada tarea, cada cuánto tiene que correr, y el nombre
  que conviene ponerle.
- Escrito para alguien que no programa: qué se abre, dónde se aprieta, qué se
  pega. **Sin jerga.**
- Las frecuencias que corresponden: las notas del blog una vez por semana; los
  números de las redes una vez por día; los posteos programados cada quince
  minutos; los recordatorios de cuota una vez por día, de mañana.

# BLOQUE 5 — Que el DJ vea la lista del cliente

**Sale del primer barrido con el método nuevo, y es de fiesta.**

El cliente carga en su portal las canciones infaltables y las que no quiere que
suenen. **Se guardan bien** (`listaMusicaPortal`, en `src/app/actions/fiesta/portal.actions.ts`)
**y la pantalla del DJ nunca las lee**: sólo mira los pedidos que hacen los
invitados esa noche (`getSongRequests`).

El portal le prometía al cliente que su lista *"se sincroniza en tiempo real con
el DJ"*. **Ya se corrigió el texto** para que no prometa lo que no pasa. Falta lo
otro: que pase.

**Qué hacer:** en la pantalla del DJ (`src/app/evento/dj/[fiestaId]/page.tsx`),
un bloque fijo arriba con **las infaltables** y, bien separadas, **las que no
tienen que sonar**. Que se lean de un vistazo en la oscuridad de la cabina: pocas,
grandes, sin scroll para las infaltables.

**Por qué importa:** en un casamiento, que no suene la canción que los novios
pidieron es de las pocas cosas que arruinan la noche y no se pueden arreglar
después.

---

## Lo que NO se toca

- **Plata, cobros, comida y permisos: eso lo escribe Claude.**
- **No inventes ningún dato en pantalla.** Si no está medido, se dice.
- **No dispares nada que le escriba a un cliente** sin que una persona apriete.
- **No rehagas** `tareas-automaticas.ts` ni `runMarketingAutomation`.
- **No pongas ninguna clave dentro de un archivo del repositorio.**

## Los controles antes de entregar

1. `npx tsc --noEmit`
2. `npx jest --silent`
3. `npm run check:acentos`
4. `npm run build`

Sobre el conjunto entero. **Resolvé los conflictos antes de subir:** ya llegó una
entrega con marcas de conflicto adentro y no compilaba.

## Cuando termines

Anotá en `docs/YA-RESUELTO.md` sólo lo que hiciste, actualizá
`docs/QUE-HAY-EN-LA-APP.md`, avisá el número de la propuesta y mové este archivo a
`hechas/` en la misma propuesta.
