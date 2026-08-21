# Lo que queda: las puertas, y que el informe de auditoría se pueda leer

**Para:** Gemini (Antigravity)
**Escrita:** 19 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los DOS bloques que quedan adentro** (el 7 y el 8). Cada fusión dispara
un despliegue y eso se paga. Si un bloque se traba, entregá el resto igual, en la
misma propuesta, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.** Las últimas entregas llegaron
hechas sobre una base vieja, y una traía adentro la anterior entera: habría borrado
tres correcciones sin que se notara.

Antes de tocar nada, leé `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md`.

## Lo que YA ESTÁ HECHO — no lo rehagas ni lo toques

El tótem de la barra (`src/app/evento/barra/[fiestaId]/page.tsx`) es la pantalla
táctil del salón: se pide el trago, y te sacás una foto o un video con él. **Es
como la fotocabina pero SIN impresión**: lo que se saca va a la pantalla gigante y
queda guardado, nunca se imprime. Es a propósito del dueño.

Ya funciona y no se toca:

- Pedir el trago desde el tótem.
- La carta en carrusel de la pantalla grande.
- La cuenta regresiva de tres para la foto.
- **El video, que dura 8 segundos** (se bajó de 15: es un saludo con el trago en la
  mano, no un video). La constante es `DURACION_VIDEO_SEGUNDOS`, no la cambies.
- Las plantillas de marco y el envío a la pantalla gigante.
- **La carta de tragos del celular del invitado ya es un carrusel**
  (`MiniQuiosco.tsx`): tarjetas grandes con la foto de protagonista, que se pasan de
  costado con el dedo. Ya está hecho, no lo rehagas.

---

# YA ENTREGADO Y FUSIONADO — no lo rehagas

Gemini entregó los bloques 1 a 4 el 19 de agosto y están publicados:

- **El invitado se lleva su foto del tótem** con un código en pantalla para
  escanear con el celular.
- **La foto guarda con qué trago se sacó.**
- **El interruptor de "seguime en las redes" funciona**: si está prendido, el tótem
  pregunta antes de subir.
- **El buzón de saludos acepta fotos**, además del video de 15 segundos y el audio, y
  se llega desde el portal del invitado.

Al fusionar hubo que sacar un botón duplicado del buzón en el portal del invitado
—quedaban dos— y limpiar dos archivos con caracteres invisibles de un editor de
Windows. Nada más.

---

## Y los bloques 5 y 6 también, el 20 de agosto

- **Las fotos de las estaciones ya tienen dueño.** La fotocabina, el espejo mágico,
  la plataforma 360 y el 360 con inteligencia artificial reciben el enlace personal
  del invitado. Respetó la regla: **el dueño se guarda sólo si el comprobante es
  válido**; sin comprobante la foto se sube igual, sin dueño.
- **El anfitrión ya puede cargar su historia y sus hospedajes** en la invitación, con
  los ejemplos como texto gris dentro del campo vacío y las filas nuevas vacías.

---

# BLOQUE 7 — Las puertas que quedan

**Estado al 20 de agosto: de las 84 que quedaban se cerraron 8.** Faltan las
demás. Se puede cortar por la mitad y entregar lo hecho: es el bloque más largo y
el que menos se rompe si queda a medias.

**Lo que hay que recordar de las últimas tandas, porque ya pasó:** cerrar varias
puertas de golpe **rompe por rebote las pantallas públicas**. Dejan de armarse una
sola vez y pasan a armarse en cada visita, que es la lentitud que el dueño
reporta. **Antes de entregar, mirá la tabla de rutas del build y confirmá que
estas nueve sigan estáticas:** `/`, `/bodas`, `/quinceaneras`, `/cumpleanos`,
`/catalogo`, `/club-uruguay`, `/public/blog`, `/simulador-de-presupuesto`,
`/experiencia-ak`.

# BLOQUE 9 — Que el informe de auditoría se pueda leer

`npm run auditoria` ya corre. **El problema es que su primer informe es
inutilizable**, y eso es peor que no tenerlo: son 201 hallazgos de código sin usar
y 120 frases a contrastar. Nadie lee eso dos veces.

Ya está escrito en `docs/COMO-AUDITAR.md` y lo repito porque es el punto entero:
**un control que grita cuando no pasa nada lo apaga cualquiera el primer día.**

## Qué hacer

1. **Agarrá veinte hallazgos al azar de la pasada 2** (código que nadie llama) y
   **abrí cada uno**. Contá cuántos son de verdad y cuántos son falsa alarma.
   Escribí el número en la entrega: es el dato que dice si el informe sirve.
2. **Arreglá el conteo para que no marque lo que sí se usa.** Las trampas ya
   conocidas: direcciones armadas por pedazos (`/fiestas/${id}/centro`), acciones
   de servidor que se llaman desde el navegador, y lo que sólo aparece en pruebas
   —que no es huérfano, es otra cosa, y va en una lista aparte—.
3. **Lo mismo con la pasada 4**, las 120 frases: la mayoría van a ser textos de
   venta, no promesas de que algo pasa solo. Quedate con las que prometen **una
   acción automática** —"se envía solo", "todos los días", "se sincroniza"— y
   descartá el resto.
4. **Meta: que cada pasada devuelva menos de veinte hallazgos y que nueve de cada
   diez sean reales.** Si una pasada no llega a eso, **es mejor que no reporte
   nada y lo diga**, antes que devolver ruido.

## Lo que NO se hace en esta orden

- **No arregles los hallazgos.** Esta orden afina el instrumento. Cada hallazgo se
  decide después, uno por uno, con el dueño.
- **No borres la pasada que da ruido.** Se afina, no se apaga.

# BLOQUE 8 — El impreso: ENTREGADO, sólo queda mirarlo en papel

**Se entregó el 20 de agosto** (tira de la fotocabina 10x15, con su prueba). No hay
que rehacerlo.

Lo único que queda es lo que ninguna prueba puede hacer: **imprimir una tira de
verdad y mirarla**. Que la fotocabina saque tres fotos, el espejo mágico y el 360
una sola, y la barra ninguna. Eso lo comprueba una persona en una fiesta.
