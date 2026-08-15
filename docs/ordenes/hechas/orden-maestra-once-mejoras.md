# Lo que hay que hacer ahora — TODO en una sola propuesta

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 15 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. Reemplaza a `mejoras-01-la-fiesta-vende-la-proxima.md`.

## Cómo se entrega

**TODO va en UNA SOLA PROPUESTA.** El dueño lo pidió así.

Es grande, y por eso hay una regla que no se negocia:

> **Si un bloque se traba, entregá TODOS los demás igual, en la misma propuesta,
> y decí en el mensaje cuál faltó y por qué.** No frenes la entrega entera por
> uno. No entregues a medias sin avisar.

**El orden importa.** Los bloques están ordenados por lo que más rinde. Hacelos
en ese orden: si te quedás sin tiempo, que lo que falte sea del final.

## Antes de programar: TRES COSAS YA ESTÁN HECHAS

Se verificó el código antes de escribir esto. **No las rehagas:**

1. **La app ya sabe de qué fiesta viene cada interesado.**
   `src/lib/commercial/acquisition.ts` define `source`, `campaign`,
   **`refFiestaId`** y **`refGuestId`**;
   `src/lib/crm/public-lead-persistence.ts` ya los guarda con el prospecto; y
   `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx:309` ya arma la
   atribución. **Copiá ese patrón, no inventes otro.**
2. **Los avisos preventivos del evento ya existen.** `src/lib/automatizaciones-engine.ts`
   tiene **once reglas** andando: menú sin definir a 20 días, invitados sin
   confirmar a 10, saldo pendiente a 7, falta seña, cuota vencida, cronograma
   vacío, decoración, canciones, y más. **No hay que construir nada de eso.**
3. **El pedido de reseña en Google ya anda**, y el recontacto del que no señó
   también. Están en `docs/QUE-HAY-EN-LA-APP.md`.

---

# BLOQUE A — La fotocabina ofrece el presupuesto

**El más importante. Empezá por acá.**

`src/app/evento/fotocabina/[fiestaId]/page.tsx` (mirá `handleDownload`, línea 545)

El invitado termina su tanda de tres fotos, la descarga y **ahí termina todo**.
Es el momento del año en que más entusiasmado está con AK, y no hay ninguna
puerta abierta.

**Qué hacer:** en la pantalla donde el invitado ve su recuerdo, debajo de la foto
y de los botones que ya están, un renglón discreto:

> ¿Te toca festejar el año que viene? Mirá cuánto sale tu fiesta →

Lleva al simulador **con la atribución de esta fiesta**: `source: 'guest_portal'`,
`campaign: 'fotocabina'`, `refFiestaId` con el id de la fiesta.

**Cómo tiene que quedar:**
- **No tapa la foto ni los botones.** Un renglón abajo, letra chica.
- **No aparece antes** de que el recuerdo esté listo.
- **No se muestra en la pantalla del operador**, sólo en la del invitado.
- Se apaga desde Ajustes → Contenido público, y **viene prendido**.

# BLOQUE B — Lo mismo en la galería y el muro, y la galería vacía

`src/app/evento/galeria/[fiestaId]/page.tsx` · el muro en `src/app/evento/social/[fiestaId]/`

El mismo renglón con atribución al pie de las dos. Es donde el invitado vuelve al
otro día a buscar sus fotos.

**Y arreglá la galería vacía** (`galeria/[fiestaId]/page.tsx:179`): hoy dice
"¡Sé el primero en compartir un momento!" y **no da ningún botón para hacerlo**.
Poné el botón que lleva a subir la foto o a la estación, y **no muestres los
contadores en cero**: un "0 fotos · 0 me gusta" enfría.

# BLOQUE C — Ver qué fiesta trajo clientes

**El dato ya se guarda. Falta la pantalla.**

Una vista en Contabilidad o en el CRM que muestre, agrupando prospectos por
`refFiestaId`:

| Fiesta | Prospectos que llegaron | Presupuestos | Contratados |
|---|---|---|---|

Ordenada por la que más trajo, con filtro por año.

**Por qué importa:** hoy no se sabe si un cliente vino de Instagram, de la
publicidad paga o de bailar en la fiesta de un primo. Sin eso la publicidad se
gasta a ciegas.

**Pantalla vacía con gracia:** si no hay datos, explicá que se empiezan a contar
cuando los invitados entren por el enlace de la fotocabina o de la invitación.

# BLOQUE D — Arreglos de estética que están pendientes

Salieron de mirar las pantallas, no de leer código.

1. **En el celular, el botón flotante de volver tapa el título de TODAS las
   pantallas internas.** `src/components/module-navigation-dock.tsx:34-38` está
   clavado en `top-20 left-3` encima del contenido. En Pagos Rápidos se lee
   "…os Rápidos" y media frase tapada, **justo en la pantalla que dice ser para
   usar desde el celular**. Bajalo al pie en celular, o dale lugar propio arriba
   y que el contenido arranque debajo. En escritorio hoy no molesta: no lo rompas.
   Donde la pantalla ya tiene su propio "Volver", **dejá uno solo**.
2. **El botón del asistente tapa botones de verdad.** En el Planificador
   Gastronómico se monta sobre "Añadir postre", que queda cortado. Dejá aire al
   pie de las listas.
