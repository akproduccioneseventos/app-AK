# Orden 247 — Administración: sesiones que se cortan, plata que no se pisa, carga histórica sin duplicar (27/10/2026)

**Para Gemini. PROPUESTA APARTE Y PRIMERO**, rama `gemini/orden-247-admin-sesiones-y-plata` desde `main` actualizada.
No va con las órdenes 242 a 246: es plata y permisos que ya están rotos en la app publicada (error 41 de
`CLAUDE.md`). Si un bloque se traba, entregá el resto y avisá cuál faltó.

Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`, en especial las preguntas de "dos a la vez" y de
"lista vieja". `src/__tests__/el-candado-de-la-plata.test.ts` tiene que seguir en verde.

Salió de una auditoría externa. Todo lo de abajo está **confirmado en `origin/main`**. Lo que se descartó no está.

## Bloque 1 — una pantalla vieja del dueño o la secretaria pisa la plata (lo más grave)

`saveFiesta` (`src/app/actions/fiesta/fiesta.actions.ts:298`) repone los campos de plata sólo para quien **no**
tiene permiso de plata (`sinPlata`, ~315).

- Para el dueño y la secretaria (`CONTABILIDAD`) escribe la fiesta entera que mandó la pantalla (~337-341), fuera de
  la transacción.
- Por eso, una pantalla abierta hace rato **borra una cuota cobrada después**. Pasa, por ejemplo, al mover una
  tarjeta en `/admin/ventas` (`src/app/admin/ventas/page.tsx:52`, `saveFiesta({...fiesta, estado})`) o al guardar
  cualquier pantalla de la fiesta.
- Es la misma forma de las auditorías 73 y 160.

**Qué hacer:**

1. Para **todos** los perfiles, el guardado va por `actualizarFiesta(id, (actual) => …)`, adentro de la transacción,
   como ya hace la rama `sinPlata`.
2. Para quien tiene plata, los campos de `CAMPOS_DE_PLATA_Y_CONTRATO` (~135-146) se escriben **sólo si la pantalla los
   cambió**. Si el valor que manda la pantalla es igual al que leyó, se toma el `actual`.
   - Para saber qué leyó, usá el mecanismo de `src/lib/marca-de-lectura.ts`, que ya se usa para las listas: la
     pantalla manda la marca de cuando leyó.
   - Si la fiesta cambió desde entonces y la pantalla tocó un campo de plata que también cambió, **se rechaza** con
     "Alguien cambió los pagos de esta fiesta mientras la tenías abierta. Recargá y volvé a intentar."
3. **`/admin/ventas`:**
   - El tablero ya no escribe "Seña" ni "Completado". Esas dos columnas se **leen** del estado real: la seña y
     "Contratada" salen del contrato en papel (`documentos.actions.ts:333`).
   - Sólo se pueden mover tarjetas entre "Lead", "Reunión" y "Cotizado", con `actualizarFiesta`, tocando **sólo**
     `estado`.
   - Hoy la pantalla dice "Movido" aunque el servidor haya repuesto el estado. Que muestre lo que quedó guardado.

**Prueba**, en `src/__tests__/una-pantalla-vieja-del-duenio-no-pisa-cuotas.test.ts`. Usá una base de mentira que
**devuelva copias**, nunca la misma lista. Tiene que comprobar:

- (a) El dueño lee la fiesta, otro cobra una cuota, y el dueño guarda un cambio de música: la cuota cobrada sigue.
- (b) Mover una tarjeta de "Cotizado" a "Reunión" no toca `planDePagos`.
- (c) No se puede mover a "Seña".

Rompé (a) volviendo al guardado entero y fijate que se ponga en rojo.

## Bloque 2 — la carga de históricos duplica facturas pagadas al reintentar

- `src/app/admin/carga-historicos/page.tsx:87-91` no manda `idIntento`. Por eso la idempotencia de
  `src/app/actions/historicos.ts:47-57` nunca se activa, y reintentar crea otro cliente, otro presupuesto y **otra
  factura pagada**.
  - La pantalla genera **un** `crypto.randomUUID()` por carga y lo manda en cada reintento de esa misma carga.
  - Se cambia cuando se carga otro contrato.
- Un fallo a mitad (~218) muestra un error genérico, y lo anterior ya quedó guardado. Hay dos opciones:
  - al reintentar con el mismo `idIntento`, se completa lo que falta sin repetir lo hecho: cada paso mira si su
    registro de ese `seed` ya existe;
  - o, si no se puede, el cartel dice qué quedó guardado y que **no** se vuelva a cargar.

  Lo primero es lo pedido.
- Validá en el servidor el tipo y el tamaño del archivo del contrato: PDF o imagen, 10 MB como máximo.

**Prueba**, en `src/__tests__/la-carga-historica-no-duplica.test.ts`. Tiene que comprobar:

- dos llamadas con el mismo `idIntento` dejan una sola factura;
- si falla en la factura y se reintenta, se completa sin duplicar el presupuesto.

## Bloque 3 — una sesión vieja sigue entrando 7 días

Los permisos viajan firmados en la cookie (`src/lib/auth/session-token.ts:10-21`), y `verifySession` (~160-174) no lee la
base. Un usuario borrado, con la clave cambiada o con el perfil bajado sigue entrando hasta 7 días con el perfil viejo.

1. **En cada usuario de `users`, un número `versionDeSesion`.** Va dentro de la cookie al entrar.
2. **Lo suben en 1:**
   - `deleteUser` (`src/app/actions/auth.ts` ~960);
   - `adminResetUserPassword`;
   - el cambio de clave propio;
   - `updateUserModules` (~935) o cualquier cambio de perfil.
3. **Dónde se compara:** en `requireSession` / `requirePermiso` (`src/lib/auth/require-session.ts`), que corren en el
   servidor. Ahí se compara con el de la base, con una memoria de 60 segundos para no leer en cada pedido.
   - Si no coincide, o el usuario no existe: "Tu sesión se cerró. Volvé a entrar."
   - Si la base no responde, **no se corta la sesión**: se usa lo de la cookie, como hoy. No se deja a nadie afuera
     por una caída.
4. **El token viejo de 4 partes** (`session-token.ts:89-102`), que devuelve admin sin perfil: **se borra**. Ya nadie
   lo emite.
5. **La clave maestra** (`auth.ts:295-366`) sigue funcionando para el dueño, porque es decisión suya. Cada vez que se
   usa:
   - queda anotada con fecha y origen;
   - le llega al dueño un aviso genérico: "Se entró con la clave maestra." Sin la clave ni datos.

**Prueba**, en `src/__tests__/una-sesion-vieja-se-corta.test.ts`. Tiene que comprobar:

- borrar un usuario y usar su cookie se rechaza;
- bajar a "personal" a una secretaria le saca CONTABILIDAD en el pedido siguiente, pasada la memoria;
- con la base caída, la sesión sigue;
- un token de 4 partes ya no entra.

## Bloque 4 — usuarios: el último dueño y las casillas que no hacen nada

- **`deleteUser` y el cambio de perfil** no dejan borrar ni bajar al **último** usuario con perfil `dueno`, ni que
  alguien se borre a sí mismo. El mensaje es "Tiene que quedar al menos un dueño."
- **Las casillas de "módulos permitidos"** (`src/app/admin/usuarios/page.tsx:527-536`) no las lee ningún control: lo
  que decide es el perfil (`puede`). Un control que no cambia nada engaña. **Se sacan de la pantalla.** En su lugar
  va una línea: "Lo que ve cada persona depende de su perfil", con la lista de lo que incluye el perfil elegido,
  sacada de `src/lib/auth/perfiles.ts`. El campo `modules` puede quedar guardado: no lo borres de la base.

## Bloque 5 — finanzas no mezcla lo cobrado con lo esperado

`src/app/admin/finanzas/page.tsx:39-50` (`calcularIngresos`): sin cobros, usa el plan o el presupuesto y lo suma a
"Ingresos Totales" (~111) y a "Ganancia Neta" (~129).

Se separa en cuatro tarjetas:

- **Cobrado**: sólo pagos registrados.
- **Por cobrar**: el plan o el presupuesto, menos lo cobrado.
- **Ganancia sobre lo cobrado.**
- **Ganancia esperada**: con la línea "si se cobra todo lo pactado".

Sin cobros, "Cobrado" es $0, y eso **sí** es correcto: no hubo cobros.

## Pruebas finales

Corré solas las cuatro de Jest. Después corré `npx tsc --noEmit`, `npx jest --silent` completo y
`npm run "publicar?:rapido"`, y pegá las últimas líneas de cada uno.

```comprobar
usa: actualizarFiesta en src/app/admin/ventas/page.tsx
usa: marca en src/app/actions/fiesta/fiesta.actions.ts
usa: idIntento en src/app/admin/carga-historicos/page.tsx
usa: versionDeSesion en src/lib/auth/require-session.ts
usa: versionDeSesion en src/app/actions/auth.ts
usa: Tiene que quedar al menos un dueño en src/app/actions/auth.ts
usa: Por cobrar en src/app/admin/finanzas/page.tsx
prueba: src/__tests__/una-pantalla-vieja-del-duenio-no-pisa-cuotas.test.ts
prueba: src/__tests__/la-carga-historica-no-duplica.test.ts
prueba: src/__tests__/una-sesion-vieja-se-corta.test.ts
```
