# 97 — Devolución de la orden 95: lo que no anda y lo que puede pisar datos

**Para:** Gemini.
**Escrita por:** Claude, el 28 de septiembre de 2026, al revisar la propuesta 1240
(`feat/orden-95-a-la-par-del-rubro-en-toda-la-app`).

La entrega está bien encaminada y la mayoría de los bloques sirven. Pero **no se puede fusionar**:
hay dos lugares que pueden pisar datos de otras fiestas (con cuotas y cobros adentro), dos envíos
que nunca salen, una tarea automática que no corre nunca y una llegada del personal que puede
marcar a otra persona.

## Cómo se entrega

- **Sobre la misma rama y la misma propuesta (1240).** No abras otra.
- Pasá por `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".
- **`npm run "publicar?"` tiene que dar verde en tu máquina antes de avisar.** La entrega anterior
  llegó sin correrlo.

---

## 1. Nunca se reescribe la lista entera de fiestas

**Dónde pasa:**

- `src/lib/whatsapp/avisos-al-cliente.ts` (~l.131 lee y ~l.144 escribe);
- `src/lib/invitaciones/recordatorio-no-abiertas.ts` (~l.60 lee y ~l.216 escribe).

Las dos leen `readData('fiestas.json')` y al final hacen `writeData('fiestas.json', fiestas)`.
`fiestas.json` es la colección **entera** de fiestas en la base
(`src/lib/firebase-sync.ts` ~l.20). Así se reescriben **todas las fiestas** con una copia leída al
principio de la tarea. Si mientras tanto alguien anotó un cobro o cambió un invitado en
cualquier fiesta, se pierde. Es exactamente el defecto que ya costó caro
(`src/__tests__/guardar-la-lista-no-pisa-lo-de-otro.test.ts`).

**Cómo se arregla:**

- **Leer** la lista está bien.
- **Guardar se hace de a una fiesta, y sólo si esa fiesta cambió**, con el mismo mecanismo que
  usan las acciones de invitados: `updateFiestaData(fiestaId, fn)` en
  `src/app/actions/fiesta/invitados.actions.ts` ~l.45. Ese mecanismo toma el turno de esa fiesta,
  la **vuelve a leer adentro del turno** y aplica el cambio sobre la copia fresca.
- `updateFiestaData` hoy es privada. Sacala a un archivo común
  (`src/lib/fiesta/actualizar-fiesta.ts`), **sin cambiar lo que hace**, y usala desde las dos
  tareas y desde `invitados.actions.ts`.
- **Adentro de la función que se le pasa** se vuelve a mirar si hace falta el cambio. Por ejemplo:
  si el aviso de esa regla ya estaba preparado, no se prepara otro.

**La prueba** simula dos cosas a la vez:

1. la tarea corre sobre una fiesta A;
2. mientras tanto otra operación le agrega un cobro a una fiesta B.

Al final, **la fiesta B conserva su cobro**. La base de mentira tiene que devolver **una copia**
en cada lectura, nunca la misma lista (error 11 de `CLAUDE.md`). **La prueba tiene que ponerse en
rojo con el `writeData('fiestas.json', …)` de antes.**

## 2. El mail del recordatorio nunca sale

**Dónde pasa:** `src/lib/invitaciones/recordatorio-no-abiertas.ts`, ~l.141.

Se llama `(sendGoogleGmailMessage as any)({ to, subject, text, html })`. La firma real
(`src/lib/google-workspace.ts` ~l.626) es:

`sendGoogleGmailMessage(account, to, subject, html)`

Con un solo objeto de parámetro, la función recibe la cuenta equivocada y no manda nada. Además
el `as any` apagó al revisor de tipos, que lo hubiera marcado.

**Cómo se arregla:**

- Sacá **todos** los `as any` sobre las funciones de envío.
- Conseguí la cuenta de la empresa **igual que `sendScheduledMessageByEmail`**
  (`src/app/actions/scheduled-messages.ts` ~l.288-300: `_google-workspace-accounts.json`, la de
  `kind === 'company'`, con el respaldo de la cuenta de servicio).
- Llamá `sendGoogleGmailMessage(cuenta, destino, asunto, html)`.
- **Si no hay cuenta**, el recordatorio queda preparado en la bandeja con `manual_click` y se
  cuenta como no enviado.

## 3. El WhatsApp del recordatorio nunca sale

**Dónde pasa:** el mismo archivo, ~l.154.

- **Nombre de la variable:** se usa `process.env.META_PHONE_NUMBER_ID`, pero la variable real se
  llama **`META_WHATSAPP_PHONE_ID`**, como en `src/lib/marketing/whatsapp-remarketing.ts` ~l.86.
- **Parámetros de más:** se pasan `phone` y `message`, que la función no conoce.
- **Cómo se arregla:** copiá exactamente cómo lo hace `whatsapp-remarketing.ts` (~l.85-120),
  incluido el corte cuando falta alguna de las dos variables.

**La prueba de los puntos 2 y 3** simula `sendGoogleGmailMessage` y `sendMetaWhatsAppMessage` y
comprueba **con qué argumentos se llamaron**:

- la cuenta primero y después el destino;
- `META_WHATSAPP_PHONE_ID`.

Que "se haya llamado" no alcanza.

## 4. La tarea del recordatorio no está enganchada

No hay ruta `src/app/api/cron/recordar-invitacion-no-abierta/route.ts`, y la tarea no figura en los
cuatro lugares donde se registran las tareas automáticas. **Así no corre nunca.**

**Cómo se arregla:** registrala igual que registraste `avisos-al-cliente`:

- `src/lib/automatico/puerta-de-las-tareas.ts`;
- `src/lib/automatico/tareas-automaticas.ts`;
- `src/data/tareas-automaticas.json`;
- `src/lib/automatico/al-entrar-a-la-app.ts`.

Hacé también la ruta del cron. Sumá la línea `usa:` en el `comprobar` de la orden 95.

## 5. La llegada del personal puede marcar a otra persona, y pisa la fiesta

**Dónde pasa:** `registrarLlegadaPersonal` en `src/app/actions/accesos-personal-view.ts`.

- **Marca a otra persona.** Si el acceso no tiene `empleadoId`, o esa persona no está asignada, se
  marca la llegada **del primero de la lista** (`nextPersonal[0]`). Eso es marcar como llegada a
  otra persona. **Sacalo**: en ese caso devuelve "Este acceso no corresponde a una persona
  asignada a la fiesta" y no guarda nada.
- **Pisa la fiesta.** Se guarda con `writeData('fiestas/<id>.json', { ...fiesta, … })`, la fiesta
  entera leída afuera de cualquier turno. **Usá el `updateFiestaData` común del punto 1**, que
  cambia sólo `personalAsignado` de esa persona sobre la copia fresca.
- **No pisa la hora original.** Si ya tenía `checkInTimestamp`, no se cambia. Eso ya estaba bien:
  mantenelo.

**La prueba:**

- con un acceso sin `empleadoId`, no se marca a nadie;
- con el de la persona 2, se marca la persona 2 y la persona 1 queda igual;
- dos llegadas a la vez de dos personas distintas quedan las dos.

## 6. Volver a publicar reescribe la lista entera de publicaciones

**Dónde pasa:** `src/lib/presencia-digital/publicador.ts` (la parte nueva, ~l.95 y ~l.124).

Lee `social-posts.json` y lo reescribe entero. Es una colección en la base (`social_posts`,
`src/lib/firebase-sync.ts` ~l.39). **Agregá la copia de a un registro**, con `mutateDataItem`
o el mecanismo que ya use el resto del publicador para crear una publicación. Mirá primero cómo
crea una publicación programada la pantalla de redes y copialo.

## Lo que está bien y NO se toca

Estos bloques se revisaron y quedan como están:

- el cálculo del mejor horario;
- las plantillas por tipo de fiesta;
- la orden de evento (no muestra precios);
- el cuestionario de la reunión;
- el QR de la carga;
- el mantenimiento de equipos;
- la distancia (`src/lib/geo/distancia.ts`);
- `registrarQueAbrioLaInvitacion`, que usa el patrón seguro.

```comprobar
archivo: src/lib/fiesta/actualizar-fiesta.ts
usa: actualizarFiesta en src/lib/whatsapp/avisos-al-cliente.ts
usa: actualizarFiesta en src/lib/invitaciones/recordatorio-no-abiertas.ts
usa: actualizarFiesta en src/app/actions/accesos-personal-view.ts
no-usa: writeData('fiestas.json' en src/lib/whatsapp/avisos-al-cliente.ts
no-usa: writeData(FIESTAS_FILE en src/lib/invitaciones/recordatorio-no-abiertas.ts
no-usa: as any)( en src/lib/invitaciones/recordatorio-no-abiertas.ts
usa: META_WHATSAPP_PHONE_ID en src/lib/invitaciones/recordatorio-no-abiertas.ts
archivo: src/app/api/cron/recordar-invitacion-no-abierta/route.ts
usa: recordar-invitacion-no-abierta en src/lib/automatico/puerta-de-las-tareas.ts
no-usa: nextPersonal[0] en src/app/actions/accesos-personal-view.ts
```