3. **La portada de la presentación muestra una imagen rota** cuando no hay visual
   cargado: se ve el iconito de imagen fallada y el texto "Visual principal del
   evento". Poné un fondo lindo a propósito (degradado con el color de acento,
   logo tenue). **Nunca el texto alternativo a la vista.**
4. **Los botones "Anterior" y "Siguiente" de la presentación se encinan** con la
   línea de abajo. Dejá aire.

# BLOQUE E — El álbum que el cliente reparte

Hoy el cliente ve sus fotos en el portal, pero no tiene nada lindo para mandarle
a la familia por WhatsApp.

Una página pública del álbum, con enlace propio:
- Nombre de la fiesta y fecha, grandes.
- Las fotos aprobadas, que se luzcan: grilla ancha, se abren a pantalla completa.
- La marca de AK **discreta, al pie**, nunca encima de las fotos.
- Al final, el renglón con el enlace al simulador y la atribución de esa fiesta.
- Un botón "Compartir" que copie el enlace.

**Sólo fotos aprobadas**, nunca las que esperan revisión. Y **no cambies** la
descarga por enlace directo: es una decisión tomada, está en `YA-RESUELTO.md`.

# BLOQUE F — El ranking de la noche en la pantalla gigante

Las fotos del muro ya se ven en la pantalla grande. Falta lo que hace participar.

Cada tanto, la pantalla muestra **"La foto más querida de la noche"** con la que
más corazones tiene, y una tabla corta de las mesas que más participaron.

**Nada de nombres propios y nada de perdedores: sólo festejar.** Y sólo contenido
aprobado.

# BLOQUE G — Un mensaje para abrir dentro de años

El buzón de deseos ya existe. Esto le da sentido en el tiempo.

Que el invitado pueda dejar un saludo marcado como **"abrir dentro de X años"**.
Queda guardado con esa fecha, separado de los deseos normales, y en la pantalla
del equipo se ve la lista de los que hay y para cuándo son.

**El envío en la fecha no lo hagas todavía**: alcanza con guardarlo bien y que se
pueda ver. Avisá qué haría falta para mandarlo solo.

# BLOQUE H — Que el invitado pida música

El guion del DJ ya existe. Falta el pedido del invitado.

Una pantalla donde los invitados escriben el tema que quieren, y el DJ ve la
lista **ordenada por cuántos lo pidieron**. El DJ elige: la lista es una
sugerencia, no una orden.

Con tope por invitado para que no la llenen entre tres.

# BLOQUE I — El pedido a cada proveedor, listo para mandar

`src/app/(app)/fiestas/nueva/catering/lista-compras/`

La lista de compras ya se agrupa por proveedor. Falta el último paso: un botón
por proveedor que arme el mensaje de WhatsApp **con lo que le toca a él y nada
más**, listo para mandar.

Hoy alguien copia esa lista a mano, y ahí es donde se pierden cosas.

**Ojo:** la lista de compras es plata y comida. **No toques los cálculos**, sólo
armá el mensaje con lo que ya está en pantalla. Si algo del cálculo te parece
mal, avisá y seguí.

# BLOQUE J — Las fotos de la fiesta se vuelven posteos

El planificador de contenido ya escribe con inteligencia artificial.

Al día siguiente de cada fiesta hay decenas de fotos aprobadas. Que la app arme
sola tres o cuatro posteos —foto elegida, texto escrito, etiquetas— y los deje
**en borrador** en el planificador, para aprobar con un toque.

**Nunca se publica solo.** Queda esperando aprobación.

# BLOQUE K — El presupuesto que se explica solo

El cliente abre el presupuesto y ve una lista con precios, pero no ve **por qué**
ese precio.

Un párrafo corto arriba del detalle, escrito a partir de lo que está contratado:
*"Para 80 personas en el Club Uruguay incluimos X, Y y Z; el salón ya viene con
la limpieza"*.

**Regla dura:** el párrafo **describe** lo contratado, **no calcula ni inventa
números**. Los precios salen del presupuesto, nunca del texto generado. Ya se
sacó una vez una función por inventar cuentas que el cliente lee como precio
firme.

---

## Lo que NO se hace

- **Publicar automático en Instagram, Facebook o TikTok.** Es la que más trámite
  tiene con Meta y la que menos trae. Queda para más adelante.
- **Migrar colores al tema.** Descartado: la app no tiene modo oscuro. Está
  explicado en `docs/YA-RESUELTO.md`.

## Lo que NO se toca nunca

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`. **Si hay conflicto ahí, quedate con esa versión.**
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Plata, cobros, comida y permisos: eso lo escribe Claude.

## Nada de cambios sueltos

- **No commitees `public/firebase-messaging-sw.js`**: se genera al compilar.
- **No cambies imports ni librerías que no vengan al caso.** Una entrega cambió
  el `z` de `genkit` a `zod` y compilaba igual, pero podía fallar al usarlo.
- Si encontrás algo roto de paso, **avisalo, no lo arregles acá**.

## Los controles antes de entregar

En este orden, el build primero:

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

Y **mirá las pantallas**, no sólo las pruebas:

```
AK_FOTOS=true node scripts/run-playwright-production.mjs tests/e2e/fotos-de-la-app.spec.ts
```

## Cuando termines

Avisá el número de la propuesta, decí **qué bloques entraron y cuáles no**, anotá
lo hecho en `docs/YA-RESUELTO.md`, actualizá `docs/QUE-HAY-EN-LA-APP.md`, y mové
este archivo a `hechas/` en la misma propuesta.
