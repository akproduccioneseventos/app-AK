# Devolución — tercera vuelta. **Falta UNA sola cosa.**

**Medido el 2 de septiembre de 2026 sobre `feat/orden-34`.**

## Lo que quedó BIEN. No lo toques.

- **El elemento invisible ya no está** en ninguna de las dos landings.
- **`/landing/bodas` y `/landing/xv-anos` volvieron a ser un enlace** a la página de verdad.
- **La vista previa en vivo del fondo está en las tres estaciones** —fotocabina, Bogue y
  Touchpix—, con el bucle que dibuja cuadro a cuadro. El invitado ahora **ve el fondo antes de
  sacarse la foto**. Touchpix, que había quedado afuera, entró.
- **Los cinco bloques de la portada se mueven**: testimonios, galería, por qué elegirnos, el
  proceso y el botón grande.

---

## LO ÚNICO QUE FALTA: el movimiento quedó sin destino

El cambio se llama *"animación real en destino"*, pero **los destinos no se mueven**. Medido
archivo por archivo:

| Pantalla | `whileInView` |
|---|---|
| `src/app/bodas/page.tsx` | **0** |
| `src/app/quinceaneras/page.tsx` | **0** |
| `src/components/landing/EventLandingPage.tsx` | **0** |

Sacaste bien la animación trucha, **pero no la pusiste en la página de verdad**. Las landings de
bodas y de quince —las que ve el prospecto que llega de Google— **quedaron completamente
quietas**, que es peor que como estaban al empezar.

### Qué hacer, y es un solo archivo

**`src/components/landing/EventLandingPage.tsx`** (232 líneas) es el componente que arma **las
dos** landings. Poniendo el movimiento ahí, quedan las dos resueltas de una.

Seguí la habilidad **`animaciones-pro`**, que está instalada en el proyecto y trae el patrón
completo. En criollo:

- **El bloque de servicios, el detalle y el cierre entran al llegar a la pantalla**, en cascada
  de 0,08 segundos, **una sola vez**.
- **El título, la primera imagen y el botón de contacto NO se animan.** Se ven de entrada. Eso
  ya está bien y no se cambia.
- Usá `SUAVE` de `src/lib/motion.ts`, que ya existe.

### Y arreglá la prueba, que está mirando al lado

`tests/e2e/la-web-de-venta-se-mueve.spec.ts` mide el movimiento en **`/quinceaneras`**, que es
justo una de las que no se mueve. **O está fallando, o está pasando por el motivo equivocado**,
y las dos cosas quieren decir lo mismo: hoy esa prueba no dice la verdad.

Cuando el componente se mueva, la prueba tiene que **fallar si alguien saca el movimiento**.
Comprobalo sacándolo a propósito una vez, y volvé a ponerlo.

---

## Antes de decir que terminaste

1. `npx jest src/__tests__/nada-de-animaciones-de-mentira.test.ts` — verde.
2. `npm run ordenes?` — y acordate: **que dé verde no alcanza**, ya pasó dos veces.
3. `npm run "publicar?"` completo, **una sola vez, al final**.
4. `npm run limpiar:corrida`.
5. Anotado en `docs/YA-RESUELTO.md` con su línea en el bloque `comprobar`.
