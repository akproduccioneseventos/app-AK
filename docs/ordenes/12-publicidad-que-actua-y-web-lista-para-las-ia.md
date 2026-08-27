# Orden 12 — La publicidad que actúa sola, y la web lista para las IA

**Para Gemini. Escrita el 27 de agosto de 2026.**

## CÓMO SE ENTREGA (leer esto primero)

**UNA SOLA PROPUESTA DE CAMBIOS con los dos bloques adentro.** No una por bloque.
Cada fusión dispara un despliegue y eso se paga.

Si un bloque se traba, **entregá el resto igual, en la misma propuesta**, y avisá cuál
faltó y por qué. No lo dejes para después.

Antes de dar por terminado: compila, pruebas en verde, `npm run check:acentos` limpio, y
lo anotado en `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md` **dentro de la misma
propuesta**.

---

## Contexto: dos decisiones del dueño, del 27 de agosto de 2026

1. **El agente de publicidad administra Meta Ads solo, PERO NO PRENDE NADA.**

   El dueño corrigió esto unas horas después de pedirlo. Sus palabras:
   *"el tema de poner campañas las activo yo, no se pongan solas."* **Manda esta versión.**

   El agente puede, sin preguntar:
   - **pausar** lo que está quemando plata,
   - **bajar** un presupuesto,
   - **subir** el presupuesto de algo que **ya está al aire**, dentro del tope.

   El agente **no puede, nunca**:
   - **crear** una campaña,
   - **reactivar** una campaña pausada.

   Esas dos las **prepara** y las deja listas para que él las apruebe de un toque.

   La línea es la misma que rige en toda la app: **automático para mirar, detectar,
   preparar y avisar; mano humana para lo que sale para afuera.** Apagar y moderar es
   cuidar; **encender es salir a la calle a gastar**, y eso lo decide él.

   Del resto —pausar, bajar, subir dentro del tope— **no pidas confirmación**: ya la dio.
2. **La web se queda en Firebase.** Se evaluó pasarla por Cloudflare y dijo que no: lo que
   quiere es **lo que mide** la herramienta "is your site agent ready", no la herramienta.
   **No toques la configuración del dominio. No agregues ningún servicio que se pague por
   mes.**

---

## BLOQUE 1 — El agente de publicidad pasa de aconsejar a actuar

### Qué hay hoy

`ejecutarVigilantePublicidad` en `src/lib/agentes/motor-agentes.ts` ya mira las campañas y
escribe hallazgos: *"la campaña X gastó $1500 sin generar consultas"*, *"considerá escalar
el presupuesto de Y"*. **Nunca toca Meta.** Todo queda en un texto que alguien tiene que
leer y ejecutar a mano.

`src/lib/marketing/meta-ads.ts` sólo lee: métricas, resumen y recomendaciones.

### Qué falta

**Escribir en Meta.** Hace falta un cliente que pueda, contra la API de Marketing de Meta:

- Pausar y reactivar una campaña o un conjunto de anuncios.
- Cambiar el presupuesto diario.
- **Preparar** una campaña nueva a partir de lo que ya genera `creador-anuncios-ia.ts`,
  dejándola lista para que el dueño la encienda de un toque. **El agente no la lanza.**

### EL FRENO DE MANO — esto ya está hecho y es OBLIGATORIO usarlo

**No lo reescribas ni lo esquives.** Está en
`src/lib/marketing/tope-de-gasto-publicidad.ts`, congelado por
`src/__tests__/el-agente-no-se-pasa-del-tope.test.ts`.

**Ninguna operación que aumente el gasto puede ejecutarse sin pasar antes por
`puedeComprometer(...)`.** Si devuelve `permitido: false`, la operación **no se ejecuta**:
se anota el motivo en el registro del agente y se sigue con la siguiente.

