# Devolución de la propuesta 1191 (órdenes 30 y 34)

**Revisada el 2 de septiembre de 2026. NO se fusiona todavía.** Tres cosas, todas comprobadas
abriendo el archivo, no por un control.

**Lo que quedó bien y NO hay que rehacer:** el archivo `src/lib/motion.ts` con las curvas, el
movimiento en los componentes que no se nombran acá abajo, y **las correcciones anteriores del
recorrido, que esta vez no se perdieron** —la rama se armó sobre el trabajo previo, que es como
hay que hacerlo—.

---

## 1. El cambio de fondo está escrito y NUNCA SE EJECUTA

**Es lo más importante de la orden 34 y es lo que quedó sin hacer.** El código está y compila:

- `src/app/evento/fotocabina/[fiestaId]/page.tsx:351` llama a `procesarFondoCanvas`.
- `src/app/evento/bogue/[fiestaId]/page.tsx:394`, igual.

**Pero no corre nunca**, por tres motivos encadenados:

1. La llamada está adentro de `if (fondoVirtual && fondoVirtual.tipo !== 'ninguno')`
   (fotocabina, línea 350).
2. `fondoVirtual` arranca en `{ id: 'ninguno', tipo: 'ninguno' }` (línea 99) y **`setFondoVirtual`
   no se llama en ningún lado**: aparece una sola vez en el archivo, que es la declaración
   misma. **No hay ningún botón para elegir el fondo.**
3. Entonces la condición es **siempre falsa** y `procesarFondoCanvas` no se ejecuta jamás.

Y aunque se pudiera elegir, sigue mal: **`imagenFondo: undefined` está escrito a mano** (línea
355). El bloque 1 de la orden 34 pedía justo lo contrario, porque **eso es lo que deja la mancha
negra**: se recorta a la persona y no se dibuja nada atrás.

### Qué falta, concreto

- **Los tres botones en pantalla** —*Sin fondo* · *Fondo borroso* · *Fondo de la fiesta*—, que
  llamen a `setFondoVirtual`. Grandes, se tocan con el dedo.
- **Pasar la imagen de verdad** en `imagenFondo` cuando el tipo la necesita. Si no hay imagen
  cargada para esa fiesta, **no ofrecer esa opción** en vez de sacar una foto con un agujero.
- **Que se vea en la vista previa**, no sólo en la foto sacada. Hoy sólo se procesa al capturar,
  así que el invitado elige a ciegas.
- **Touchpix quedó afuera**: `src/app/evento/touchpix/[fiestaId]/page.tsx:55` sigue importando
  `procesarFondoCanvas` sin llamarlo.

---

## 2. Las landings arrancan INVISIBLES ENTERAS

Estos cuatro archivos envuelven **toda la página** en un fundido de entrada, con el título, el
precio y el botón de contacto adentro:

- `src/app/landing/xv-anos/page.tsx:11`
- `src/app/landing/bodas/page.tsx:11`
- `src/components/public/EventProcess.tsx:18`
- `src/components/public/WhyChooseUs.tsx:18`

**La habilidad `animaciones-pro` lo dice textual, en "Lo que NUNCA se anima al entrar":** el
título, el precio, el botón de contacto y la primera imagen se ven de entrada, quietos.

**Por qué importa, y no es estético:**

- Si el código tarda o falla, **lo que arrancó invisible queda invisible**, y el prospecto ve un
  hueco blanco justo donde estaba el precio.
- **Google mide cuánto tarda en verse lo más grande de la pantalla** y lo usa para ordenar los
  resultados. Empezar la página entera en invisible empeora esa medición.
- Y además **no queda bien**: la página entera moviéndose como un bloque se ve amateur. La orden
  pedía que **cada sección entre al llegar a ella, en cascada de cuatro escalones**.

### Qué hay que hacer

Sacar el `motion.div` que envuelve todo, y animar **cada sección por separado con
`whileInView`**, como está el patrón completo en la habilidad. El primer bloque de cada
página —el que se ve sin bajar— **queda quieto**.

---

## 3. La prueba nueva da falsa confianza

`tests/e2e/la-web-de-venta-se-mueve.spec.ts`. Las tres pruebas pasan con la web **completamente
quieta**:

- **La número 2** se llama *"Las secciones se animan y cambian de posición suavemente"* y lo
  único que comprueba es que una sección **contenga texto**. No mide movimiento en ningún lado.
- **La número 1 y la 3** usan `toContainText`, que **pasa aunque el elemento esté invisible**.
  Por eso ni siquiera agarraron el problema 2 de esta devolución.

**Es la regla del proyecto que más caro salió: nunca una prueba escrita para que el control se
calle.** Una prueba que no comprobaría nada real tapa el agujero sin cerrarlo.

### Cómo tienen que quedar

Las tres están escritas con el código exacto en `.claude/skills/animaciones-pro/SKILL.md`,
sección *"Cómo se prueba que la animación es de verdad"*:

1. **Que se mueva de verdad**: comparar la posición del bloque al entrar y medio segundo
   después, y que **sea distinta**.
2. **Que no esconda lo que vende**: `toBeVisible()` —no `toContainText`— sobre el título y el
   botón de contacto, **apenas carga**.
3. **Con el movimiento desactivado**: todo **quieto pero VISIBLE**.

Y una más, para el bloque 1: **que al elegir "fondo borroso" la foto capturada salga distinta**
de la capturada sin fondo. Sin eso no hay forma de saber si el fondo anda.

---

## Antes de volver a entregar

1. `npm run ordenes?` — pero **ojo, que esta vez dio 10 de 10 y 8 de 8 con todo esto adentro**.
   Que dé verde no alcanza: el control mira que el nombre esté, no que la función se ejecute.
2. `npm run "publicar?"` completo en verde, una sola vez, con todo junto.
3. `npm run limpiar:corrida`.
4. Anotado en `docs/YA-RESUELTO.md` con su línea en el bloque `comprobar`.
