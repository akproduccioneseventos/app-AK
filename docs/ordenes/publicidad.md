# EL CEREBRO DE PUBLICIDAD DE AK

**Para:** Gemini (Antigravity)
**Escrita:** 23 de agosto de 2026.
**Cuándo:** después de `docs/ordenes/ahora.md` (los cinco bloques de venta).

## Lo que pidió el dueño

> *"Mi idea era poder mejorar lo que tiene Meta: que revise mis gastos y
> publicidades y me ayude a mejorar mi conversión. Que sea espectacular."*

**Tiene que quedar espectacular.** No es una pantalla más de números: es la
pantalla donde el dueño decide **dónde poner la plata de publicidad**.

## Cómo se entrega

**UNA SOLA propuesta con los cinco bloques adentro.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cuál faltó.

**Arrancá desde la versión principal de ahora.** Antes de tocar nada, leé
`docs/MANUAL-DE-LA-APP.md` y `docs/YA-RESUELTO.md`.

**Antes de fusionar:** tipos en cero, pruebas en verde, `npm run check:acentos`
limpio y `npm run build` que termine bien.

---

## LO QUE YA EXISTE — no lo rehagas, conectalo

Esto es lo más importante de la orden: **el 70% ya está construido y las dos
mitades no se hablan.**

**Ya existe el medidor** (`src/lib/marketing/meta-ads.ts`): se conecta a la cuenta
publicitaria de Meta y trae, campaña por campaña, **cuánto se gastó**,
impresiones, clics y porcentaje de clics. Y hace lo que Meta **no puede hacer**:
cruza ese gasto con los prospectos reales del CRM y calcula **cuánto costó cada
consulta** y **cuánta plata volvió por cada peso invertido**. Meta no sabe cuál de
esas consultas terminó en una fiesta contratada; la app sí.
Ya genera recomendaciones (`generateMetaCommercialAIRecommendations`).

**Ya existe el creador** (`src/lib/marketing/creador-anuncios-ia.ts` y su auditor):
escribe el anuncio completo, el guión del reel segundo por segundo, la sugerencia
visual y el público. El auditor puntúa gancho, palabras emocionales y llamado a la
acción **sin gastar inteligencia artificial** (funciona con reglas). Eso está bien
pensado y no se toca.

**El agujero:** el creador escribe a ciegas y el medidor sabe qué funcionó, **pero
no se hablan.**

---

## BLOQUE 1 — Que el creador use lo que de verdad funcionó

**Hoy:** el creador arma el anuncio de memoria, con reglas genéricas.

**Que pase:** antes de escribir, mira los números reales del medidor y **arranca
por lo que trajo clientes**.

1. **Que sepa qué anduvo.** Cruzá tipo de evento, tono y objetivo con el costo por
   consulta real de las campañas pasadas. Si los anuncios de quince años con foto
   real traen consultas a 300 pesos y los de texto solo a 1.200, **el creador tiene
   que proponer los primeros**, y decir por qué.
2. **Que lo diga en pantalla:** *"Este formato te viene trayendo consultas a $300.
   El otro, a $1.200."* Sin eso el dueño no confía en la sugerencia.
3. **Si todavía no hay datos suficientes** (campañas nuevas, pocas consultas), que
   lo diga y use las reglas de siempre. **Nunca inventar un número de rendimiento.**

---

## BLOQUE 2 — Que use el material real de AK

El creador arma anuncios genéricos teniendo a mano el mejor material que existe:
**las fiestas de verdad.**

1. **Fotos reales aprobadas** del muro y de la galería, elegidas por tipo de
   evento. Una foto de una fiesta suya vende más que cualquier imagen inventada.
2. **Testimonios reales** de clientes, para usar como frase del anuncio.
3. **Los servicios y precios del catálogo**, nunca inventados. Si menciona una
   promoción, que sea una promoción cargada de verdad.
4. **Los datos del salón y de la zona**: Salto, el Club Uruguay, lo que AK tiene.

**Regla dura:** si el anuncio nombra un precio, una promoción o un servicio, **sale
del catálogo o no se nombra**.

---

## BLOQUE 3 — La pantalla que dice dónde poner la plata