**Pasale siempre el `tipo`** (`'pausar' | 'bajar-presupuesto' | 'subir-presupuesto' |
'encender' | 'crear'`). Con `'encender'` y `'crear'` el módulo **niega antes de mirar el
tope**: no es una cuestión de cuánta plata queda, es del dueño. Esa prohibición está en el
código y no sólo acá escrita, a propósito: **una instrucción escrita se olvida o se
"mejora"; el código niega.**

Por qué está armado así, para que no lo "mejores" al revés:

- **Nunca prende nada.** Crear y reactivar se niegan siempre, aunque sobre todo el tope
  del mundo.
- **Cuenta lo comprometido, no lo gastado.** Un presupuesto diario puesto hoy todavía no
  gastó nada pero ya compromete todos los días que quedan del mes. Contar sólo lo gastado
  dejaría subir presupuestos toda la primera semana y descubrir el desastre el día 28.
- **Bajar y pausar siempre se permiten**, aunque no quede tope. Frenar el gasto es lo que
  el módulo protege.
- **Sin tope cargado, el agente no compromete nada.** Y si no se puede leer el tope, se
  asume cero: ante la duda no se gasta.

### Lo que hay que construir

1. **Cliente de escritura de Meta** (`src/lib/marketing/meta-ads-acciones.ts`): pausar,
   reactivar, cambiar presupuesto, crear campaña. Cada función que suba el gasto llama
   primero a `puedeComprometer`.
2. **El agente actúa.** En `ejecutarVigilantePublicidad`, donde hoy dice *"revisá para
   pausarla"*, que **pause**. Donde dice *"considerá escalar"*, que **escale** dentro del
   tope. Cada acción ejecutada se anota en `accionesPreparadas` con lo que había antes y lo
   que quedó después: sin eso no hay forma de saber qué hizo.
3. **Pantalla del tope**, en el módulo de publicidad: un campo para el tope mensual en
   pesos, y debajo, en criollo, cuánto está comprometido y cuánto queda. Usá
   `getEstadoDelTope`.
4. **Registro de lo que hizo**: una lista con fecha, qué campaña, qué cambió y por qué.
   Es lo único que le va a permitir al dueño confiar o desconfiar del agente.

### Lo que NO se hace

- No pidas confirmación para pausar, bajar ni subir dentro del tope: ya la decidió.
- **Pero no prendas ni crees campañas por tu cuenta**, ni "por esta única vez" porque el
  retorno se ve buenísimo. Se preparan y las aprueba él.
- No inventes topes por defecto distintos de cero.
- No toques nada de cobros, facturas ni presupuestos de fiestas: esto es sólo publicidad.

---

## BLOQUE 2 — Que las IA encuentren y entiendan la web (sin Cloudflare)

Cuando alguien le pregunta a ChatGPT, Claude o Perplexity *"¿quién organiza fiestas de 15
en Salto?"*, la respuesta sale de lo que esas IA pudieron leer. Hoy la web está preparada
para Google, no para ellas.

**Todo se hace en Firebase. No se mueve el dominio ni se contrata nada.**

### 2.1 `llms.txt` — lo que hoy falta y es lo más importante

No existe. Es el archivo donde las IA leen, en texto plano, qué hace el negocio, dónde,
para quién y a dónde ir por cada cosa. Servirlo desde la raíz (`/llms.txt`).

Que diga, corto y sin adornos: qué es AK Producciones, que trabaja en **Salto, Uruguay**,
que va al lugar del cliente, qué servicios da, y los enlaces a las páginas públicas que ya
existen. Sacá el contenido de `src/lib/seo/paginas-publicas.ts` — **no inventes páginas**.

