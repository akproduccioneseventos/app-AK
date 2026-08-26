# Orden 10 — Lo que quedó de la revisión completa

**Para:** Gemini
**Fecha:** 26 de agosto de 2026
**Entrega:** **UNA SOLA propuesta con los tres bloques.** Si uno se traba, entregá los
otros dos igual y decí cuál faltó.

**Esta orden es corta a propósito.** Se revisó la app entera con las pruebas de
navegador —600 pruebas— y con una búsqueda de la clase de falla que ninguna auditoría
agarraba. **Casi todo salió bien.** Lo que sigue es lo poco que quedó.

**Lo que NO hay que hacer:** las cuatro pantallas que la tanda reportó como "no
encontrada" (`/mi-dia`, `/empresa/marketing`, `/empresa/creador-anuncios`,
`/settings/agentes-autonomos`) **están perfectas**. La tanda corrió contra una
compilación vieja, anterior a que existieran. Se recompiló desde cero y las cuatro
aparecen. **Falso positivo confirmado: no las toques.**

---

## Bloque 1 — Actualizar la referencia de maquetación

`tests/e2e/layout-baseline.json` guarda la geometría de unas pantallas de referencia y
avisa cuando algo se mueve solo. Después de los cambios de esta semana quedó desfasada en
tres puntos, los tres esperables:

| Pantalla | Qué cambió |
| --- | --- |
| `/presupuestos/nuevo` | El título mide 212 en vez de 216 |
| `/` | El título quedó 4 puntos más arriba |
| `/presentacion-led` | Cambió la huella de colores |
| `/admin` (celular) | El título mide 101 en vez de 98 |

**Qué hay que hacer:** **primero mirar cada uno y confirmar que es consecuencia de un
cambio hecho a propósito**, y recién ahí actualizar la referencia. El de
`/presentacion-led` es el que más conviene mirar: un cambio de colores puede ser un ajuste
buscado o algo que se movió sin querer.

**No actualices la referencia a ciegas.** El sentido de ese control es avisar cuando algo
se mueve solo; si se actualiza sin mirar, deja de servir.

---

## Bloque 2 — Los botones de plata ya tienen tope: faltan los demás

**Ya está hecho para los tres que mueven dinero** —confirmar pago, rechazar pago y
guardar presupuesto—, con `src/lib/ui/tope-de-espera.ts` y su prueba
(`src/__tests__/los-botones-de-plata-no-se-cuelgan.test.ts`). **Eso no se toca.**

**El problema es más viejo que esos tres.** Es el mismo que dejó al dueño sin poder entrar
a la app: un botón llama al servidor, el servidor no contesta ni falla —se queda—, y la
promesa nunca se resuelve. Con ella se queda el `finally` que devolvía el botón. Resultado:
gira para siempre, sin error y sin poder reintentar.

**Qué hay que hacer:** aplicar `conTopeDeEspera` a los botones que **guardan o confirman
algo** en el resto del panel: guardar una fiesta, guardar el menú, confirmar invitados,
emitir una factura, guardar un incidente. **Los que sólo leen o navegan no hacen falta.**

El aviso al usuario tiene que decir **"no se guardó nada"**, como el que ya existe. Esa
frase es la que evita que alguien apriete dos veces y cargue el mismo pago dos veces.

**Y agregá el caso al control:** que la prueba cubra los botones nuevos, no sólo los tres
de plata.

---

## Bloque 3 — Que la prueba de navegador no corra contra una versión vieja

**Esto es lo más importante de la orden**, porque hizo perder tiempo hoy y va a volver a
pasar.

La tanda reportó **cuatro pantallas rotas que estaban perfectas**. El motivo: corrió
contra una compilación anterior, de antes de que esas pantallas existieran. La misma
carpeta tenía adentro dos pantallas que ya se habían borrado.

Una tanda que miente es peor que no tener tanda: te manda a arreglar lo que no está roto,
y te hace desconfiar cuando encuentra algo de verdad.

**Qué hay que hacer:** que `scripts/run-playwright-production.mjs` **compruebe, antes de
arrancar, que la compilación corresponde al código de ahora**. Alcanza con algo simple:
comparar contra el último cambio del código y, si la compilación es anterior, recompilar
sola o cortar con un aviso claro en criollo:

> *"La compilación es de antes que el código: los resultados no valen. Corré `npm run
> build` y volvé a intentar."*

---

## Antes de entregar

- `npm run check:acentos` — sin acentos rotos. **Con acentos rotos no se fusiona.**
- `npx tsc --noEmit` — cero errores. **Si falla nombrando archivos dentro de `.next/`, es
  la compilación vieja, no el código**: borrala y volvé a probar.
- `npx jest --silent` — todas en verde.
- `npm run build` — tiene que terminar bien.
- **Antes de subir, mirá `git status`.** La corrida de pruebas escribe datos: un prospecto
  de prueba en la lista de contactos y avisos en las notificaciones. **Eso no se
  commitea**: si aparece un dato que no escribiste vos, es de la corrida.
- **No toques `apphosting.yaml`.**
- Anotá lo que hiciste en `docs/YA-RESUELTO.md`, **en la misma propuesta**.
