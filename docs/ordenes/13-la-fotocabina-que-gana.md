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

### Qué hacer — con los nombres exactos, ya verificados

**No hace falta buscar nada: esto se rastreó el 27 de agosto y los campos son estos.**

1. **Sumar dos campos a `PublicEntertainmentEvent`**, en
   `src/lib/entertainment/station-config.ts` (línea ~49):

   ```ts
   imagenFondoUrl?: string;
   colorFondo?: string;
   ```

2. **Llenarlos en `getPublicEntertainmentEvent`** del mismo archivo (línea ~148), que es el
   que arma el objeto que recibe la pantalla. Los datos salen de la invitación digital de esa
   misma fiesta, y hay dos lugares donde pueden estar:

   - **El arte decorado**: `fiesta.invitacionDigital?.cabecera?.imagenFondoUrl`
     (`invitacionDigital` es de tipo `InvitacionDigitalData`, campo en `FiestaEnPlanificacion`
     línea ~1446; la cabecera está en `src/types/fiesta.ts` línea ~589).
   - **El color**: `fiesta.invitacionDigital?.cabecera?.paletaColores?.primary`, y si no está,
     `fiesta.invitacionConfig?.colorPrincipal` (línea ~509), y si tampoco,
     `fiesta.configuracion?.primaryColor`, que es lo que ya se usa hoy.

   **Ese orden importa:** el arte de la invitación es lo que el cliente aprobó y vio; es el
   que manda.

3. **Pasárselos a `componerTiraDeFotos`** en
   `src/app/evento/fotocabina/[fiestaId]/page.tsx` (línea ~356), donde ya se le pasan el
   nombre, el motivo, la fecha y el color:

   ```ts
   imagenFondoUrl: fiesta?.imagenFondoUrl,
   colorFondo: fiesta?.colorFondo,
   ```

   `componerTiraDeFotos` **ya sabe recibir los dos** (`src/lib/entretenimiento/tira-fotocabina.ts`,
   `DatosDeLaTira`, línea ~29). No hay que tocar esa función.
2. Pasárselos a `componerTiraDeFotos` en la fotocabina.
4. **Que valga para todas las estaciones que imprimen**, no sólo la fotocabina: espejo
   mágico y 360 usan la misma función.
5. **Una prueba que lo congele**, y que no se conforme con que el campo exista: que
   compruebe que **el valor llega de punta a punta**, desde la invitación hasta la llamada a
   `componerTiraDeFotos`. Hoy el campo existía en la función y nadie se lo pasaba, y ninguna
   prueba lo notó: es exactamente el agujero que hay que tapar.
6. **Si la fiesta no tiene invitación armada**, cae en el color de la fiesta como hoy. Nada
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

## Qué tienen las mejores plataformas del mundo, y dónde está parado AK

Se revisaron las que lideran el rubro en 2026: **Snappic, Simple Booth (LumaBooth),
dslrBooth, Curator, Salsa y Sparkbooth**. Todas cobran suscripción mensual —Snappic y
Curator arrancan en USD 69 por mes—.

| Lo que ofrecen las pagas | ¿AK lo tiene? |
|---|---|
| Tira impresa con plantilla por evento | **Sí**, y con la medida exacta 10x15 |
| Envío al invitado por QR | **Sí** |
| Envío por WhatsApp | **Sí** — muchas sólo mandan por correo o mensaje de texto |
| Galería en vivo del evento | **Sí**, el muro social |
| Varias estaciones (360, espejo, tótem) | **Sí, ocho módulos**: fotocabina, 360, bogue, espejo foto/firma/IA, tótems y cápsula del tiempo |
| Agrupar las fotos de cada invitado por su cara | **Sí, ya está hecho** (`face-indexer`) — es de lo más caro de las pagas |
| Funciona sin internet | **Sí** — varias de las pagas no |
| **Fondo y colores del evento sin configurar nada** | **NO todavía** — es el bloque 1 |
| Fondo verde por inteligencia artificial (sin telón) | No |
| GIF y boomerang | No |
| Filtros de cara / retoque | No |
| Captura de correo o teléfono del invitado | No |
| Números de uso del evento (cuántas fotos, cuántos compartieron) | No |
| **Costo por mes** | **AK: cero. Ellas: USD 69** |

### Lo que esto significa, y hay que entenderlo antes de programar

**AK ya tiene casi todo lo que cobran, y dos cosas que ellas no pueden tener:** ocho
estaciones bajo un mismo techo y, sobre todo, **la fiesta ya cargada en el sistema**.

Ninguna plataforma paga sabe cómo se llama la quinceañera, qué colores eligió, qué día es la
fiesta ni quiénes son los invitados. **Por eso todas necesitan que alguien arme una
plantilla por evento.** AK no: eso ya está cargado.

**Ahí se gana, y no copiándoles GIF y filtros.**

## BLOQUE 4 — Lo que a las pagas les falta y acá se puede tener gratis

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

4. **Los números del evento, que ninguna estación da hoy.** Cuántas fotos se sacaron,
   cuántas se imprimieron, cuántos se la llevaron por QR o WhatsApp, y a qué hora estuvo más
   movida la estación. Con eso el dueño le muestra al cliente lo que pasó en su fiesta, y
   sabe cuántos rollos de papel llevar la próxima vez. Las pagas lo cobran como función
   premium y **acá los datos ya se guardan**: hay que mostrarlos.

**Lo que NO hay que hacer:** ponerse a programar GIF, boomerang, filtros de cara o fondo
verde con IA para empatarles. Son caros de hacer, pesados en una tablet y **no es lo que hace
que una fiesta se vea mejor**. Si el dueño los quiere, que los pida.

**El orden importa:** el bloque 1 vale más que todos los demás juntos. Un recuerdo con el
arte de la fiesta, salido sin que nadie configure nada, es algo que ninguna de las seis
plataformas puede hacer.

---

## Cómo se comprueba que quedó bien

Con una fiesta que tenga invitación armada, abrir la fotocabina en un navegador con cámara,
sacarse la tanda y mirar el resultado:

- **El fondo del recuerdo tiene el arte de la fiesta**, no un color liso.
- Sale a 10x15 vertical y entra derecho en la impresora.
- La pantalla de entretenimiento **ya no promete GIF, boomerang, filtros ni correos**.
- Cambiando la cantidad de fotos a 4 en la configuración, la fotocabina saca cuatro.
- Una fiesta vieja sin configurar se comporta exactamente igual que hoy.