Una sola pantalla, en `/contabilidad/crm/marketing-ads`, que conteste **cuatro
preguntas en criollo**, sin una sola palabra técnica:

1. **¿Cuánto gasté?** Este mes y comparado con el anterior.
2. **¿Qué me trajo?** Cuántas consultas, cuántas se volvieron clientes, cuánta
   plata facturada.
3. **¿Cuánto me sale conseguir un cliente?** Y cuánto vuelve por cada peso.
4. **¿Qué hago mañana?** Dos o tres frases concretas: *"El anuncio de bodas te está
   costando $1.400 por consulta y ninguna cerró: apagalo."* / *"El de quince trae
   consultas a $300 y cerraste dos fiestas: subile el presupuesto."*

**Traducí toda la jerga**, esto es obligatorio:
- CPL → **"lo que te sale cada consulta"**
- ROAS → **"cuánto volvió por cada peso que pusiste"**
- CTR → **"de cada cien que lo vieron, cuántos hicieron clic"**
- Impresiones → **"cuántas veces se mostró"**
- Conversión → **"cuántos terminaron contratando"**

**Y lo más importante: que se vea el camino completo.** De cada campaña: se mostró
tantas veces → tantos hicieron clic → tantos escribieron → tantos se reunieron →
tantos contrataron → tanta plata. **Ahí se ve dónde se pierde la gente**, que es lo
que ninguna herramienta de Meta le muestra.

**Si la cuenta publicitaria no está conectada**, la pantalla lo dice en criollo y
explica cómo conectarla, con el mismo trato que Instagram. **Nunca números
inventados de ejemplo.**

---

## BLOQUE 4 — Que avise sin que le pregunten

Usá el despertador y los agentes que ya existen (`src/lib/agentes/motor-agentes.ts`).
Un agente nuevo de publicidad que revise una vez por día y avise:

- **"Este anuncio está quemando plata"**: gastó más de X sin traer una sola
  consulta.
- **"Este anuncio está andando"**: trae consultas baratas y cerró fiestas.
- **"Se te acabó el presupuesto de la campaña"** o dejó de mostrarse.
- **"Este mes gastaste más que el anterior y trajiste menos."**

**Y la regla que no se negocia, igual que el resto de los agentes:** el agente
**mira, detecta y avisa. NO toca la cuenta de Meta.** No sube ni baja presupuestos,
no pausa ni activa campañas, no gasta un peso. **Eso lo decide una persona.**
Un agente que se equivoca avisando cuesta treinta segundos; uno que se equivoca
gastando cuesta plata de verdad.

---

## BLOQUE 5 — Cerrar el círculo

Hoy el creador arma el anuncio y hay que copiarlo a mano.

1. **Que el anuncio armado se pueda mandar al planificador de contenido como
   borrador**, listo para programar. La app ya publica sola en Instagram y
   Facebook: **usá ese camino**.
2. **Que quede guardado** con su tipo, tono y objetivo, para poder medir después
   qué anduvo. Sin eso, nunca vamos a saber qué formato funciona.
3. **Que se pueda copiar el guión del reel** en un toque, para grabarlo con el
   celular.

---

## Cómo se prueba que quedó bien

**No alcanza con que compile.**

- Una prueba de que el creador **usa los números reales** cuando hay datos, y que
  **avisa y no inventa** cuando no los hay.
- Una prueba de que **ningún precio ni promoción sale del modelo**: todos del
  catálogo.
- Una prueba de que el agente de publicidad **no puede tocar la cuenta de Meta**.
- Una prueba de que, sin la cuenta conectada, la pantalla **lo dice** y no muestra
  números de ejemplo.

---

## Lo que no se toca

- `apphosting.yaml`: el servidor se duerme a propósito.
- Nada que aumente lo que se paga por mes sin avisar. **Cuidá el gasto de
  inteligencia artificial**: el auditor funciona con reglas y así se queda; el
  creador respeta el tope mensual y, si se llegó, avisa en vez de fallar.
- El WhatsApp prepara mensajes y no los manda.
- **Ningún precio se inventa.**
- Si tocás o agregás una pantalla, **corré `npm run mapa:generar`** y anotá el
  cambio en `docs/YA-RESUELTO.md`, en la misma propuesta.
