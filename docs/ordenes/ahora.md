# Que la app corra sola, y que el movimiento remate mejor

**Para:** Gemini (Antigravity)
**Escrita:** 22 de agosto de 2026.

## Cómo se entrega

**UNA SOLA propuesta de cambios con los tres bloques adentro.** Cada fusión
dispara un despliegue y eso se paga. Si un bloque se traba, entregá el resto
igual, en la misma propuesta, avisando cuál faltó y por qué.

**Arrancá desde la versión principal de ahora.**

Antes de tocar nada, leé `docs/MANUAL-DE-LA-APP.md` y `docs/YA-RESUELTO.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

---

## Lo que ya entregaste y quedó bien — no lo rehagas

La galería lee el historial guardado, aparece de a tandas, el panel de historial
de redes con su botón de actualizar, y el movimiento de las pantallas públicas.
**El movimiento quedó bien hecho**: nada queda invisible, respeta a quien pidió
menos animación, y no desborda en el celular.

**Dos cosas se volvieron atrás y no se vuelven a cambiar:** los textos
"Respuesta en 24 hs" y "Consultar precio". Son decisiones comerciales del dueño.
**No toques textos que ve el cliente si no está pedido.**

---

## BLOQUE 1 — QUE CORRA SOLO DE VERDAD (esto es lo que falta y es lo primero)

**Esto ya estaba pedido y no vino. Es lo mas importante de todo.**

**El problema, en criollo:** la app se pone al día **solo cuando alguien del
equipo entra al panel**. El disparador vive en `src/components/app-shell.tsx`, que
es la cáscara del área con sesión. El visitante que entra a la web pública no
dispara nada. Si nadie del equipo abre la app el fin de semana, no corre nada:
ni las notas del blog, ni la bajada de las fotos de Instagram, ni los
recordatorios de cuota. Ya pasó: hubo meses sin números de redes guardados.

El propio código lo dice en `src/lib/automatico/al-entrar-a-la-app.ts`: *"No
reemplaza al despertador de afuera. Si nadie abre la app en tres días, estas
tareas no corren en tres días."*

Y la solución que hay escrita es `docs/PRENDER-LAS-TAREAS.md`: un instructivo para
que el dueño se cree una cuenta en una página de internet y configure cuatro
renglones a mano. **Nunca lo hizo y no tiene por qué.** Eso no es resolver.

### Qué hay que hacer

**1. Un despertador de verdad, dentro del proyecto.** La carpeta `functions/` ya
existe y hoy no tiene ninguna tarea programada. Agregá **una sola** tarea
programada, cada 15 minutos, que pregunte qué está vencido y corra lo que
corresponda.

- **Una sola, no cuatro.** Una sola tarea agendada entra en lo que ya viene
  incluido sin pagar. Cuatro serían cuatro trabajos agendados.
- Que no dependa de que nadie abra nada.
- Corregí `docs/PRENDER-LAS-TAREAS.md`: hoy miente, porque dice que hay que
  configurar algo a mano.

**2. Que la web pública también lo dispare, como red de seguridad.** El sitio
recibe visitas. Que una visita a la portada dispare la misma puesta al día **sin
hacer esperar a nadie**: se larga y la página sigue, nunca se espera el resultado.

**3. La trampa que ya nos mordió:** cuando algo pasa de correr en un solo lugar a
correr con cada visita, la pregunta no es "¿funciona?" sino **"¿qué pasa si dos lo
hacen al mismo tiempo?"**. Diez visitas en el mismo minuto no pueden generar diez
notas de blog ni pagar diez veces la inteligencia artificial.

- **La marca de "ya estoy corriendo" se toma ANTES de trabajar, no después.**
- El que llega y ve que otro está corriendo, se va sin hacer nada.
- **Una prueba que lo demuestre**: varias llamadas al mismo tiempo dejan una sola
  corrida.

**4. Que se vea.** En `/settings/tareas-automaticas`, cuándo corrió cada tarea por
última vez y quién la disparó. Si una no corre hace más del doble de lo que
debería, que se vea en rojo.

**Sobre lo que cuesta:** una sola tarea programada cada 15 minutos entra en lo
incluido: **no agrega gasto mensual**. `apphosting.yaml` no se toca, ni la memoria
ni las instancias mínimas.

---

## BLOQUE 2 — Rematar el movimiento (tres cosas que venden)

El movimiento quedó bien. Esto es lo que le falta para rematar, en orden de lo
que más rinde:

**1. Los números que suben.** Donde la pantalla muestra una cifra que impresiona
—años de experiencia, fiestas hechas, invitados atendidos—, que el número **trepe
desde cero** cuando la persona llega ahí, en vez de aparecer quieto. Es lo que
hace que el dato se quede grabado. Que suba una sola vez, no cada vez que se
pasa. Y con `useReducedMotion` puesto: quien pidió menos movimiento ve el número
final directo.

**2. La galería, que ahora tiene años de fotos.** Al tocar "ver más", la tanda
nueva aparece de golpe. Que entren **escalonadas**, de a una con unas milésimas de
diferencia, como ya se hace en la primera tanda. Con el historial completo eso es
lo que transmite "mirá todo lo que hicimos" en vez de un salto brusco.

**3. Mientras la pantalla trae datos, que no haya huecos vacíos.** Poner el molde
gris de lo que va a venir (lo que hacen las apps buenas) en vez de un espacio en
blanco. La página se siente rápida aunque tarde lo mismo.

**Y una que hay que SACAR, no agregar:** en `src/components/landing/HeroSection.tsx`
quedaron **tres animaciones que no paran nunca** (una en la foto de fondo y dos
resplandores con desenfoque grande). Con una alcanza. Las otras no se notan y le
chupan batería al celular del que te está mirando. **Dejá una sola.**

---

## BLOQUE 3 — Una prueba de navegador que se queja del Centro de Control

De 596 pruebas de navegador pasan 594. Las 2 que fallan son la misma
(`tests/e2e/layout-baseline.spec.ts`) en escritorio y en celular:

- **Escritorio:** `/admin · no tiene titulo ni contenido: la ruta no existe o no
  carga`. Pero en celular esa pantalla carga bien, y el `<h1>` de
  `src/app/(app)/admin/page.tsx:222` **no depende de que carguen los datos**: se
  dibuja siempre. Lo que dice la prueba no coincide con el código.
- **Celular:** `/presupuestos/nuevo · falta referencia para chromium-mobile`. Se
  cambió la ruta medida (antes era `/presupuestos`, que es una redirección) y la
  referencia de ese perfil quedó sin grabar. Se graba corriendo ese archivo con
  `UPDATE_MISSING_LAYOUT_BASELINE=true`, **con nada más corriendo en paralelo**.

**Ya fallaban antes, no son una regresión.** Si la prueba mide mal, arreglá la
prueba; si hay algo roto de verdad, arreglalo y decilo. **No la desactives.**

---

## BLOQUE 4 — Cuatro cosas chicas que salieron de revisar la app entera

Se auditaron las siete areas (pantalla gigante, decoracion, entretenimiento,
comida, plata, invitados y portal del cliente, ventas y operacion). **Nada roto
de fondo.** Salieron estas cuatro, todas chicas y todas verificadas a mano:

**1. La lista de compras queda en blanco y no dice por que.**
`src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx:475`
Dibuja una tarjeta por proveedor y nada mas. Si el evento todavia no tiene platos
con ingredientes, ni bebidas, ni reposteria, la pantalla queda vacia: el equipo no
sabe si falta cargar algo, si se rompio, o si de verdad no hay nada que comprar.
**Poner un cartel que diga que falta y a que pantalla ir a cargarlo.** Una
pantalla vacia tiene que explicar el proximo paso.

**2. El presupuesto que ve el cliente muestra centavos y el resto de la app no.**
`src/components/budget/BudgetDocument.tsx:31` y
`src/components/presupuestos/BudgetPrintTemplate.tsx:34`
Muestran "$ 10.000,00" con dos decimales. El resto de la app (bebidas,
reposteria, CRM, cobros) muestra "$ 10.000", sin decimales, que es como se usa
aca. **Es justo el papel que se le manda al cliente y se imprime.** Unificar en
cero decimales, como el resto. Ojo: `src/components/presupuestos/paso-4-resumen.tsx`
tambien usa dos decimales, revisalo en el mismo viaje.

**3. El boton de borrar una factura cobrada se ve activo pero no funciona.**
`src/components/invoice-list-item.tsx:97`
El servidor la protege bien (eso esta perfecto y no se toca), pero el boton se ve
prendido: el usuario lo toca y recibe un error. **Que se vea apagado cuando la
factura tiene pagos**, con una ayuda que diga por que no se puede.

**4. En el tablero de decoracion del cliente, el corazon se borra solo sin avisar.**
`src/app/portal/[fiestaId]/moodboard/page.tsx:57-62`
Cuando el cliente marca una foto como favorita y falla el guardado, la pantalla
revierte el corazon y **no dice nada**. La persona cree que apreto mal. Al subir
una foto si avisa del error (linea 88): **hacer lo mismo aca.**

**Ninguna de las cuatro toca plata, cuentas ni permisos.** Son de las que hacen
dudar al que las usa, que es lo que se quiere sacar.

---

## BLOQUE 5 — La app instalable y que la fotocabina aguante sin internet

**Lo que pidio el dueño:** *"quiero que la app se pueda instalar en pc o movil sin
tener que ponerla en Play Store, porque no la quiero vender. Por ejemplo quiero la
fotocabina y que solo este eso en esa pc, y si no hay internet que funcione igual;
despues, cuando haya, se sincroniza sola. Y asi todo."*

### Lo que YA ESTA y NO se rehace

- **La app ya se puede instalar** sin tienda de aplicaciones: hay manifiesto en
  `src/app/manifest.ts` (nombre, iconos, pantalla completa) enlazado desde
  `src/app/layout.tsx`, y `@ducanh2912/next-pwa` configurado en `next.config.js`.
- **El modo quiosco ya existe**: `src/components/kiosk/kiosk-setup.tsx`. Se elige
  fiesta y puesto, se traba con una clave de 4 numeros y queda fija ahi. Roles de
  hoy: `barra`, `muro-en-vivo`, `plataforma-360`, `totem`.
- **La cola sin internet ya existe**: `src/lib/offline/offline-action-queue.ts`.
  Guarda fotos del muro, registro de llegada y pedidos de la barra, y los manda
  cuando vuelve la señal.

### Lo que falta

**1. Faltan estaciones en el modo quiosco.** Hoy los roles son `barra`,
`muro-en-vivo`, `plataforma-360` y `totem`. **Agregá las que faltan**, con el mismo
trato (traba con clave y arranque directo en su pantalla):

- **Fotocabina** (`/evento/fotocabina/:fiestaId`)
- **Espejo magico** (`/evento/espejo-magico/:fiestaId`)
- **Touchpix** (`/evento/touchpix/:fiestaId`)
- **Buzon de saludos** (`/evento/buzon/:fiestaId`)
- **Video de vida** (`/evento/video-vida/:fiestaId`)
- **Impresion de fotos** (`/evento/impresion/:fiestaId`)
- **Pedidos al DJ** (`/evento/dj/:fiestaId`)

La idea del dueño es dejar **una maquina por puesto**: esa computadora o esa tablet
hace una sola cosa toda la noche y nadie la saca de ahi.

**2. NINGUNA de las estaciones que capturan aguanta quedarse sin internet.**
El caso comprobado es la fotocabina
(`src/app/evento/fotocabina/[fiestaId]/page.tsx:500-552`): la foto se sube en el
momento; si falla, solo ofrece bajarla al disco y **no queda encolada**. En una
fiesta con el wifi caido, se pierden las fotos de los invitados.

**Revisá una por una y dejalas todas iguales**, porque todas capturan algo:

- **Fotocabina** — tanda de fotos.
- **Espejo magico** — fotos.
- **Plataforma 360** — video.
- **Touchpix** — fotos.
- **Totem de la barra** — foto y video de 8 segundos con el trago.
- **Buzon de saludos** — foto, video y audio.
- **Video de vida** — video.
- **Muro social** — ya tiene cola; **verificá que aguante fotos grandes** y no solo
  el dato chico.

**Los videos pesan mucho mas que las fotos.** Si un video no entra, avisá en
pantalla en criollo antes de grabar, nunca despues.

Que tiene que pasar: **la foto se guarda en el aparato y se sube sola cuando
vuelve internet**, sin que nadie haga nada.

**⚠️ ACA ESTA LA TRAMPA, y si no se respeta la fotocabina falla en plena fiesta:**
la cola de hoy guarda en `localStorage`, que aguanta unos pocos megas. **Una tanda
de fotos no entra ahi.** Las fotos van en **IndexedDB** (el cajon grande del
navegador), guardadas como `Blob`, no como texto. Si se meten en `localStorage`
convertidas a texto, a la decima foto revienta y el invitado se queda sin su foto.

- Guardá la imagen como archivo binario, no como texto.
- **Que el operador vea cuantas fotos quedan sin subir.** Un cartel discreto en la
  pantalla de la fotocabina: "3 fotos esperando internet". Sin eso, nadie sabe si
  se perdieron.
- **Nunca borres la foto local antes de que el servidor confirme que la recibio.**
- **Que se pueda cerrar y volver a abrir la fotocabina sin perder lo pendiente.**
- Si el aparato se queda sin lugar, avisá en pantalla en criollo, no falles en
  silencio.

**3. Que las pantallas de la fiesta abran sin internet.** Hoy Workbox guarda los
archivos de la aplicacion pero no las pantallas. Que las pantallas de las
estaciones (fotocabina, barra, totem, muro) **abran igual sin señal**, con los
datos de la fiesta que ya se bajaron. Si algo no se puede hacer sin internet, que
lo diga; **nunca una pantalla en blanco**.

**4. Que se note cuando no hay internet y cuando vuelve.** Un cartel discreto y
constante: "Sin internet — se guarda y se manda despues" y, al volver, "Listo, se
subio todo". El operador no puede tener que adivinar.

**5. Una pantalla para instalar los puestos.** El dueño no es programador y tiene
que poder dejar una computadora lista sin ayuda: una pantalla que explique, en
criollo y en pasos, como instalar la app en esa maquina y dejarla trabada en un
puesto. Sin jerga.

**Lo que NO hay que hacer:** no subir esto a ninguna tienda de aplicaciones. Se
instala desde el navegador y punto.

### Como se prueba que quedo bien

**No alcanza con que compile.** Hace falta una prueba que:
- corte internet, saque tres fotos, y verifique que quedan guardadas;
- vuelva a poner internet y verifique que se suben solas;
- cierre y reabra la pantalla en el medio, y verifique que **no se perdio ninguna**.

Y **una prueba por cada estacion que captura**, aunque sea corta: que sin internet
la pantalla siga andando y lo capturado quede guardado. Son siete pantallas
distintas; que ande una no quiere decir que anden las otras.

### Si un bloque se traba

Entregá el resto igual, en la misma propuesta. **Si tenes que elegir por donde
empezar: fotocabina, totem de la barra y espejo magico**, que son las tres que mas
se usan en una fiesta.

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes.
- **Textos que ve el cliente, si no están pedidos.**
- El WhatsApp prepara mensajes y no los manda.
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.
