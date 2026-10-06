# 118 - Cerrar la frontera general de fiestas

**HECHA por Claude el 6/10/2026.** Ver `docs/YA-RESUELTO.md` del 6/10.


## Destino y contraste

Responsable: Claude (permisos y datos sensibles). Codex solo aporta evidencia;
el propietario conserva la fusion. No modificar funcionalidades comerciales.

Base comprobada: `main` / `feb90f4d40906029d6d31ba2e2abbed64461a2ad`, PR 1256 ya
fusionada. GitHub no muestra otra PR abierta al consultar el 5/10/2026.
Clasificacion: reproducido tambien en la ultima entrega fusionada, no un defecto
antiguo de la auditoria 66. Si existe trabajo local aun no publicado de otra IA:
**NO CONTRASTADO CON LA TANDA**; contrastar antes de programar y no duplicar.

## P1 - Una sesion de personal abre la fiesta completa y permite escribirla

Archivo real: `src/app/actions/fiesta/fiesta.actions.ts`.

- `getFiestas` y `getHistorialFiestas` solo piden `requireAppSession`.
- `getFiestaById` devuelve datos sin recortar a cualquier `verifySession().success`.
- `requireFiestaWriteAccess` acepta cualquier `hasAppSession`; `saveFiesta` usa esa
  puerta y `updateFiestaPartial` tambien acepta una sesion sin comprobar perfil.

La sonda carga las acciones, `require-session.ts` y `perfiles.ts` reales. Solo
sustituye sesiones y persistencia con datos sinteticos. El perfil es `personal`,
sin permiso `organizacion`, sin asignacion a esa fiesta y sin sesion del portal.
Resultado: lee lista, historial, clave del portal y token del invitado; acepta un
guardado completo y otro parcial de `gestionCostos`. Las dos escrituras llegan
al doble de persistencia. No se escribio una fiesta real ni se probo explotacion
HTTP contra produccion.

Consumidor real de lectura: `getFiestaById` en
`src/app/(app)/fiestas/nueva/configuracion/page.tsx`, importado desde la fachada
`src/app/actions/fiesta-actual.ts`. Ocultar el boton o proteger esa pagina no
sustituye el control dentro de la accion del servidor.

## P1 - Las puertas publicas devuelven tambien secretos

`getFiestaActual` y `getFiestaBySlug` devuelven la fiesta cruda sin sesion. La misma
sonda obtiene `clientPortalSettings.accessKey` y `invitados[].guestAccessToken`
en las dos. Son campos reales del tipo `FiestaEnPlanificacion`, no nombres
inventados. La fachada exporta `getFiestaActual`; lo consume
`src/components/social-media/NewPostDialog.tsx`. `getFiestaBySlug` se usa en
`src/app/i/[slug]/page.tsx` para la invitacion. No se demostro que esa pagina
renderice los secretos: el defecto comprobado es el contrato de retorno de la
accion, y debe verificarse tambien su exposicion por Server Actions.

Conservar invitaciones y mesas publicas; darles una proyeccion minima sin claves,
tokens, contactos privados, cobros ni costos. No imponer inicio de sesion a los
invitados ni alterar los permisos del negocio sin acuerdo del propietario.

## Correccion y aceptacion

1. Aplicar perfil, asignacion y alcance de evento a las puertas generales, usando
   los controles existentes. No bloquear llamadas internas legitimas: separarlas
   de las acciones invocables desde cliente y respetar los portales autorizados.
2. Revisar tambien que una sesion de portal no permita enviar campos financieros
   arbitrarios a `saveFiesta`; esto es una prueba pendiente, no un tercer defecto
   ya reproducido.
3. Regresion: personal ajeno no lee secretos ni escribe; personal asignado recibe
   solo su proyeccion; propietario/secretaria conservan su acceso; invitacion y
   mesas funcionan sin secretos; cliente solo modifica campos habilitados de su
   evento. Probar acciones del servidor, no solo botones visibles.
4. Claude registra SHA, comandos y resultados. Codex vuelve a revisar solo esta
   frontera. No darla por corregida porque el archivo exista.

Reproduccion: `node docs/evidencias/69-sonda-puertas-generales-fiesta.cjs`.
La sonda demuestra el comportamiento defectuoso: su salida exitosa NO equivale
a una prueba de seguridad aprobada. La nueva regresion de abajo es propuesta y
queda PENDIENTE de crear y ejecutar. Reutilizar las pruebas existentes que cubran
el mismo caso antes de agregar otra.

```comprobar
archivo: src/app/actions/fiesta/fiesta.actions.ts
usa: getFiestaById en src/app/(app)/fiestas/nueva/configuracion/page.tsx
prueba: src/__tests__/frontera-general-de-fiestas.test.ts
```
