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

1. **El agente de publicidad maneja Meta Ads solo.** Crea, ajusta y pausa campañas sin
   preguntar. Se le planteó el riesgo de dejarlo gastar sin supervisión y eligió igual.
   **Es su plata y es su decisión: no la discutas ni la "mejores" pidiendo confirmación.**
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
- Crear una campaña nueva a partir de lo que ya genera `creador-anuncios-ia.ts`.

### EL FRENO DE MANO — esto ya está hecho y es OBLIGATORIO usarlo

**No lo reescribas ni lo esquives.** Está en
`src/lib/marketing/tope-de-gasto-publicidad.ts`, congelado por
`src/__tests__/el-agente-no-se-pasa-del-tope.test.ts`.

**Ninguna operación que aumente el gasto puede ejecutarse sin pasar antes por
`puedeComprometer(...)`.** Si devuelve `permitido: false`, la operación **no se ejecuta**:
se anota el motivo en el registro del agente y se sigue con la siguiente.

Por qué está armado así, para que no lo "mejores" al revés:

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

- No pidas confirmación antes de actuar: ya la decidió.
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

## Cómo se comprueba que quedó bien

- **Bloque 1:** con un tope de $10.000 cargado y una campaña quemando plata, el agente la
  pausa solo y lo deja anotado. Un intento de subir un presupuesto que se pasa del tope
  **no se ejecuta** y queda escrito por qué.
- **Bloque 2:** `/llms.txt` abre y se lee. Cada enlace que nombra existe. La prueba nueva
  falla si se borra el archivo.
