# Orden 9 — La web que encuentra Google, y el trabajador diario

**Para:** Gemini
**Fecha:** 26 de agosto de 2026
**Entrega:** **UNA SOLA propuesta con los doce bloques.** Si uno se traba, entregá los
otros once igual y decí cuál faltó y por qué.

**Todo lo de acá está verificado línea por línea**, no copiado de un informe. Llegó un
informe de 17 páginas sobre la web pública; se comprobó punto por punto y **lo que no se
confirmó no está en esta orden**. Un punto del informe era falsa alarma (los contadores
animados: ese componente ya no existe).

---

## Bloque 1 — La ficha de negocio dice una dirección que no existe

`src/components/seo/LocalBusinessJsonLd.tsx` le declara a Google:

```
'@type': 'EventVenue',
streetAddress: 'Gaboto 3390',
addressLocality: 'Salto',
```

Se inyecta en `/bodas`, `/quinceaneras`, `/cumpleanos`, el blog y la portada.

**El dueño no tiene local a la calle.** Trabaja en salones y a domicilio, y la decisión
está escrita: *"No tiene local físico: la ficha va sin dirección, con zona de cobertura"*
(`ESTADO-ACTUAL.md`). Declararse **salón de eventos en una calle** puede hacer que Google
le muestre a la gente una dirección donde no hay nada.

**Qué hay que hacer:**

1. Sacar `streetAddress`. Dejar la localidad (Salto), el país y las coordenadas.
2. Cambiar el tipo: no es un `EventVenue` con domicilio. Usar el que corresponde a un
   negocio que va al lugar del cliente, declarando **zona de cobertura** (`areaServed`)
   en vez de dirección.
3. El teléfono sale de `src/lib/public-contact.ts`, que ya es la fuente única. **No
   escribir números a mano en ningún otro lado.**

**La excepción, confirmada por el dueño: el Salón Club Uruguay SÍ tiene dirección.** Es
un salón de verdad, en **Uruguay 754, Salto**. La página `/club-uruguay` existe y hoy
**no declara ninguna ficha de negocio**: tiene que declararse como `EventVenue` en esa
dirección. Es la única dirección de calle que va en toda la web, y encima suma: un salón
real con dirección real es de lo que mejor entiende Google.

| Quién | Qué se declara |
| --- | --- |
| AK Producciones (portada, bodas, quince, cumpleaños, blog) | Salto, Uruguay. **Sin dirección de calle.** Zona de cobertura |
| Salón Club Uruguay (`/club-uruguay`) | `EventVenue` en **Uruguay 754, Salto, Uruguay** |

---

## Bloque 2 — Las páginas de venta compiten contra sí mismas

`src/lib/seo/event-landing.ts` arma **siempre** la dirección canónica como
`/landing/<slug>`. Pero existen las dos rutas:

| Lo que abre la gente | Lo que le declara a Google |
| --- | --- |
| `/bodas` | `/landing/bodas` |
| `/quinceaneras` | `/landing/xv-anos` |
| `/cumpleanos` | `/landing/eventos` |

Las dos versiones existen y **las dos le dicen a Google que la buena es la de
`/landing`**. Resultado: cada página compite contra su gemela y Google no sabe cuál
mostrar. Es de las cosas que más bajan una web en el buscador.

**Qué hay que hacer:**

1. **Elegir una sola dirección por intención** y que sea la que se autocanonicaliza:
   `/bodas`, `/quinceaneras` y `/cumpleanos` (son las que ya están en el permiso de
   robots y las que tienen la ficha de negocio).
2. Que `/landing/bodas`, `/landing/xv-anos` y `/landing/eventos` **redirijan** a las de
   arriba, para no romper ningún enlace ya publicado ni ningún anuncio en curso.
3. Sacar del permiso de robots y del mapa las direcciones que quedan como redirección.

**Cuidado:** si hay anuncios de Meta apuntando a `/landing/...`, la redirección es
justamente lo que los mantiene vivos. **No borres esas rutas: redirigilas.**