**Sin precios.** Ya se sacó un precio inventado en dólares que le mostrábamos a Google
(#1140): una fiesta se cotiza, no tiene precio de lista.

**Y agregalo a `ARCHIVOS_QUE_GOOGLE_LEE`**, no a `PAGINAS_PARA_GOOGLE`: esa segunda lista
alimenta también el mapa del sitio, y ofrecerle a Google un archivo de texto como si fuera
una página es ofrecerle algo que no existe. Ese error ya se cometió con el mapa.

### 2.2 Lo que mide "is your site agent ready", punto por punto

Repasá y corregí lo que falte:

- **El contenido se ve sin ejecutar programas.** Una IA que lee la página cruda tiene que
  encontrar el texto. Si alguna sección de venta se dibuja solo del lado del navegador,
  esa parte para las IA no existe.
- **Los datos del negocio, marcados.** Ya hay fichas de negocio y de servicio. Revisá que
  cada página pública tenga la suya y que digan la verdad: **Salto sin calle** para AK, y
  **Uruguay 754** sólo para el Salón Club Uruguay, que sí tiene local.
- **Las preguntas frecuentes, marcadas como preguntas y respuestas.** Es lo que una IA cita
  textual cuando alguien pregunta.
- **Permiso claro para los buscadores de IA.** El permiso hoy es una lista blanca —cerrado
  por defecto, abierto página por página— y eso está bien y **no se cambia**. Confirmá que
  las páginas de venta y el blog estén adentro. Ya pasó que el mapa del sitio quedó afuera
  y Google no podía leerlo.
- **Respuestas rápidas y sin trabas.** Nada de pedir que acepte cosas antes de mostrar el
  contenido.

### 2.3 Un control que no deje que se pierda

Una prueba que falle si `llms.txt` desaparece, si queda vacío, si nombra una página que no
existe, o si vuelve a aparecer un precio ahí adentro. Mirá
`src/__tests__/google-puede-leer-el-mapa.test.ts` para el estilo.

---

---

## BLOQUE 3 — Las portadas con video, que hoy están vacías

**Pedido del dueño, 27 de agosto de 2026:** *"no veo videos en portadas para el movimiento
de la app; en vez de foto, video liviano que dé movimiento a la app."*

### El problema exacto

`src/components/landing/HeroSection.tsx` **ya sabe mostrar video** y lo hace bien: acepta
`backgroundVideoUrl`, arranca solo, sin sonido y en bucle; se pausa cuando la sección sale
de pantalla para no gastar batería; si el visitante tiene el ahorro de datos prendido **ni
lo baja**; y siempre queda la foto de fondo como respaldo.

**Y nadie le pasa nunca un video.** `src/app/page.tsx` (línea ~497) sólo manda
`backgroundImageUrl`. `EventLandingPage.tsx` (línea ~77), igual. En todo el proyecto **no
hay un solo archivo de video**.

Es el caso exacto que describe `docs/COMO-AUDITAR.md`: está escrito, compila, pasa las
pruebas, **y no produce nada**.

### La regla que manda acá: **la portada tiene movimiento SIEMPRE, sin que el dueño cargue nada**

Sus palabras, al final: *"en donde quede debería haber un video corto que llame la
atención."* Ojo con la trampa: **si el movimiento depende de que él suba un archivo, no va
a haber movimiento.** Vuelve a ser tarea suya, y la regla del proyecto es al revés — *"todo
lo que pueda ser automático sería bueno; si no, es igual que hacerlo manual"*.

Así que se resuelve en tres escalones, en este orden, y **el tercero no falla nunca**:

1. **Si hay un video cargado**, se usa ése.
2. **Si no, se busca uno que la app ya tenga.** Hay campos de video que ya existen y pueden
   estar cargados: `videoUrl` en `src/types/salon.ts` (el video del salón) y en
   `src/types/fiesta.ts`. Si alguno tiene contenido, sirve para la portada.
3. **Si no hay ninguno, la app arma el movimiento sola con las fotos reales de las fiestas.**
   Las fotos aprobadas de los álbumes ya están en la app. Un pase corto —tres o cuatro
   fotos, con acercamiento lento y fundido entre una y otra, unos segundos en bucle— se ve
   como un video y **no necesita ni un archivo nuevo ni que nadie suba nada**. Es material
   real de sus fiestas, que es justamente lo que mejor vende.

   Hacelo con CSS, sin ninguna biblioteca: son transformaciones y opacidad. Respetá
   `prefers-reduced-motion` —si el visitante pidió menos movimiento, queda la foto quieta—
   y no cargues más de tres o cuatro fotos, que si no pesa.

**El escalón 3 es el que importa**, porque es el único que anda sin que nadie haga nada. Si
sólo entregás el 1, la portada va a seguir quieta igual que hoy.

**Que la IA elija y arme, no sólo que pase fotos.** El dueño pidió *"uno creado por IA,
lindo"*. El escalón 3 es exactamente eso, sin pagar nada: que la inteligencia artificial
**elija las mejores fotos** de los álbumes —las de más gente, mejor luz, las más
celebratorias—, las **ordene** para que arranque fuerte y cierre fuerte, y les dé el ritmo.
La app ya tiene el motor de IA conectado. Que no sea un pase de fotos al azar: que sea una
selección hecha con criterio, y que se note.

### Un video inventado por IA: PREPARADO, NO CONTRATADO

El dueño también aceptaría un video generado enteramente por IA. **Dejalo preparado y no
contrates nada.**

- **Se paga.** No hay servicio gratis que genere video. La regla del proyecto es clara:
  *nada que aumente lo que se paga por mes se cambia sin avisar*. Dejá el lugar donde
  enchufarlo y **el costo escrito**, para que él decida.
- **Y hay algo que decidir antes que el precio:** un video de IA de "una fiesta" **no es
  una fiesta de AK**. Quien llega desde ahí espera ver eso el día del evento. Para un
  negocio de fiestas eso puede jugar en contra. Si igual se usa, que sea ambiente y
  textura —luces, brindis, detalles— y **nunca una escena que se lea como un evento real de
  AK que no ocurrió**.

No armes esto como escalón previo al 3: el 3 va igual, porque es el que funciona sin
depender de nada ni de nadie.

### Además

1. **Un lugar para cargarlo, en la pantalla de ajustes de la web.** El dueño no es
   programador: **no puede depender de que alguien toque el código para cambiar el video de
   la portada.** Un campo donde sube el archivo o pega el enlace, con vista previa.
   Guardalo junto al resto de la configuración de la portada, con lo que ya existe.
2. **Pasarlo a las portadas.** La de la portada principal y la de cada tipo de evento
   (quince, casamiento, etc.), que pueden tener el suyo o heredar el general.
3. **Cuidar que siga siendo liviano.** Es lo que pidió: *video liviano*. Poné un límite de
   tamaño al subirlo y avisá en criollo si se pasa (*"ese video pesa demasiado y la página
   va a tardar en abrir; probá con uno más corto"*). Sin sonido, en bucle, de pocos
   segundos.
4. **Nunca se queda sin nada.** Si falla el video, si la foto no carga, si el visitante
   pidió menos movimiento: siempre queda la foto de fondo como está hoy. Nada se rompe.

### Lo que NO se hace

- **No bajes videos de bancos de imágenes ni pongas uno de relleno.** El material bueno son
  las fiestas reales de AK. Si no hay ninguno cargado, la portada sigue con la foto y
  listo.
- No agregues ninguna biblioteca de reproducción de video: el `<video>` del navegador ya
  hace todo lo que hace falta y no pesa nada.

---

## Cómo se comprueba que quedó bien

- **Bloque 1:** con un tope de $10.000 cargado y una campaña quemando plata, el agente la
  pausa solo y lo deja anotado. Un intento de subir un presupuesto que se pasa del tope
  **no se ejecuta** y queda escrito por qué. Y con el tope al tope, **una campaña nueva
  queda preparada pero apagada**, esperando que la encienda el dueño.
- **Bloque 2:** `/llms.txt` abre y se lee. Cada enlace que nombra existe. La prueba nueva
  falla si se borra el archivo.
- **Bloque 3:** el que de verdad importa. **Sin cargar absolutamente nada**, la portada
  tiene que tener movimiento: el pase de fotos reales del escalón 3. Con un video cargado,
  muestra el video. En un celular con ahorro de datos, no baja el video. Con "menos
  movimiento" pedido en el sistema, queda la foto quieta.
