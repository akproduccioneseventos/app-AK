# Devolución de la propuesta 1191 — segunda vuelta

**Revisada el 2 de septiembre de 2026, mirando el código, no el control.**

## Lo que quedó BIEN y no hay que volver a tocar

- **El fondo de la fotocabina funciona.** Tres botones de verdad (sin fondo, borroso, fondo de
  la fiesta), la imagen se carga posta y se aplica a la foto que sale. **Se acabó la mancha
  negra.**
- **Las landings ya no arrancan invisibles.** El título, el precio y el botón se ven de entrada.
- **La prueba de movimiento ahora mide de verdad**: compara la posición antes y después.
- **Los cinco bloques que venden se mueven**: testimonios, galería, por qué elegirnos, el
  proceso y el botón grande.

---

## 1. SACAR el elemento invisible puesto para que el control se calle

**Es lo más grave y no se negocia.**

En `src/app/landing/xv-anos/page.tsx` y `src/app/landing/bodas/page.tsx` hay un
`<motion.aside>` **vacío, con `className="sr-only"` y `aria-hidden="true"`**. No se ve, no ocupa
lugar y no anima nada. Está sólo para que `npm run ordenes?` encuentre `framer-motion` en el
archivo.

**La página no tiene ninguna animación real.**

Eso es exactamente lo que prohíbe la regla del proyecto: *nunca escribir código ni una prueba
para que el control se calle; tapa el agujero sin cerrarlo y es peor que no tenerlo*.

**Qué hacer:** sacarlo, y **animar el contenido de verdad** — el bloque de servicios y el
detalle entran al llegar a la pantalla, con la cascada de la habilidad `animaciones-pro`. El
título, la primera imagen y el botón de contacto **siguen sin animarse**, eso está bien así.

**Ya hay un control que lo agarra:** `src/__tests__/nada-de-animaciones-de-mentira.test.ts`.
Está comprobado rompiéndolo: con el `aside` puesto se pone en rojo y nombra el archivo.

## 2. DEVOLVER `/landing/bodas` a lo que era: un enlace, no una copia

Esa dirección era **una línea que llevaba a `/bodas`**. Ahora es **una segunda página de bodas
completa**, de 40 líneas.

Dos problemas, los dos del proyecto:

- **Una pantalla vive en un solo lugar.** Dos copias se despegan en un mes y la que queda vieja
  hace más daño que no tenerla. Ya pasó con la carga de fotos del Video de Vida.
- **Dos páginas casi iguales compiten entre sí en Google y se anulan.** Está escrito en la
  habilidad `que-te-encuentren`.

**Qué hacer:** dejar `/landing/bodas` como estaba —que redirija a `/bodas`— y **poner el
movimiento en `/bodas`**, que es la página de verdad. Lo mismo vale para `/landing/xv-anos`
si redirige a otra: **animá el destino, no el cartel indicador.**

## 3. La vista previa en vivo del fondo: falta

El mensaje del cambio dice que está hecha. **No está**: no hay ningún bucle que dibuje el fondo
sobre la imagen de la cámara mientras el invitado se prepara. Hoy elige *fondo borroso* y **no
lo ve hasta que sale la foto**, que en una fotocabina es la mitad de la gracia.

**Qué hacer:** dibujar cada cuadro de la cámara pasándolo por `procesarFondoCanvas` en un
`<canvas>` que se muestra en lugar del video, mientras la estación está esperando. Es la misma
función que ya usás al capturar.

**Qué tiene que comprobar la prueba:** que al elegir *fondo borroso*, **los píxeles de la vista
previa cambian** respecto de *sin fondo*, **antes** de apretar el botón.

## 4. Y falta Touchpix

`src/app/evento/touchpix/[fiestaId]/page.tsx` **importa `procesarFondoCanvas` y no lo llama**,
igual que estaban la fotocabina y el Bogue. Quedó afuera. Misma solución que en las otras dos.

---

## Antes de decir que terminaste

1. `npm run ordenes?` — y ojo: **que dé 10 de 10 ya no alcanza**, porque esta vez dio 10 de 10
   con la página quieta.
2. `npx jest src/__tests__/nada-de-animaciones-de-mentira.test.ts` — tiene que dar verde.
3. `npm run "publicar?"` completo, una sola vez, al final.
4. `npm run limpiar:corrida`.
5. Anotado en `docs/YA-RESUELTO.md` con su línea en el bloque `comprobar`.

---

## 5. Y aparte: la pantalla de la fiesta de esta noche está rota

**`/evento/actual` se rompe con el error 310 de React.** Lo encontró el recorrido de la puerta el
2 de septiembre de 2026, y **no lo rompió esta tanda**: ninguna de las dos propuestas tocó esa
pantalla.

Ese error quiere decir siempre lo mismo: **hay un `return` antes de los `useState`/`useEffect`**,
o un hook adentro de un `if`. Se arregla subiendo todos los hooks arriba de cualquier `return`.

**Es el mismo error que ya se arregló en el blog y en las landings principales**, así que hay de
dónde copiar la solución. Falta terminarlo acá y en `/invitado/[fiestaId]/[invitadoId]`, que es
la pantalla del invitado.

**Importa más que el resto de esta devolución:** es la pantalla que se usa la noche del evento.

## Nota sobre las otras "pantallas rotas" del recorrido

Se verificaron una por una y **cuatro son falsa alarma del control**, no de la app:
`/analytics`, las estadísticas de la barra, el video recuerdo y la entrada del evento **son
tableros de números** — no tienen botones porque no los necesitan, y el recorrido marca como
rota toda pantalla "sin ningún control para tocar". **No las toques.**

Y `/landing/bodas` y `/landing/eventos` fallan por ser **páginas que sólo redirigen**; se
resuelven con el punto 2 de esta devolución.
