# Orden 276 — Acceso de auditor externo: ve toda la app hasta que el dueño lo cierre, y no puede cambiar nada (11/11/2026)

**Para Gemini.** Arrancá de `claude/app-debug-stabilize-m70e6z` actualizada (`git pull`), rama nueva
`gemini/orden-276-auditor-externo`. **Una sola entrega, sin fusionar.** Es un cambio de **permisos**: Claude lo revisa
línea por línea. Repasá `docs/ANTES-DE-ENTREGAR.md` y el candado de la plata (`src/__tests__/el-candado-de-la-plata.test.ts`).

**Lo que pidió el dueño, con sus palabras:** *"imaginate una oficina y viene un auditor externo: la oficina le tiene que
dar todo para que audite"*. Ve **toda** la app, todos los módulos, con los datos reales, incluidos el portal del
cliente y lo que ve el invitado. **Sin poder modificar nada.**

**Cambio del dueño, mismo día:** *"72 horas es muy poco; yo te aviso cuando termine y tú lo cerrás, pero que quede
creado para futuras auditorías"*. **No vence solo:** dura hasta que se corta. Y queda armado para volver a usarlo.

## Bloque 1 — El perfil "auditor"

- En `src/lib/auth/perfiles.ts`:
  - sumá `'auditor'` al tipo `Perfil` (~36);
  - en `PERMISOS_POR_PERFIL` (~50), `auditor: TODOS`, para que entre a todas las pantallas;
  - en `NOMBRE_DEL_PERFIL` (~71), "Auditor externo (sólo mirar)";
  - **no** lo sumes a `PERFILES_DEL_EQUIPO` (~92): no es del equipo, no le llegan avisos ni tareas.
- **No se toca** ningún otro perfil ni permiso.

## Bloque 2 — El candado de "sólo mirar", en UN solo lugar que todo atraviesa

Archivo nuevo `src/lib/auth/solo-lectura.ts`, con `exigirQueSePuedaGuardar()`: lee la sesión (`verifySession`,
`src/lib/auth/session-token.ts` ~151) y, si el perfil es `auditor`, tira
`Error('Acceso de auditor: se puede mirar todo, pero no guardar ni mandar nada.')`. Sin sesión (las tareas automáticas
y el despertador) **no frena nada**.

Se llama **al principio** de:

- `writeData`, `createDataItem`, `mutateDataItem` y el borrado de `src/lib/data-service.ts`;
- `mutateGenericJsonArray`, `mutateGenericJsonArrayConTransaccion`, `mutarDocumentoConTransaccion` y `mutarDocumento`
  de `src/lib/generic-json-store.ts`;
- `uploadToStorage`, `uploadToStorageWithDownloadToken` y los borrados de `src/lib/firebase/storage.ts`;
- **la base de datos directa:** muchas acciones escriben con `dbAdmin.collection(...).doc(...).set/update/delete`, con
  `batch()` o con `runTransaction`. En `src/lib/firebase/server.ts` (~96), envolvé `dbAdmin` para que esas escrituras
  (y `commit` del lote y `runTransaction`) pasen primero por `exigirQueSePuedaGuardar()`. **Las lecturas no se tocan.**
- **lo que sale para afuera, aunque no guarde:** el envío de WhatsApp (`src/lib/whatsapp/meta-sender.ts`), los correos,
  la publicación en redes (`publishPostInternal` en `src/lib/presencia-digital/publicador.ts`), los cobros de Mercado
  Pago y el gasto de IA (`registrarConsumoIA` en `src/lib/ai/consumo-servidor.ts`).

En la pantalla, el error se muestra como cualquier otro: el auditor toca "Guardar" y lee ese cartel.

## Bloque 3 — Que vea también el portal del cliente y lo del invitado

- En la ficha de cada fiesta, sólo para `dueno` y `auditor`, dos botones: **"Ver como el cliente"** y **"Ver como un
  invitado"**.
  - "Ver como el cliente" abre `/portal-cliente/[id]` con una sesión de portal de esa fiesta marcada como sólo mirar.
  - "Ver como un invitado" abre la invitación y el enlace personal de un invitado de la lista.
- El navegador del auditor lleva su sesión de auditor, así que **cualquier guardado del portal o del invitado** (pagos,
  confirmaciones, fotos, pedidos de tragos) choca con el candado del bloque 2. Probalo con una prueba.

## Bloque 4 — Crearlo, cortarlo y volver a abrirlo para la próxima auditoría

