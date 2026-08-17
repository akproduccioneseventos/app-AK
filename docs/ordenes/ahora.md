# Lo que falta — cuatro cosas, y una es la mitad de un módulo

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 17 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. Reemplaza al plan de catorce bloques, que ya
está cumplido y se movió a `hechas/`.

## Lo que YA está hecho y NO se toca

Las quince mejoras del plan anterior **están andando y se pueden usar**: trivia con
podio por mesa, misiones secretas, secretario que habla, llegada del equipo,
reunión que se agenda sola, aviso de margen, pregunta de los quince, configurador
de cierre, termómetro, libro de la fiesta, "lo tuyo ahora", video del recuerdo,
transmisión en vivo, pantallas de noche en oscuro y el centro de presencia digital.

**Están listadas con su pantalla en `docs/QUE-HAY-EN-LA-APP.md`. Leelo antes de
empezar** para no rehacer nada.

## Todo esto va en UNA SOLA PROPUESTA

Si algo se traba, entregá el resto igual y decí qué faltó.

---

# BLOQUE 1 — Publicar de verdad en las redes

**Es el más importante y es la mitad que le falta al centro de presencia digital.**

## El problema, verificado

`publishApprovedSocialPost()` en `src/app/actions/presencia-digital.ts` **marca el
posteo como publicado en la base y no manda nada a ninguna red.** No hay una sola
llamada a Facebook ni a Instagram en todo el archivo.

O sea: el dueño aprieta "publicar", la app le dice que se publicó, **y en su
Instagram no aparece nada.** Eso es peor que no tener el botón.

## Lo que hay que hacer

1. **Guardar el permiso de publicación de cada cuenta.** Hoy
   `src/app/actions/social-connections.ts` guarda sólo el usuario y el enlace:
   **no hay ningún permiso**. Hace falta el que Facebook entrega cuando el dueño
   conecta su página una vez.
2. **Publicar de verdad en Facebook e Instagram**, que son las dos que le sirven a
   AK y comparten el mismo camino.
3. **Que si falla, lo diga.** Nunca marcar como publicado algo que no salió. Si
   una red falla y la otra anda, decir cuál salió y cuál no.
4. **YouTube y la ficha de Google después.** TikTok al final, avisando que depende
   de que ellos aprueben la aplicación.

## Lo que no se negocia

> **Nada se publica solo.** El posteo queda esperando **un toque de aprobación**
> de una persona. Una publicación equivocada en el Instagram de la empresa no se
> puede deshacer.

Y el permiso de publicación es **dato sensible**: se guarda como los demás datos
protegidos de la app, nunca en un archivo que se suba al repositorio.

## Cómo se sabe que anda

**No alcanza con que compile.** Anda cuando el dueño aprieta el botón y el posteo
**aparece en el Instagram de AK**. Decilo en la entrega: probado o no probado.

---

# BLOQUE 2 — Que el importador de historial funcione

## El problema, verificado

`parseHistoricalSocialArchive` falla con *"El archivo no tiene un formato JSON/JS
válido de exportación"* **contra el archivo de ejemplo que trae su propia prueba**.

La función principal de ese bloque no funciona, así que el historial de las
cuentas no se puede cargar.

## Lo que hay que hacer

- **Hacerla andar contra los archivos de verdad** que exportan Instagram, Facebook
  y X cuando uno pide su información. No contra un formato inventado: bajate un
  archivo de exportación real y probá con ése.
- **Que su prueba pase**, con un ejemplo del formato verdadero.
- **Si un archivo no se entiende, que lo diga en criollo** y no rompa: "Este
  archivo no parece una exportación de Instagram. Fijate que sea el .zip que te
  manda Instagram cuando pedís tu información."

**Ojo:** el trabajo está en la rama `agent/historial-redes-sociales`, que **choca
con la app actual**. Sincronizá con `main` primero: las tres plataformas nuevas
(YouTube, Threads y X) **ya están en el tipo** y las tablas de colores e íconos
**ya están completas**. Ese trabajo ya no hace falta.

---

# BLOQUE 3 — Los datos de Google, sin lo demás

## El problema, verificado

La propuesta de posicionamiento tocaba **35 archivos, y sólo 3 eran de Google**.
Los otros 32 eran copias viejas de trabajo que ya entró, y su versión de
`src/app/actions/agenda.ts` **no tenía el freno de la reserva de turnos**: al
fusionarla se lo llevaba puesto y volvía a quedar abierto el agujero.

## Lo que hay que hacer

Sincronizar con `main` y volver a subir **sólo los 3 archivos de posicionamiento**:
los datos estructurados de negocio local y las etiquetas para cuando se comparte
el enlace. Nada más.

**Es poco trabajo y es lo valioso de esa propuesta.**

---

# BLOQUE 4 — Que la foto del muro sobreviva a cerrar la pantalla

**Éste es chico y opcional. Hacelo sólo si terminaste los tres de arriba.**

Cuando se cae la señal, la foto que el invitado quiso subir **queda en memoria**:
si cierra la pantalla, se pierde. Se le avisa con claridad —*"no cierres esta
pantalla"*— así que no se le miente, pero se podría hacer mejor.

**Por qué está así:** una foto de celular pesa varios megas y no entra en el
almacenamiento común del navegador. **Si encontrás una forma que aguante fotos de
verdad, hacela. Si no, dejalo como está y decilo:** el aviso honesto ya es mejor
que la promesa falsa que había antes.

---

## Lo que NO se toca nunca

- **Plata, cobros, comida y permisos: eso lo escribe Claude.**
- **Nada se publica ni se manda solo.** Siempre aprueba una persona.
- **Toda llamada de inteligencia artificial que se paga pasa por el contador**
  (`hayPresupuestoParaIA` antes, `registrarConsumoIA` después).
- **Todo lo que escribe datos pide `requireAppSession()`**, y si es público lleva
  freno con `enforcePublicRateLimit` **contando por el origen de la conexión, no
  por un dato que el visitante escribe** (si no, cambia el teléfono y arranca de
  cero).
- **No toques `robots.ts` ni `sitemap.ts`** para abrir páginas nuevas a Google:
  los portales de los clientes quedan afuera a propósito.
- **No hagas otro CRM, otra galería, otro asistente ni otro planificador.**
- **No enchufes `TriviaAdminPanel`**: está sin usar a propósito, porque el panel
  del muro social ya permite escribir las preguntas.

## Las tres cosas que trabaron todas las entregas anteriores

1. **Antes de usar una función o un campo, abrí el archivo y confirmá que existe.**
   Es lo que rompió tres entregas seguidas.
2. **Decí desde qué pantalla se ve cada cosa nueva.** En una sola tanda quedaron
   cuatro pantallas escritas que no se podían abrir desde ningún lado. Los cuatro
   controles no detectan eso.
3. **Anotá en `docs/YA-RESUELTO.md` sólo lo que hiciste de verdad**, y actualizá
   `docs/QUE-HAY-EN-LA-APP.md` con la pantalla desde la que se ve. Un informe dijo
   siete bloques y eran cuatro.

## Los controles antes de entregar

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

Sobre el conjunto entero. **Si `npx tsc --noEmit` da un solo error, no subas.**

## Cuando termines

Avisá el número de la propuesta y mové este archivo a `hechas/` en la misma
propuesta.
