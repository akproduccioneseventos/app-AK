# Orden 82 — Una lista vieja no borra lo que otro guardó (prospectos, clientes, agenda y mensajes)

**Para Gemini. UNA SOLA PROPUESTA con los cuatro bloques.** Si un bloque se traba, entregá el
resto igual, en la misma propuesta, y decí cuál faltó.

Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` sobre lo que tocaste, y la
**pregunta 22** de `docs/COMO-AUDITAR.md`.

## De dónde sale

El 23 de septiembre de 2026 se encontró que **guardar una lista entera leída un rato antes
borra o pisa lo que otro guardó mientras tanto**. Pasa porque `writeData(ARCHIVO, lista)` sobre
una colección escribe cada registro de la lista **y borra de la base todo lo que no está en
ella** (`src/lib/firebase-sync.ts`, `syncToFirestore`). El turno (`AsyncMutex`) sólo cuida UN
servidor, y la app corre en varios.

En la plata ya está arreglado (lo hizo Claude). **Esta orden es lo mismo para el resto**,
empezando por lo que más le cuesta al negocio: un prospecto que desaparece es una venta perdida.

## Cómo se arregla (el modelo ya está escrito, copialo)

Mirá `src/app/actions/salones.ts` y `src/app/actions/gastos.ts`: son el modelo exacto.

- Con base (`process.env.AK_USE_LOCAL_JSON_ONLY !== 'true'`):
  - **crear un registro** → `createDataItem(ARCHIVO, COLECCION, id, registro)`;
  - **cambiar uno** → `mutateDataItem<T>(ARCHIVO, COLECCION, id, (actual) => nuevo)`, con la
    lógica ADENTRO de la función que recibe `actual` (el dato leído en ese momento), y
    devolviendo `null` si no hay que guardar;
  - **borrar uno** → `deleteDataItem(ARCHIVO, COLECCION, id)`.
  Todas en `src/lib/data-service.ts`. El nombre de la COLECCION sale de `FILE_TO_COLLECTION`
  en `src/lib/firebase-sync.ts` (por ejemplo `'crm-leads.json': 'prospectos'`).
- Sin base (las pruebas de navegador): **se deja el camino de hoy**, con su turno.
- Los identificadores nuevos llevan algo al azar: `x_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.
  Con `Date.now()` solo, dos creados en el mismo milisegundo se pisan.

## Bloque 1 — Prospectos (`src/app/actions/crm.ts`)

Los tres `writeData(LEADS_FILE, ...)` de las líneas ~66, ~97 y ~115 (crear, cambiar y
reemplazar prospectos). `resetCrm` (~402) **NO se toca**: borra todo a propósito.

## Bloque 2 — Clientes (`src/app/actions/customers.ts`)

`saveCustomer` (~171), `deleteCustomer` (~249) y `addDocumentReferenceToCustomer` (~392).

## Bloque 3 — Reuniones de la agenda (`src/app/actions/agenda.ts`)

`createAppointment` (~289), `updateAppointmentStatus` (~336) y `updateAppointment` (~373).
**No toques** `diaCivilEnUruguay` ni `esUnDiaQueExiste`: son de Claude y andan.

## Bloque 4 — Mensajes programados (`src/app/actions/scheduled-messages.ts`)

Las seis funciones que hacen `writeData(SCHEDULED_MESSAGES_FILE, ...)`. Ojo: estos mensajes
**se preparan, no se mandan solos** (decisión del dueño). No cambies eso.

## Qué NO se toca

- Nada de `presupuestos`, `invoices`, `cupones`, `gastos`, `recibos-personal`, `insumos`,
  `menus-catering`, ni `src/lib/firebase-sync.ts`: son de Claude.
- Si encontrás esta misma forma en algo de plata, comida o permisos, **no lo arregles: listalo
  en la descripción de la propuesta** y se lo pasás a Claude.

## Qué tiene que comprobar la prueba

Una prueba de Jest por bloque, en `src/__tests__/`, con una base de mentira que **devuelve
copias y tarda** (mirá `src/__tests__/la-plata-no-se-pierde-entre-servidores.test.ts`, es el
modelo). Tiene que comprobar **el resultado**:

- dos creaciones a la vez → quedan las dos;
- cambiar uno mientras otro crea → queda el cambio Y el creado;
- borrar uno no borra otro creado mientras tanto.

**Y se da por buena recién cuando se puso en rojo con el código de antes** (error 11 de
`CLAUDE.md`: con la misma lista en memoria una prueba de "dos a la vez" no falla nunca).

```comprobar
usa: createDataItem en src/app/actions/crm.ts
usa: mutateDataItem en src/app/actions/customers.ts
usa: mutateDataItem en src/app/actions/agenda.ts
usa: mutateDataItem en src/app/actions/scheduled-messages.ts
prueba: src/__tests__/los-prospectos-no-se-pierden-entre-servidores.test.ts
```
