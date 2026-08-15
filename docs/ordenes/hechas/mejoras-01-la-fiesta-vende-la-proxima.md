# Mejoras — tanda 1: que la fiesta venda la próxima

**Para:** Gemini (Antigravity)
**Escribe:** Claude
**Fecha:** 15 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

**Todos los bloques van en UNA SOLA PROPUESTA.** Si alguno se traba, entregá el
resto igual, en la misma propuesta, y avisá cuál faltó.

## El problema que resuelve esta tanda

La app hace fiestas muy buenas y después **se apaga**. Cien invitados la pasan
bárbaro, se van a la casa y no queda ninguna puerta abierta. Esa noche es el
momento del año en que más gente está entusiasmada con AK, y hoy no se usa.

## Buena noticia: la mitad ya está hecha por dentro

**Antes de programar, leé esto. No lo rehagas.**

- `src/lib/commercial/acquisition.ts` ya define de dónde viene un interesado, con
  `source`, `campaign`, **`refFiestaId`** y **`refGuestId`**.
- `src/lib/crm/public-lead-persistence.ts` ya **guarda** esos datos con el
  prospecto.
- `src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx:309` ya arma la
  atribución para el invitado que entra por la invitación.

O sea: **la app ya sabe de qué fiesta vino cada prospecto.** Lo que falta es
ofrecerlo en el momento bueno y poder verlo.

---

# BLOQUE A — La fotocabina ofrece el presupuesto

`src/app/evento/fotocabina/[fiestaId]/page.tsx` (mirá `handleDownload`, línea 545)

Cuando el invitado termina su tanda de tres fotos, puede descargarlas. **Ahí
termina todo.**

**Qué hacer:** en la pantalla del invitado (`role === 'display'` no; esto va en la
pantalla donde el invitado ve su recuerdo), debajo del recuerdo y de los botones
que ya están, agregar un renglón discreto:

> ¿Te toca festejar el año que viene? Mirá cuánto sale tu fiesta →

El enlace va al simulador **con la atribución de esta fiesta**, usando lo que ya
existe: `source: 'guest_portal'`, `campaign: 'fotocabina'`, `refFiestaId` con el
id de la fiesta. Copiá el patrón de la línea 309 de la invitación.

**Cómo tiene que quedar, sin discusión:**

- **No tapa la foto ni los botones.** Va abajo, en letra chica, un solo renglón.
- **No aparece antes** de que el invitado tenga su recuerdo listo.
- **No se muestra en la pantalla del operador**, sólo en la del invitado.
- Se puede apagar desde Ajustes → Contenido público, y **viene prendido**.

# BLOQUE B — Lo mismo en la galería y en el muro

`src/app/evento/galeria/[fiestaId]/page.tsx`
`src/app/evento/social/[fiestaId]/` (el muro)

Mismo renglón, mismo enlace con atribución, al pie de la galería y del muro. Es
donde el invitado vuelve al otro día a buscar sus fotos: sigue entusiasmado y ya
no está en la fiesta.

**Y de paso, en la galería vacía** (`galeria/[fiestaId]/page.tsx:179`): hoy dice
"¡Sé el primero en compartir un momento!" y **no da ningún botón para hacerlo**.
Poné el botón que lleva a subir la foto o a la estación, y **no muestres los
contadores en cero**: un "0 fotos · 0 me gusta" enfría.

# BLOQUE C — Ver qué fiesta trajo clientes

**El dato ya se guarda. Falta la pantalla.**

Hacé una vista dentro de Contabilidad o del CRM que muestre, por fiesta:

| Fiesta | Prospectos que llegaron | Presupuestos | Contratados |
|---|---|---|---|

Se arma agrupando los prospectos por `refFiestaId`. Ordenada por la que más
trajo. Con un filtro por año.

**Por qué importa:** hoy no se sabe si un cliente nuevo vino de Instagram, de la
publicidad paga o de bailar en la fiesta de un primo. Sin eso, la plata de
publicidad se gasta a ciegas. Con eso el dueño puede decir *"las fiestas de
quince en el Club Uruguay me traen tres clientes cada una"*.

**Pantalla vacía con gracia:** si todavía no hay datos, explicá que se empiezan a
contar cuando los invitados entren por el enlace de la fotocabina o de la
invitación.

# BLOQUE D — El álbum que el cliente reparte

Hoy el cliente ve sus fotos en el portal. No tiene nada lindo para mandarle a la
familia por WhatsApp.

**Qué hacer:** una página pública del álbum de la fiesta, con enlace propio:

- El nombre de la fiesta y la fecha, grandes.
- Las fotos aprobadas, que se luzcan: grilla ancha, se abren a pantalla completa.
- La marca de AK **discreta, al pie**, no encima de las fotos.
- Un renglón al final con el enlace al simulador, con la atribución de esa fiesta.
- Un botón "Compartir" que copie el enlace.

**Cuidado con lo que ya está decidido:** las fotos del muro se descargan con el
enlace directo **a propósito** (está en `docs/YA-RESUELTO.md`). No lo cambies.

**Sólo fotos aprobadas.** Nunca las que están esperando revisión.

---

## Lo que NO se toca nunca

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Plata, cobros, comida y permisos: eso lo escribe Claude.
- **No migres colores al tema.** Está descartado y explicado en `YA-RESUELTO.md`.

## Nada de cambios sueltos

- **No commitees `public/firebase-messaging-sw.js`**: se genera al compilar.
- **No cambies imports ni librerías que no vengan al caso.**
- Si encontrás algo roto de paso, **avisalo, no lo arregles acá**.

## Los controles antes de entregar

1. `npm run build`
2. `npx tsc --noEmit`
3. `npx jest --silent`
4. `npm run check:acentos`

Y **mirá las pantallas**, no sólo las pruebas:

```
AK_FOTOS=true node scripts/run-playwright-production.mjs tests/e2e/fotos-de-la-app.spec.ts
```

## Cuando termines

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md`,
actualizá `docs/QUE-HAY-EN-LA-APP.md` con lo nuevo, y **mové este archivo a
`hechas/` en la misma propuesta**.
