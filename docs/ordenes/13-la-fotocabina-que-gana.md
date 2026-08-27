# Orden 13 — La fotocabina, mejor que Sparkbooth

**Para Gemini. Escrita el 27 de agosto de 2026. URGENTE: el dueño la va a usar en una fiesta.**

## CÓMO SE ENTREGA

**UNA SOLA PROPUESTA DE CAMBIOS con todos los bloques adentro.** Si uno se traba, entregá el
resto igual en la misma propuesta y avisá cuál faltó.

Antes de darla por terminada: compila, pruebas en verde, `npm run check:acentos` limpio, y
`docs/YA-RESUELTO.md`, `docs/QUE-HAY-EN-LA-APP.md` y `docs/MANUAL-DE-LA-APP.md` actualizados
**en la misma propuesta**.

**Y esta lleva algo más: se prueba en un navegador de verdad, con la cámara puesta.** Es una
pantalla de cámara y pantalla completa; el proyecto lo exige y acá no se negocia.

---

## Lo que ya está bien, y NO se toca

Se reviso a fondo el 27 de agosto. Esto anda y esta bien resuelto:

- **El arranque como kiosco.** `/evento/fotocabina` → elegís la fiesta → tocás "Fotocabina" →
  PIN de 4 dígitos → queda bloqueada. Probado en navegador: funciona.
- **La tanda de tres fotos** con cuenta regresiva y guía en pantalla antes de cada una.
- **El armado de la tira**: 1 foto grande arriba y 2 abajo, **10x15 cm vertical a 1200x1800**,
  que es la medida exacta que imprime el dueño. Coincide con el recuerdo que él entrega hoy.
- **El pie personalizado**: nombre del homenajeado en manuscrita grande, motivo debajo, fecha
  y logo de AK. Se llena solo con los datos de la fiesta.
- **Si falla la cámara, se le avisa al operador.** Si falla el armado de la tira, queda la
  última foto en vez de dejar al invitado sin nada.
- **Guarda sin internet** y sincroniza después. QR, WhatsApp, impresión y cambio de cámara.

**No rehagas nada de esto.**

---

## BLOQUE 1 — EL FONDO DE LA FIESTA (esto es lo urgente)

**El problema, en una línea:** el recuerdo sale con el fondo pelado.

El dueño entrega tiras con un **fondo decorado** —el lila con mariposas de la fiesta de
Areli, por ejemplo— y ese fondo hoy **no llega nunca a la tira**.

`componerTiraDeFotos` en `src/lib/entretenimiento/tira-fotocabina.ts` **ya sabe recibirlo**:
acepta `imagenFondoUrl` y `colorFondo`. Lo verificamos: la fotocabina **nunca se los pasa**
(cero menciones en `src/app/evento/fotocabina/[fiestaId]/page.tsx`), y peor, el objeto que
recibe la pantalla —`PublicEntertainmentEvent` en `src/lib/entertainment/station-config.ts`—
**ni siquiera los tiene**. Es el caso de `docs/COMO-AUDITAR.md`: escrito, compilando, sin
producir nada.

### De dónde sale el fondo, y por qué esto es lo que gana

**De la invitación digital de esa misma fiesta.** El cliente ya eligió su arte y su paleta
cuando se armó la invitación (`cabecera.imagenFondoUrl` y `paletaColores` en
`src/types/fiesta.ts`). **Ese es el diseño de la fiesta, ya elegido y ya aprobado.**

Entonces la fotocabina no tiene que pedirle a nadie que diseñe nada: **toma el arte de la
invitación y el recuerdo sale combinando con la fiesta, solo.**

**Ésa es exactamente la ventaja sobre Sparkbooth**, que obliga a alguien a armar una
plantilla por evento con un editor. Acá no hay plantilla que armar: la fiesta ya se
diseñó una vez y el recuerdo la hereda.

### Qué hacer

1. Sumar `imagenFondoUrl` y `colorFondo` a `PublicEntertainmentEvent` y llenarlos en
   `buildPublicEntertainmentEvent` desde la invitación de la fiesta.
