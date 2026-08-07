# Orden de trabajo — Entretenimiento 02 (para terminar el módulo)

**Para:** Gemini (Antigravity)
**Escribe:** Claude (auditoría y verificación)
**Fecha:** 7 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Esta orden reemplaza a `entretenimiento-01.md`, que ya está hecha y fusionada
(propuestas #863 y #865). Acá está **todo lo que falta para dar el módulo por
terminado**.

---

## Cómo se trabaja esta orden

**Cinco propuestas completas, no veinte chiquitas.** Cada bloque de abajo es una
propuesta entera: se hace completo, se prueba completo y se sube una sola vez.
Dentro de un bloque, hacé todo lo que dice; no lo partas.

Lo que sí importa: **no mezcles dos bloques en la misma propuesta.** Si el bloque
C viene con un problema, no puede bloquear al bloque A que estaba bien.

Orden recomendado: **A, luego B, C, D y E en cualquier orden.** El A es el que
más cambia la experiencia y del que dependen los demás en criterio.

### Antes de subir, siempre

Corré los tres y que pasen los tres. **Si alguno falla, no subas:** la propuesta
vuelve sin revisar y perdemos una vuelta.

```
npx tsc --noEmit
npx jest --silent
npm run check:acentos
```

Guardá todo en **UTF-8**. Una propuesta anterior metió 902 acentos rotos y hubo
que cerrarla entera. Además de verse mal en pantalla, rompe las comparaciones de
texto con eñes: el código que buscaba "niño" dejó de encontrarlo y los platos de
chicos se contaban como adultos.

### Dos reglas de fondo, valen para todo

**1. Cada estación se vende y se usa por separado.** Un cliente puede contratar
sólo la fotocabina, o sólo la plataforma 360. Ninguna pantalla puede romperse ni
quedar vacía porque otra no esté contratada. Si algo depende de un dato que puede
no existir (mesa asignada, muro social, lista de invitados), tiene que funcionar
igual y explicar en una línea por qué no muestra eso.

**2. Ninguna pantalla puede mentir.** Si algo falló, se dice. Si un `catch` no le
muestra nada al usuario, está mal. Ya se corrigió este defecto una vez: las cuatro
estaciones de captura mostraban "Escaneá tu recuerdo" con una rueda girando para
siempre cuando la subida había fallado, y la gente se iba de la fiesta creyendo
que tenía su foto.

---

# BLOQUE A — El entretenimiento sabe quién es cada invitado

**Propuesta completa. Hacer los tres puntos juntos.**

## Por qué esto es lo más importante

Se investigaron las plataformas comerciales del rubro: muros de fotos en vivo
(Guestpix, Kululu, Wedbox, GuestLense, Instawall, VeamosLasFotos, EventPix) y
juegos en vivo (Kahoot, Slido, AhaSlides, Crowdpurr, TriviaMaker, My Wedding
Trivia).

**Ninguna sabe quién es cada invitado.** No conocen la lista, ni quién confirmó,
ni en qué mesa está sentado nadie, porque nunca tuvieron esos datos. Son
herramientas anónimas. La app de AK sí los tiene.

Eso no se copia con animaciones más lindas. Es la única ventaja que las otras no
pueden alcanzar, y hoy está sin usar.

## A.1 — Terminar la trivia por mesa

En la propuesta #865 quedó armado el ranking por mesa en
`src/lib/games/game-engine.ts` (`calculateLeaderboard` ya suma por
`tableNumber`) y la pantalla que lo muestra en
`src/components/games/LeaderboardDisplay.tsx`.

**El problema:** nada completa el campo `tableNumber` de cada participante. Lo
verifiqué: no hay un solo lugar en el código que lo escriba. En una fiesta real
el ranking por mesa sale **siempre vacío**.

**Qué hay que hacer:** cuando el invitado entra a la trivia con su enlace
personal (`guestId` + token, como ya hacen el hub y la red social), buscar su
mesa asignada y guardarla en el participante. A partir de ahí el ranking por mesa
se llena solo.

**Cuidado obligatorio:** el invitado **sin mesa asignada tiene que poder jugar
igual**, y sumar en el ranking individual. Nada de bloquearlo ni mandarlo a una
pantalla de error. Y si en esa fiesta nadie tiene mesa, la sección de ranking por
mesa no se muestra (eso ya está resuelto: se oculta si la lista viene vacía).

## A.2 — Que el muro salude por nombre

Cuando un invitado sube una foto desde su enlace personal, el muro no debería
mostrar "Invitado" ni pedirle que escriba su nombre: ya sabemos quién es.

**Qué hay que hacer:** si la subida viene con la identificación del invitado,
guardar el nombre real junto a la publicación y mostrarlo en el muro y en la
pantalla gigante.

**Cuidado obligatorio:** si la foto viene de una estación del salón sin invitado
identificado — el caso de la fotocabina con el QR general — tiene que seguir
funcionando exactamente igual que hoy, sin nombre. **Nunca le pidas al invitado
que se registre.** Eso es justamente lo que hace molestas a las otras
plataformas: la nuestra no puede caer en lo mismo.

## A.3 — Pruebas

Que quede cubierto con pruebas: un invitado con mesa suma a su mesa, uno sin mesa
juega y puntúa individualmente, una foto con invitado identificado muestra el
nombre, y una del QR general no muestra ninguno y no falla.

**Cómo se sabe que el bloque A quedó bien:** con invitados de dos mesas
distintas, cada punto va al total correcto y el ranking por mesa se ordena bien.
Un invitado sin mesa juega sin problemas. Una foto subida desde el enlace
personal aparece con nombre; una del QR del salón, sin nombre y sin errores.

---

# BLOQUE B — El álbum de la fiesta en el portal del cliente

**Propuesta completa.**

## Por qué

Las plataformas de internet guardan las fotos entre 2 meses y 1 año, en su sitio,
y varias cobran extra por bajarlas en buena calidad. Acá el cliente ya tiene su
portal: el material de su fiesta tiene que estar ahí, suyo, sin plazo ni costo
extra. Es un argumento de venta que ninguna de ellas puede igualar.

## Qué hay que hacer

Una sección nueva en el portal del cliente con todo lo que quedó de la fiesta:
fotos y videos de las estaciones contratadas, y los mensajes de la cápsula del
tiempo. Con la posibilidad de descargar todo junto.

**Cuidado obligatorio:** sólo el material de las estaciones que ese cliente
contrató. Si contrató una sola, se ve una sola, **sin secciones vacías** de las
que no contrató. Nada de mostrarle un cartel de "no tenés videos 360" a alguien
que nunca los compró: eso parece un error o un intento de venta, y queda mal.

**Cómo se sabe que quedó bien:** un cliente con una sola estación contratada ve
sólo esa; uno con varias las ve todas; y la descarga junta funciona en las dos
situaciones.

---

# BLOQUE C — Que la IA no se coma la ganancia

**Propuesta completa. Este bloque toca plata: leelo dos veces.**

## C.1 — Poner un tope de generaciones (lo más urgente de toda la orden)

**Verificado leyendo el código:** en
`src/app/evento/touchpix/[fiestaId]/page.tsx`, la función `applyAiTheme` dispara
una generación con IA **cada vez que el invitado toca un estilo distinto**. No hay
ningún tope: ni en la pantalla, ni en `src/app/actions/touchpix-ai.ts`, ni en
`src/app/actions/espejo-magico-ai.ts`. Busqué límites, enfriamientos y contadores:
no existe ninguno.

Un invitado curioso prueba diez estilos y son diez imágenes generadas. **Cada una
se paga.** Multiplicado por los invitados de una fiesta, el costo no tiene techo.

**Qué hay que hacer:** un tope de generaciones por invitado y por sesión,
configurable, con un valor por defecto razonable (empezá con 3). El tope se
comprueba **en el servidor**, no sólo en la pantalla: si sólo está en la pantalla,
no sirve de nada.

Cuando se alcanza el tope, el invitado tiene que entenderlo sin frustrarse: que
diga algo como "ya generaste tus 3 estilos, elegí con cuál te quedás", y que pueda
volver a ver los que ya generó y quedarse con uno. **No le tires un error.**

## C.2 — Que la espera no mienta

En `src/app/evento/espejo-magico/[fiestaId]/page.tsx`, los pasos del progreso
avanzan con relojes fijos a los 2, 4,5 y 7,5 segundos, sin relación con lo que
está pasando de verdad. El tope de espera es de 60 segundos. Si la IA tarda 50, el
invitado ve "Renderizando…" quieto durante 40 segundos y no sabe si se colgó.

**Qué hay que hacer:** que el último paso muestre que sigue trabajando (algo vivo,
no un texto congelado) y que después de un tiempo prudencial avise que está
demorando más de lo normal y ofrezca cancelar. Nada de números de porcentaje
inventados.

## C.3 — Una sola lista de estilos

Las plantillas del espejo mágico están definidas **dos veces**: en
`src/app/actions/espejo-magico-ai.ts` y en
`src/lib/entertainment/espejo-magico-templates.ts`. Y touchpix define sus temas en
la pantalla, aparte de los que tiene el servidor en `touchpix-ai.ts`.

Si alguien corrige un nombre en un lado y no en el otro, la pantalla muestra un
estilo y la IA genera otro.

**Qué hay que hacer:** dejar **una sola fuente** para cada estación y que todo lo
demás la importe de ahí. No dupliques la lista nunca más.

**Cómo se sabe que el bloque C quedó bien:** el tope se respeta aunque se lo
intente saltear desde afuera de la pantalla; al alcanzarlo el invitado recibe un
mensaje amable y puede quedarse con uno de los que ya generó; y cambiar el nombre
de un estilo en un solo archivo lo cambia en toda la app.

---

# BLOQUE D — Que cada estación funcione sola

**Propuesta completa.** Esta revisión quedó a medias por falta de tiempo, así que
**primero hay que revisar y después arreglar**. Si al revisar no encontrás nada
roto, decilo y la propuesta queda en las pruebas que lo demuestren: eso también
vale.

## Qué hay que revisar

El dueño vende cada estación por separado. Hay que confirmar que eso funciona de
verdad, no que se asume.

1. **¿Alguna estación de captura necesita el muro social para funcionar?** Si el
   cliente no contrató el muro: ¿la foto se pierde? ¿La pantalla se rompe? ¿El
   invitado igual puede llevarse su copia? La copia del invitado **nunca** puede
   depender del muro.
2. **El hub y la zona digital son menús.** Si el cliente contrató una sola
   estación, ¿muestran una sola opción o quedan llenos de tarjetas muertas?
3. **La galería**: si el muro social no está contratado pero sí la fotocabina,
   ¿se ven igual las fotos?
4. ¿Hay algún lugar donde el código dé por hecho que una estación está habilitada
   sin comprobarlo, y reviente si no lo está?

Archivos por donde empezar: `src/lib/entertainment/station-config.ts`,
`src/app/actions/fiesta/entretenimiento.actions.ts`, y las pantallas de
`src/app/evento/`.

**Qué hay que entregar:** los arreglos de lo que esté mal, **y pruebas que
simulen una fiesta con una sola estación contratada**. Esa prueba es lo que evita
que el problema vuelva.

---

# BLOQUE E — Que el operador se entere antes que el invitado

**Propuesta completa.** Igual que el bloque D: primero revisar, después arreglar.

## La pregunta a responder

**¿El operador de AK se entera cuando algo no funciona, o se entera cuando un
invitado se queja?** Hoy, en general, se entera por la queja. Eso hay que darlo
vuelta.

Ya se resolvió un caso: la cabina del operador avisa si la transformación con IA
no está disponible, en vez de que se descubra cuando el primer chico eligió
"Superhéroe" y recibió su foto común (propuesta #866). **Ese es el modelo a
seguir para el resto.**

## Qué hay que revisar y resolver

1. **Fallas que el operador no puede ver:** estaciones caídas, subidas que
   fallan, cámara sin permiso, sesión trabada.
2. **Sesiones trabadas:** si un invitado se va a mitad de camino, ¿el operador
   puede liberar la estación para el siguiente, o queda bloqueada?
3. **Una prueba antes de la fiesta:** que el operador pueda comprobar que cada
   estación contratada funciona, **antes** de que llegue el primer invitado. Esto
   por sí solo evita la mayoría de los problemas.
4. Controles que dicen que hicieron algo y no lo hicieron.

Archivos por donde empezar:
`src/app/(app)/fiestas/nueva/entretenimiento/page.tsx`,
`src/app/actions/fiesta/entretenimiento.actions.ts`,
`src/app/actions/fiesta/sesion-entretenimiento.ts`, y el modo `role=operator` de
las páginas de las estaciones.

---

## Lo que NO hay que tocar

- Presupuestos, cobros, facturas, descuentos. El único punto de esta orden que
  roza la plata es el tope de generaciones del bloque C, y está descrito ahí.
- Permisos de acceso y quién puede ver qué, más allá de lo que dice cada bloque.
- El ajuste anual del 15% y los descuentos de marketing son decisiones tomadas del
  dueño: no son errores.
- Los controles rojos de GitHub son por facturación de la cuenta. No los
  investigues: lo que vale es lo que se verifica localmente.

## Cuando termines cada bloque

Avisá el número de la propuesta. Se verifica y se fusiona, o vuelve con el motivo
en una línea. Cuando estén los cinco, el módulo queda terminado.
