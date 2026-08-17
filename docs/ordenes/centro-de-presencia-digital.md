# El centro de la presencia digital de AK

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 17 de agosto de 2026
**Base:** `main` actualizado.

**Esta orden NO se empieza hasta terminar `ahora.md`.** Queda escrita para que el
trabajo esté listo cuando el dueño lo pida.

## Qué pidió el dueño

Un solo lugar donde estén todas las redes, la web y Google: las estadísticas
desde el arranque, revisión diaria automática, contenido generado solo, publicar
una vez y que salga en todas, y saber si cada publicidad rinde.

## Lo que hay que decirle de entrada, porque no todo se puede

**Se verificó con las reglas de cada plataforma. Tres cosas no van:**

1. **Los estados de WhatsApp no se pueden automatizar.** Meta no tiene forma
   oficial. Los servicios de terceros que lo ofrecen manejan la sesión de WhatsApp
   por detrás: son pagos y **pueden hacer que bloqueen el número de la empresa**.
   **No se hace.** Si el dueño insiste, que sea con un número aparte, nunca con el
   de AK.
2. **"Estadísticas desde que comenzó la cuenta" no existe.** Las plataformas no
   entregan el histórico completo hacia atrás; las historias ni siquiera existen
   pasadas las 24 horas. **Lo que sí se puede: guardar los números todos los días
   desde hoy.** A los seis meses AK va a tener un histórico propio que las
   plataformas ya no dan.
3. **Publicar en TikTok requiere que TikTok apruebe la aplicación.** No es
   inmediato y puede no salir. Dejalo preparado pero no lo des por hecho.

## Lo que YA existe (verificado, no lo rehagas)

- **Conexiones de redes:** `src/app/actions/social-connections.ts`. Guarda
  WhatsApp, Facebook, Instagram y TikTok. **Sólo guarda el usuario y el enlace:
  no hay ningún permiso de publicación.**
- **Instagram, sólo lectura:** `syncInstagramPosts()` en
  `src/app/actions/social-media.ts` trae las publicaciones y sus corazones.
- **Planificador de contenido:** pantalla en
  `src/app/(app)/empresa/redes-sociales/page.tsx`, guarda en `social-posts.json`,
  con estados 'Borrador', 'Programado', 'Publicado'. **El estado 'Publicado'
  existe pero nada publica de verdad.**
- **Generación con IA:** `generateDraftPostsFromPartyPhotos()` arma cuatro
  borradores desde las fotos aprobadas de una fiesta, y
  `src/ai/flows/generate-social-post-flow.ts` escribe el texto y los hashtags.
- **Publicidad de Meta:** `src/lib/marketing/meta-ads.ts` y la pantalla
  `/contabilidad/crm/marketing-ads`. Ya trae gasto, impresiones, clics, costo por
  consulta y retorno.
- **Atribución:** `src/lib/commercial/acquisition.ts` guarda de cada consulta el
  origen, la campaña, y de qué fiesta e invitado vino.
- **Google:** `src/app/sitemap.ts` y `src/app/robots.ts`, con una lista cerrada de
  páginas públicas. Y un widget de la ficha de Google, sin sincronización.

**O sea: hay bastante y está desconectado entre sí. Eso es lo que hay que unir.**

---

# BLOQUE 1 — El tablero único

Una sola pantalla interna con **todo el estado de la presencia digital**:

- Seguidores y alcance de cada red, con la variación de la semana.
- Publicaciones hechas y las que vienen programadas.
- Lo que se está gastando en publicidad y qué está trayendo.
- El estado de Google: si la ficha está al día, cuántas reseñas hay.

**Cómo tiene que verse:** el dueño lo abre en el celular una vez por día. **Cuatro
o cinco números grandes arriba**, y el detalle abajo para el que quiera mirar.
Nada de tablas de veinte columnas.

# BLOQUE 2 — Guardar los números todos los días

Como el histórico no se puede pedir hacia atrás, hay que **empezar a construirlo**.

- Una tarea diaria que guarde los números de cada red: seguidores, alcance,
  interacciones, y el desempeño de cada publicación.
- **Un renglón por día y por red.** No miles de registros: uno por día.
- Que el tablero dibuje la evolución con lo que se fue guardando.