2. Pasárselos a `componerTiraDeFotos` en la fotocabina.
3. **Que valga para todas las estaciones que imprimen**, no sólo la fotocabina: espejo
   mágico y 360 usan la misma función.
4. **Si la fiesta no tiene invitación armada**, cae en el color de la fiesta como hoy. Nada
   se rompe.

---

## BLOQUE 2 — La pantalla que promete cuatro cosas que no existen

En `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx`, la fotocabina figura con
**`['Foto', 'GIF', 'Boomerang', 'Filtros', 'Marcos', 'Impresión', 'Galería live',
'QR/WhatsApp']`** y con **`['Diseños personalizados', 'Filtros en vivo', 'Impresión rápida',
'Captura de correos']`**.

Se buscó en el código de la fotocabina: **cero menciones de GIF, boomerang, filtros y
correos.** Las cuatro no existen.

Esa pantalla la lee el dueño para saber qué está vendiendo. **Dejá sólo lo que la app hace
de verdad.** No agregues las funciones para que la lista quede linda: sacá la lista.

Si alguna se hace más adelante, se vuelve a poner. Es la regla de siempre: **ninguna
pantalla afirma algo que no comprobó.**

---

## BLOQUE 3 — Que se pueda configurar por fiesta

Hoy está todo clavado en el código y es igual para todas las fiestas:

- **Los cinco marcos** (`FRAMES` en la pantalla de la fotocabina): "Sin Marco", "Dorado",
  "Neón", "Flores", "AK Brand".
- **Tres fotos por tanda** (`FOTOS_POR_TANDA`).
- **Diez segundos** de cuenta regresiva (`SEGUNDOS_PRIMERA_FOTO`).
- **Los textos de guía** antes de cada foto (`GUIA_POR_FOTO`).

Que se configuren por fiesta, desde la pantalla de entretenimiento que ya existe:

- **Cuántas fotos** (1 a 4) y **cuántos segundos** de cuenta regresiva.
- **Qué marcos se ofrecen** en esa fiesta. Para unos quince de una nena que eligió lila, el
  marco "Neón" violeta sobra y "Flores" va.
- **Con los valores de hoy como valores por defecto**: si nadie toca nada, se comporta igual que
  ahora. **Nada se rompe para las fiestas ya cargadas.**

---

## BLOQUE 4 — Lo que a Sparkbooth le falta y acá se puede tener gratis

El dueño lo pidió así: *"tiene que ser mejor que esta plataforma."* No se gana copiándole
funciones: se gana con lo que Sparkbooth **no puede tener**, porque es un programa suelto y
esto vive adentro de la app que ya conoce la fiesta.

Hacé estas tres, que son las que él no puede igualar:

1. **Cero configuración por evento.** Es el bloque 1. Sparkbooth necesita que alguien arme
   una plantilla por fiesta; acá el recuerdo sale con el arte de la fiesta sin que nadie
   toque nada. **Es la ventaja más grande y es la que hay que rematar.**
2. **El invitado se lleva la foto sin cables.** Ya hay QR y WhatsApp: revisá que el QR sea
   grande y se lea de lejos, y que el mensaje de WhatsApp salga con el nombre de la fiesta.
3. **La galería en vivo.** Las fotos de la fotocabina van al muro social del evento y se ven
   en las pantallas del salón mientras la fiesta pasa. Verificá que eso esté enganchado.

**Lo que NO hay que hacer:** ponerse a programar GIF, boomerang ni filtros de cara para
empatarle. Son caros de hacer, pesados en una tablet y **no es lo que hace que una fiesta se
vea mejor**. Si el dueño los quiere, que los pida.

---

## Cómo se comprueba que quedó bien

Con una fiesta que tenga invitación armada, abrir la fotocabina en un navegador con cámara,
sacarse la tanda y mirar el resultado:

- **El fondo del recuerdo tiene el arte de la fiesta**, no un color liso.
- Sale a 10x15 vertical y entra derecho en la impresora.
- La pantalla de entretenimiento **ya no promete GIF, boomerang, filtros ni correos**.
- Cambiando la cantidad de fotos a 4 en la configuración, la fotocabina saca cuatro.
- Una fiesta vieja sin configurar se comporta exactamente igual que hoy.
