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

## BLOQUE 3 — Las portadas con video de banco, elegido a mano

**Pedido del dueño, 27 de agosto de 2026.** Y ojo: **esto reemplaza todo lo que decía una
versión anterior de este bloque.** Él lo simplificó a propósito. Sus palabras:

> *"Lo de los videos, sacalo de crear solo con fotos. Y lo del video de la web en general,
> usá de stock relacionadas, no cualquier video. Y eso hacelo vos o Gemini: ningún botón
> programado, nomás."*

### Lo que queda AFUERA, y no se hace

- **Nada de armar el video con las fotos de los álbumes.** Se descartó.
- **Ningún botón, ninguna pantalla de ajustes para subir el video, ningún generador.** Él
  no quiere apretar nada: quiere que el video ya esté puesto.
- **Nada de generar video con IA.** También queda afuera.

### Lo que hay que hacer, y es simple

`src/components/landing/HeroSection.tsx` **ya sabe mostrar video**: acepta
`backgroundVideoUrl`, arranca solo sin sonido y en bucle, se pausa cuando la sección sale
de pantalla, no lo baja si el visitante tiene el ahorro de datos prendido, y deja la foto
de fondo como respaldo. **Está todo hecho y nadie le pasa nunca un video.**

Entonces: **elegí los videos, ponelos en el proyecto, y pasáselos.** Nada más.

1. **Uno por página, y que tenga que ver con esa página.** Es la parte que él remarcó: *"de
   stock relacionadas, no cualquier video"*. En la página de quince, algo de una fiesta de
   quince. En la de casamiento, un casamiento. En la de empresas, un evento corporativo. En
   la portada principal, algo de fiesta en general. **Un video genérico de "gente
   festejando" en la página de casamientos es exactamente lo que pidió que no.**
2. **Gratis y de uso comercial permitido**, sin atribución en pantalla: Pexels y Pixabay
   sirven. **Nada que exija licencia paga**, que sería un gasto, ni que obligue a poner un
   cartel de crédito en la portada.
3. **Guardados en el proyecto**, no enlazados desde afuera: un enlace ajeno se cae o cambia
   y la portada queda rota.
4. **Livianos de verdad.** Pocos segundos, sin sonido, en bucle, comprimidos. Si pesan, la
   página tarda en abrir y eso cuesta ventas. Es una portada, no una película.
5. **De ambiente, no protagonizados.** Luces, brindis, confeti, manos, una mesa servida,
   gente bailando de lejos. **Nunca una quinceañera o unos novios reconocibles en primer
   plano:** eso se lee como una fiesta de AK que no ocurrió, y quien llegue desde ahí
   espera ver eso el día de su evento.
6. **Si algo falla, queda la foto**, como hoy. Eso ya lo hace el componente solo.

### Cómo se sabe que quedó bien

Abrís la portada y las páginas por tipo de evento en un celular y **hay movimiento**, sin
que nadie haya cargado nada ni tocado ningún botón. Y el video de cada página tiene que ver
con lo que esa página vende.

---

## BLOQUE 4 — El cliente ideal, CALCULADO, y los consejos que salen de ahí

**Pedido del dueño, 27 de agosto de 2026:** *"la optimización, consejos, y el cliente ideal
o avatar: ¿eso podrían hacer los agentes?"*

Sí, y hay que hacerlo bien. **No existe nada de esto hoy** (se verificó: lo único que
aparece buscando "avatar" son fotos de perfil).

### La regla que manda en todo el bloque: NO SE INVENTA NADA

Un "cliente ideal" que una IA escribe de la nada es un horóscopo: suena bien, no sirve, y
si el dueño toma decisiones con eso le cuesta plata.

**La app ya sabe quién le compró de verdad.** Tiene presupuestos ganados y perdidos, tipo
de evento, cantidad de invitados, salón, mes, y de dónde vino cada prospecto —la atribución
por fiesta ya existe—. **Todo sale de ahí, o no sale.**

**Si no hay datos suficientes para afirmar algo, se dice.** *"Todavía no hay contratos
cerrados suficientes para sacar un perfil; con diez ya te lo puedo decir."* Eso vale más
que un perfil inventado, y es la regla de siempre: **ninguna pantalla afirma algo que no
comprobó.**

### Qué calcular

Sobre los presupuestos **ganados**, comparados contra los **perdidos**:

- **Qué tipo de evento cierra más**, y cuál deja más plata. No son siempre el mismo, y esa
  diferencia es la que importa.
- **Con cuántos invitados.** El rango donde más se cierra.
- **En qué rango de precio la conversión es más alta.** Puede no ser el más barato.
- **En qué mes se contrata** y para qué mes es la fiesta. Sirve para saber cuándo empujar.
- **Qué salón.**
- **De dónde vinieron.** La atribución por fiesta ya está: qué trajo a los que cerraron.
- **Y lo que más duele: en qué se parecen los que se perdieron.** Si todos los perdidos
  eran de menos de X invitados, eso es una decisión de negocio esperando ser tomada.

### Qué mostrar

1. **Una ficha corta del cliente ideal**, en criollo, de las que se leen en veinte
   segundos: *"Tu mejor cliente son quince años de 120 a 150 invitados, en el Club Uruguay,
   que consultan entre marzo y mayo para una fiesta de fin de año, y llegan por
   Instagram."* Con el número de contratos en que se basa, siempre a la vista.
2. **Tres consejos, no quince.** Concretos y salidos de lo que se calculó: *"el 70% de lo
   que gastás en publicidad va a un público que casi no cierra"*, *"los presupuestos de más
   de X se pierden casi todos: o el precio o la propuesta"*. **Cada consejo tiene que poder
   señalar el dato del que salió.** Un consejo sin dato atrás no va.
3. **Que lo mire un agente y avise cuando cambie.** Sumalo al motor de agentes
   (`src/lib/agentes/motor-agentes.ts`), con el mismo patrón que los demás. No hace falta
   que corra todos los días: una vez por semana alcanza y sobra. Que avise sólo **cuando el
   perfil cambia** —"antes cerrabas casamientos, en los últimos tres meses cerrás quince
   años"—, no que repita lo mismo cada semana.

### Lo que NO se hace

- **No mandes nada al cliente con esto.** Es información para el dueño. Preparar sí, mandar
  no: es la línea de siempre.
- **No inventes un perfil bonito cuando faltan datos.** Decí que faltan.
- No lo cruces con el agente de publicidad para que cambie campañas solo por esto: el
  agente ya tiene sus reglas y su tope.

---

## Cómo se comprueba que quedó bien

- **Bloque 1:** con un tope de $10.000 cargado y una campaña quemando plata, el agente la
  pausa solo y lo deja anotado. Un intento de subir un presupuesto que se pasa del tope
  **no se ejecuta** y queda escrito por qué. Y con el tope al tope, **una campaña nueva
  queda preparada pero apagada**, esperando que la encienda el dueño.
- **Bloque 2:** `/llms.txt` abre y se lee. Cada enlace que nombra existe. La prueba nueva
  falla si se borra el archivo.
- **Bloque 4:** con pocos contratos cerrados, la pantalla **dice que faltan datos** en vez
  de mostrar un perfil. Con contratos suficientes, cada consejo se puede rastrear hasta el
  número del que salió.
- **Bloque 3:** abrís la portada y las páginas por tipo de evento en un celular y **hay
  movimiento**, sin que nadie haya cargado nada ni tocado ningún botón. Y el video de cada
  página tiene que ver con lo que esa página vende.
