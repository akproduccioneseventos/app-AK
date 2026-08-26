# Orden 9 — La web que encuentra Google, y el trabajador diario

**Para:** Gemini
**Fecha:** 26 de agosto de 2026
**Entrega:** **UNA SOLA propuesta con los siete bloques.** Si uno se traba, entregá los
otros seis igual y decí cuál faltó y por qué.

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

**Cómo se comprueba:** con el JavaScript apagado, la portada tiene que mostrar todas sus
secciones hasta el pie.

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