---

## Bloque 3 — Tres páginas públicas sin título ni descripción

Estas tres están **permitidas en robots y listadas en el mapa de Google**, y no tienen
ni título, ni descripción, ni imagen de vista previa. En los resultados de Google salen
con lo que Google adivine:

| Página | Archivo | Qué le falta |
| --- | --- | --- |
| `/catalogo` | `src/app/catalogo/page.tsx` | Todo. Es `'use client'` desde la primera línea |
| `/galeria-led` | `src/app/galeria-led/page.tsx` | Todo. Es `'use client'` |
| `/simulador-de-presupuesto` | `src/app/simulador-de-presupuesto/page.tsx` | Todo. Es `'use client'` |

**La del simulador es la más cara de todas:** es la que captura el contacto del
prospecto, y hoy Google la muestra sin título.

**Qué hay que hacer:** partir cada una en dos —una parte de servidor que exporta título,
descripción, imagen de vista previa y dirección canónica, y adentro el componente de
navegador que ya existe—. **No reescribas la pantalla**: sólo envolvela.

Los textos tienen que ser comerciales y ciertos: qué es, para quién, en Salto. **Sin
promesas absolutas** ("100% satisfechos", "respondemos en X horas", "reserva
garantizada").

---

## Bloque 4 — «Experiencia AK» está abierta a Google con texto interno

`src/app/experiencia-ak/page.tsx` está permitida en robots y dice cosas como *"la app
tiene que vender una experiencia, no una lista de módulos"* y *"lo que yo agregaría para
vender mejor"*. Son notas de trabajo, y cualquiera que las encuentre en Google las lee.

**Qué hay que hacer:** o se convierte en una página comercial de verdad —escrita para el
cliente, no para el equipo— o se saca del permiso de robots y del mapa. **Elegí lo
primero si el contenido sirve para vender; si no, lo segundo.**

---

## Bloque 5 — Que nada quede invisible en el celular

`src/app/ak-motion-effects.css` define `.ak-deferred-section` con
`content-visibility: auto`, y `LandingSpaContainer.tsx` la usa en las secciones
"difference", "team-process" y "cta-footer" de la portada, con `opacity: 0` inicial.

**El riesgo, en criollo:** si la animación no arranca —celular viejo, navegador raro,
conexión lenta— el visitante llega hasta la galería, cree que la página terminó ahí, y
**nunca ve los testimonios, las preguntas frecuentes ni el botón de contacto**.

**Qué hay que hacer:**

1. Que el estado base de toda sección pública sea **visible**: `opacity: 1`, sin depender
   de una animación para existir.
2. La animación es una mejora, no una condición. Si el JavaScript no corre, la página se
   ve igual.
3. Revisar `content-visibility: auto` en la portada y el pie. Si no aporta velocidad
   medible, sacarlo de ahí y dejarlo sólo en zonas que no sean críticas.
4. Respetar `prefers-reduced-motion`.

**Esto ya no es una sospecha: el dueño lo vio en su propia web.** Sus palabras: *"cuando
entro a mi web no veo el pie de página; lo de después de la galería no se ve nada"*.

**La causa está medida.** La portada dibuja 15 bloques. Los tres últimos —"difference",
"team-process" y **"cta-footer", que es donde viven el pie de página y el botón de
contacto**— están dentro de `.ak-deferred-section`, con
`contain-intrinsic-size: auto 720px`. El navegador reserva 720px para cada una y no las
dibuja hasta que se acercan a la pantalla. **Si esa cuenta falla, el visitante llega a la
galería y para él la página se terminó ahí.**

Es la peor pérdida posible: el pie es donde está el botón de contacto.

**Cómo se comprueba:** con el JavaScript apagado, la portada tiene que mostrar todas sus
secciones hasta el pie. Y en un celular de verdad, bajando hasta el final, el pie tiene
que aparecer siempre.

---

## Bloque 6 — El trabajador diario de posicionamiento

**Lo que pidió el dueño:** *"quiero agregar una IA de posicionamiento que mejore mi web y
su posición, automático, todos los días, sola"*.

**Se hace, con una línea que no se cruza: la app no puede inventar un número de
posición.** Nadie controla el orden de Google, y hoy la app **no tiene de dónde sacar en
qué puesto está**. Cualquier número de "posición" sin la cuenta de Google Search Console
conectada sería inventado, y eso es justo lo que prohíbe
`src/__tests__/ninguna-pantalla-miente.test.ts`.

**Qué hay que hacer — una tarea automática diaria** que:

1. **Revisa la salud de la web** y **arregla lo mecánico**: página pública sin título,
   sin descripción, sin imagen de vista previa, que quedó fuera del mapa de Google, que
   pide sesión sin querer, o cuya dirección canónica apunta a otro lado.
2. **Deja el parte en «Mi día»**, en una línea y con las palabras de siempre: nada de
   "riesgo", "urgente" ni "crítico". Si no hay nada que hacer, no aparece.
3. **Respeta el tope de gasto de inteligencia artificial** que ya existe
   (`hayPresupuestoParaIA`). Si el mes llegó al tope, se frena sola y lo dice.
4. **Se declara en `src/lib/automatico/tareas-automaticas.ts`** como las otras cuatro, con
   su nombre en criollo y qué se pierde si no corre, y **deja su marca al terminar bien**.
   La pregunta que importa no es "¿está programada?" sino **"¿pasó de verdad?"**.
5. **Entra en el camino de `al-entrar-a-la-app.ts`**, para que corra cuando el equipo
   entra, aunque no haya despertador externo. Es segura de repetir: no le escribe a
   nadie.

**Y la parte de la posición, preparada pero apagada:** dejá el lugar donde va a mostrarse
"en qué búsquedas aparecés y en qué puesto", y mientras la cuenta de Google Search
Console no esté conectada, que diga **"falta conectar Google"**, no un número.

---

## Bloque 7 — El menú, en tres puertas (esto quedó pendiente dos veces)

Las órdenes 7 y 8 lo pidieron y las dos veces terminó **agregando** entradas al menú en
vez de reducirlo. Lo digo sin vueltas: **el trabajo no es agregar una pantalla nueva. Es
sacar las cinco secciones viejas del menú de arriba.**

Arriba quedan **tres**, y nada más:

- **Mi día**
- **Fiestas**
- **La empresa** — que ya existe en `/empresa`, con sus cuatro grupos adentro: Vender,
  Plata, Recursos y Marketing.

**Ajustes** deja de ser una sección del menú principal: se llega desde el perfil o desde
un ícono, no compitiendo con el trabajo diario.

**La condición de siempre: no se pierde ninguna entrada.** Todo lo que hoy está en el
menú tiene que seguir siendo alcanzable desde alguna de las tres puertas o desde el "ver
todo" de la pantalla que corresponda. Si algo no entra en ningún grupo, ponelo en "ver
todo" antes que sacarlo.

---

## Bloque 8 — Que la web cargue rápido

**El dueño la probó y dice que cuesta cargar, que está muy lenta.** Esto es lo que se
midió, para que no se trabaje a ciegas:

| Qué se midió | Resultado |
| --- | --- |
| Imágenes de la web pública | 31 MB en total; la más pesada, 1 MB (`simulador_hero_pro.jpg`) |
| Imágenes marcadas como "prioritarias" | **7** en la portada |
| Bloques que dibuja la portada | 15 |

**Qué hay que hacer, en este orden:**

1. **Dejar UNA sola imagen prioritaria por página**: la primera que se ve, y nada más.
   Hoy hay siete (`HeroSection.tsx:74`, `AkDifferenceSection.tsx:94` y cinco en
   `GallerySection.tsx`). Marcar todo como prioritario es lo mismo que no marcar nada, y
   encima le dice al navegador que baje siete imágenes antes de mostrar el texto.
2. **Achicar la imagen de 1 MB** y cualquier otra que pase los 400 KB. Que se sirvan en
   formato moderno y del tamaño en que se ven, no más grandes.
3. **Las imágenes que están más abajo se cargan cuando se llega**, nunca al principio.
4. **Medir antes y después** y dejar el número en la propuesta. Sin número, no sabemos si
   mejoró.

**Lo que NO hay que hacer:** tocar `apphosting.yaml` ni nada que aumente lo que se paga
por mes. **El servidor se queda dormido a propósito y esa decisión no se toca.** Si la
primera visita del día tarda un poco más por eso, está bien así: lo que hay que arreglar
es el peso de la página, no la máquina.

---

## Bloque 9 — Movimiento, sin volverla más lenta

**El dueño lo pidió así:** *"pedí que tuviera movimiento y no tiene; quizás cambiar alguna
imagen por algún video corto"*.

Hoy el único video de la portada está adentro de una ventana que se abre al tocar
(`VideoSection.tsx`), así que la página se ve quieta.

**Qué hay que hacer:** poner movimiento **arriba**, donde se ve apenas entra, con estas
condiciones, que no son opcionales porque él también dijo que la web está lenta:

- **Video corto, sin sonido, en bucle**, de pocos segundos y bien comprimido.
- **Una foto de fondo mientras carga**, para que nunca se vea un rectángulo negro.
- **Arranca sólo cuando está en pantalla**, y se frena cuando no.
- **En celular, con datos, no se baja el video**: se muestra la foto.
- **Respeta `prefers-reduced-motion`**: quien pidió menos movimiento ve la foto.
- **Material real de fiestas de AK.** Nada de video de banco de imágenes.

**La regla que manda acá: si el video hace que la página tarde más en mostrarse, no va.**
Primero liviano, después lindo.

---

## Bloque 10 — Dejar lista la conexión con Google Search Console

**El dueño pidió que lo conectemos.** La autorización es de su cuenta de Google y **nadie
puede hacerla por él**, pero se puede dejar todo listo para que sea **un solo paso**.

**Qué hay que hacer:**

1. En la pantalla de conexiones, un lugar donde pegar el código de verificación que da
   Google, guardado como el resto de las conexiones.
2. Que ese código salga en la etiqueta que Google busca en la portada, para verificar el
   sitio.
3. Estado real: verificado / falta pegar el código / no se pudo verificar. **Nunca decir
   "conectado" sin comprobarlo** — ya hay un control que lo impide.
4. Mientras no esté verificado, donde iría la posición dice **"falta conectar Google"**,
   no un número.
5. Una explicación de dos líneas, en criollo, de dónde saca ese código. **Sin jerga.**

---

## Bloque 11 — Lo que faltaba del informe (lo de segunda prioridad)

Los puntos graves del informe están en los bloques de arriba. Estos son los de segunda
prioridad, que no rompen nada pero suman en Google:

1. **El mapa de Google dice que todo se modificó hoy.** `src/app/sitemap.ts` usa la fecha
   de hoy para todas las páginas. Para las notas del blog hay que usar **la fecha real de
   la nota**; para las páginas fijas, una fecha estable que no cambie sola todos los días.
   Decirle a Google que todo cambió hoy, todos los días, le quita valor al aviso.

2. **Los catálogos por tipo de evento heredan textos genéricos.** `/public/[eventType]`
   arma el título y la descripción con una plantilla. Que cada tipo tenga los suyos, y su
   dirección canónica propia.

3. **El blog no aprovecha los datos estructurados de artículo.** Cada nota tiene que
   declararse como artículo, con su título, su fecha y su autor. Es lo que hace que
   aparezca mejor presentada en los resultados.

4. **Falta la imagen de vista previa** en el blog, en cada nota, en los catálogos por
   tipo y en «Experiencia AK». Sin eso, cuando alguien comparte el enlace por WhatsApp
   sale un cuadro gris.

5. **El idioma de la marca, parejo en todo lo público:**
   - **comida**, no *catering*
   - **discoteca**, no *DJ*
   - **AK Producciones Eventos** como nombre comercial
   - **Sin promesas absolutas**: nada de "100% satisfechos", "cero fallas", "reserva
     garantizada" ni "respondemos en X horas". Si un dato no está confirmado, se deja en
     una forma neutra; **no se inventa ni se vuelve más absoluto**.
   - Un solo llamado a la acción principal: WhatsApp o el simulador.
   - Los enlaces de redes y el teléfono salen **siempre** de
     `src/lib/public-contact.ts`. Es la fuente única y no se duplica en ningún lado.

6. **El pie de página, revisado**: que los enlaces lleven a donde dicen y que no queden
   mensajes viejos.

---

## Bloque 12 — El control que faltaba: abrir la web y mirarla

**Por qué existe este bloque, y es lo más importante de toda la orden.**

El dueño preguntó cómo puede ser que las auditorías nunca hayan encontrado estas cosas.
Tiene razón, y el motivo es concreto: **todas las auditorías de este proyecto leen código.
Ninguna abre la web y mira.**

Las cuatro preguntas de `docs/COMO-AUDITAR.md` son: ¿dejó rastro?, ¿alguien lo llama?,
¿necesita algo que no está?, ¿lo que promete la pantalla existe en el código? **Falta la
quinta, que es la que se le escapó a todos: ¿el visitante lo ve?**

El pie de página existe, está escrito, alguien lo llama, no simula datos y cumple lo que
promete. **Pasa las cuatro preguntas, y el visitante no lo ve.** Lo mismo la página sin
título: el archivo está perfecto, sólo que no exporta metadata.

**Qué hay que hacer:** una prueba de navegador
(`tests/e2e/la-web-publica-se-ve.spec.ts`) que abra las páginas públicas de verdad, en
tamaño de celular y de escritorio, y compruebe:

1. **Que se llegue hasta el pie de página** bajando hasta el final, y que el botón de
   contacto esté visible y se pueda tocar.
2. **Que todas las secciones de la portada se vean**, con las animaciones apagadas.
3. **Que cada página pública tenga título y descripción** que no estén vacíos.
4. **Que la dirección canónica de cada página apunte a sí misma.**
5. **Que ninguna página pública redirija al ingreso.** Ya pasó: las páginas de venta
   estuvieron invisibles para Google sin que nadie lo notara.

Que corra dentro de `npm run test:e2e`, con la versión compilada.

**Y sumar la quinta pregunta a `docs/COMO-AUDITAR.md`**, escrita así:

> **5. ¿El visitante lo ve?** No alcanza con que exista, que alguien lo llame y que diga
> la verdad. Hay que abrir la página en un navegador de verdad, en un celular, y mirar.
> Todo lo que se encontró en la web pública el 26 de agosto —el pie que no aparece, las
> páginas sin título, la ficha con una dirección que no existe— **pasaba las otras cuatro
> preguntas**.

---

## Antes de entregar

- `npm run check:acentos` — sin acentos rotos. **Con acentos rotos no se fusiona.**
- `npx tsc --noEmit` — cero errores.
- `npx jest --silent` — todas en verde.
- `npm run build` — tiene que terminar bien. **No alcanza con el revisor de tipos.**
- `npm run mapa:generar` — el manual se regenera solo, no lo edites a mano.
- **No toques `apphosting.yaml`.** Tres entregas seguidas la trajeron modificada con la
  configuración de cobros vieja: si tu copia la trae, sacá ese cambio antes de entregar.
- **No inventes datos comerciales:** ni dirección, ni años de experiencia, ni cantidad de
  eventos, ni porcentajes de satisfacción, ni tiempos de respuesta.
- Anotá lo que hiciste en `docs/YA-RESUELTO.md` y en `docs/MANUAL-DE-LA-APP.md`, **en la
  misma propuesta**.

## Y la regla que sigue valiendo

**No se agrega una pantalla nueva sin sacar otra**, salvo que la pida el dueño.