- En `src/app/(app)/admin/usuarios/page.tsx`, sólo para `dueno`, una tarjeta **"Auditoría externa"**:
  - **"Abrir acceso de auditor"**: crea (o reactiva, si ya existe) un usuario en `users` con `perfil: 'auditor'`.
    Usá `createUser` (`src/app/actions/auth.ts` ~873) o una acción hermana con el mismo control de permiso. El correo
    lo pone el dueño. **La clave la genera la app** y se muestra **una sola vez**, con un botón de copiar. Cada vez que
    se abre, la clave es nueva.
  - **"Cerrar el acceso"**: marca `activo: false` y `cerradoEl`, y lo anota en una lista de accesos cortados. Para el
    perfil `auditor`, y sólo para ese, `verifySession` mira esa lista y lo deja afuera en el próximo clic.
    `loginUser` (`src/app/actions/auth.ts` ~295) no deja entrar a un auditor con `activo: false`.
  - **Queda guardado para la próxima vez:** la tarjeta muestra el historial (desde cuándo hasta cuándo estuvo abierto
    cada acceso, y con qué correo) y el botón "Abrir acceso de auditor" para una auditoría nueva.
- **No vence por tiempo**, por decisión del dueño. Para no olvidarlo prendido: si pasan **14 días** abierto, el asistente
  le avisa al dueño "El acceso de auditor sigue abierto desde el …: ¿lo cierro?". **No lo cierra solo.**
- La sesión del auditor dura lo normal (`maxAgeSeconds`, `session-token.ts` ~78), y al vencer vuelve a ingresar con su
  clave mientras el acceso esté abierto.
- Arriba de toda la app, para el auditor, una franja fija: *"Acceso de auditor · sólo mirar"*.

## Lo que el auditor NO ve, aunque vea todo lo demás

Contáselo al dueño en la entrega con estas palabras. Son las llaves de la oficina, no los papeles:

- **las claves de los servicios** (Meta, Mercado Pago, Google, Gemini): en Ajustes se muestran tapadas, como `••••`;
- **el respaldo completo para descargar** (`settings/backup`): es una copia de todo el negocio en un archivo. Mira
  todo, pero no se lleva una copia entera.

## Pruebas, que tienen que ponerse en rojo con el candado apagado

- `src/__tests__/el-auditor-mira-y-no-toca.test.ts`. Con sesión de `auditor`, cada una de estas tira el error del
  candado y no escribe nada:
  - `writeData`;
  - `mutateGenericJsonArray`;
  - un `set` con `dbAdmin`;
  - un `runTransaction`;
  - `uploadToStorage`;
  - el envío de WhatsApp;
  - `registrarConsumoIA`.

  Con sesión de `dueno` y **sin sesión** (tarea automática), las mismas funcionan.
- `src/__tests__/el-acceso-de-auditor-vence.test.ts`:
  - con el acceso cerrado no entra, y una sesión ya abierta queda afuera en el próximo clic;
  - abrirlo de nuevo da una clave nueva y la vieja no sirve;
  - el auditor no puede crear otro auditor, abrir ni cerrar accesos, ni cambiar perfiles;
  - a los 14 días abierto aparece el aviso al dueño, y el acceso sigue abierto.
- **(Sacada el 12/11/2026: en el entorno de pruebas no hay base, y sin base el auditor no entra, a propósito. Lo cubren las pruebas de Jest.)** `tests/e2e/el-auditor-recorre-la-app.spec.ts`:
  - con sesión de auditor abre contabilidad, presupuestos y una fiesta;
  - ve la franja;
  - al tocar "Guardar" en una pantalla, aparece el cartel de sólo mirar.

```comprobar
archivo: src/lib/auth/solo-lectura.ts
usa: exigirQueSePuedaGuardar en src/lib/data-service.ts
usa: exigirQueSePuedaGuardar en src/lib/generic-json-store.ts
usa: exigirQueSePuedaGuardar en src/lib/firebase/server.ts
usa: exigirQueSePuedaGuardar en src/lib/firebase/storage.ts
usa: exigirQueSePuedaGuardar en src/lib/whatsapp/meta-sender.ts
usa: exigirQueSePuedaGuardar en src/lib/ai/consumo-servidor.ts
usa: auditor en src/lib/auth/perfiles.ts
usa: cerradoEl en src/app/actions/auth.ts
prueba: src/__tests__/el-auditor-mira-y-no-toca.test.ts
prueba: src/__tests__/el-acceso-de-auditor-vence.test.ts
```