**Esto es lo primero que hay que hacer aunque no se haga nada más**, porque cada
día que pasa sin guardarlo es un día de historia que se pierde para siempre.

# BLOQUE 3 — Publicar una vez y que salga en todas

Hoy el planificador guarda el borrador y ahí queda. Falta que publique de verdad.

- **Facebook e Instagram primero**, que son las que más le sirven a AK y las que
  tienen el camino más directo.
- **YouTube y la ficha de Google después.**
- **TikTok al final**, avisando que depende de que ellos aprueben.
- El texto y la foto se escriben una sola vez y se adapta a cada red.

## La regla que no se negocia

> **Nada se publica solo. La app prepara, una persona aprueba.**

Se programa la publicación y **queda esperando un toque de aprobación**. Una
publicación equivocada en el Instagram de la empresa no se puede deshacer.

Y **si una red falla al publicar, que lo diga claro** y no marque como publicado
algo que no salió.

# BLOQUE 4 — La revisión diaria

Una vez por día, la app mira lo que pasó y **le deja un resumen corto al dueño**:

- Qué publicación anduvo mejor y por qué.
- Qué está sin publicar hace días.
- Si alguna cuenta se desconectó.
- **Una sugerencia concreta de qué publicar hoy**, ya escrita, lista para
  aprobar.

**Sin ser un alertadero.** Un resumen por día, no un aviso por cosa. El dueño ya
pidió bajar el ruido.

Y como toda llamada de inteligencia artificial que se paga: **pasa por el
contador**, `hayPresupuestoParaIA()` antes y `registrarConsumoIA()` después, con
su costo en `COSTO_ESTIMADO_UYU`.

# BLOQUE 5 — Qué publicidad trae fiestas de verdad

**Éste es el bloque que más vale de todos, y el único que ninguna plataforma
puede hacer.**

El dueño lo dijo así: *la inteligencia artificial de Meta lo único que te
aconseja es que pongas más plata*. Tiene razón, **y el motivo es que Meta sólo ve
clics**. No sabe cuáles terminaron en una fiesta firmada.

**AK sí lo sabe**, porque tiene las dos puntas: la publicidad por un lado
(`meta-ads.ts`) y la atribución de cada consulta por el otro
(`acquisition.ts`), que llega hasta el presupuesto y la seña.

Hay que unirlas y mostrar, por cada aviso:

> *Gastaste 4.000. Trajo 12 consultas, 3 presupuestos y **1 fiesta firmada**.
> Costo real por fiesta: 4.000 pesos.*

- **Contra la seña cobrada, no contra el clic.** Un clic no es una fiesta.
- **Ordenado por lo que de verdad cerró**, para que se vea de un vistazo qué
  conviene repetir y qué cortar.
- Si un aviso gastó y no cerró nada, **que lo diga sin vueltas**.

## Cuidado de plata

Los números de fiestas y señas salen de lo que ya está cargado. **No inventes
ninguna cuenta nueva ni recalcules totales:** leé los que ya existen. Si te
encontrás escribiendo cómo se arma un monto, parate y avisá.

---

## Lo que NO se toca

- **Los estados de WhatsApp.** Ver arriba.
- **Nada se publica ni se manda solo.**
- **No hagas otro planificador ni otra galería.** Hay uno de cada cosa.
- **No toques `robots.ts` ni `sitemap.ts`** para abrir páginas nuevas a Google.
  Salen de una lista cerrada a propósito: **los portales de los clientes tienen
  que quedar afuera**. Ya hubo un intento de abrirlos y se rechazó.
- **No inventes números.** Si un dato no está, se dice que no está.

## Por dónde empezar, si hay que priorizar

> **Bloque 2** (guardar los números desde hoy) → **Bloque 5** (qué publicidad
> trae fiestas) → **Bloque 1** (el tablero) → **Bloque 3** (publicar) →
> **Bloque 4** (la revisión diaria).

El 2 primero porque cada día que pasa se pierde historia. El 5 segundo porque es
plata directa y ya están las dos puntas construidas.

## Los controles antes de entregar

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

Sobre el conjunto entero. Y anotá en `docs/YA-RESUELTO.md` **sólo lo que hiciste
de verdad**, diciendo **desde qué pantalla se ve cada cosa**.
