# 230 - Claude: respetar el perfil explicito en las acciones administrativas

NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.

## Destino y contraste

Fuente reproducida: `978af7d65a60bd287f3ee3cc05037a29566074f4`, PR1353,
no main. Los tres consumidores indicados abajo son identicos entre main
`3e45a4ac6b479f89605163168e31b37dc84f2d0f` y esa entrega publica.
La fuente final f8f7cf34e8778de784b20e2654058fd722b2a2ec conserva identicos
los cuerpos pertinentes de autenticacion, guardia y consumidor; su delta
contra978 solo cambia CUATRO fuentes de medios. No es un nuevo defecto.
Antes de programar, contrastar el HEAD de trabajo de Claude. Codex no cambia
la app ni fusiona. Una sola correccion de autorizacion, no seis bugs nuevos.

## Defecto P1 reproducido

`requireAdminSession` en `src/lib/auth/require-session.ts` solo exige el rol
antiguo `admin`; ignora el perfil explicito que la politica real prioriza.
Un usuario con `role:admin, perfil:operador` pasa esa guardia aunque
`puede(user, PERMISOS.ADMINISTRACION)` devuelve falso.

No es solamente una combinacion inventada por una firma de prueba:
`createUser` y `updateUserModules` en `src/app/actions/auth.ts` guardan los
dos campos independientes. `loginUser` conserva `data.role` y `data.perfil`
en `writeSessionCookie`. Se puede mantener un rol viejo y restringir el perfil.

Prueba499: emisor/verificador HMAC y politica reales; siete perfiles con rol
antiguo admin, mas anonimo/firma alterada. Resultado3PASS/6FAIL.
Prueba506: cuerpo ORIGINAL de `resetAllFiestasHistoricas`, misma guardia y
sesion firmada reales. SOLO transporte cookie y base son dobles. Operador,
personal, secretaria, cliente, prospecto e invitado llegan a `batch.delete`
y `batch.commit`, devolviendo `success:true,deletedCount:1`. Dueño y anonimo
son controles correctos. Resultado2PASS/6FAIL. No se borro ningun dato real,
no es una prueba HTTP del boton ni una mutacion de Firestore de produccion.

## Correccion solicitada y limites

- La guardia administrativa debe aplicar la misma politica del perfil
  efectivo que `requirePermiso(ADMINISTRACION)`, sin elevar un perfil explicito
  por conservar `role:admin`. Claude decide la implementacion de seguridad.
- Preservar compatibilidad autorizada de cuentas antiguas SIN perfil: no
  bloquear al dueño legitimo. Cubrir tambien los roles internos reconocidos
  por `perfilDesdeRolViejo`, sin abrir accesos a terceros.
- Revisar consumidores reales de `requireAdminSession`: historial, reinicio,
  clientes, fiestas, notificaciones, marketing y tareas automaticas. No basta
  con ocultar botones, ni ampliar permisos para hacer pasar pruebas.
- No alterar datos, importes, telefonos ni firmas existentes para la prueba.

## Aceptacion propuesta (PENDIENTE de correccion y ejecucion)

1. Perfil restringido con antiguo rol admin no consulta ni muta la base al
   llamar una accion administrativa; rechazo visible, sin success falso.
2. Dueño explicito y dueño antiguo permitido conservan la accion legitima.
3. Anonimo, firma alterada y vencida no llegan al consumidor.
4. Dos sesiones de perfiles distintos no heredan autorizacion entre llamadas.
5. Mantener verdes las50fronteras HTTP513, independientes de esta guardia.

Evidencia: `docs/evidencias/499-perfiles-guardia.json`,
`docs/evidencias/506-consumidor-admin.json` y sus sondas reproducibles.
Las pruebas de regresion de producto siguientes son PROPUESTAS; no se afirma
que ya existan ni que Claude haya leido o iniciado esta orden.

```comprobar
archivo: src/lib/auth/require-session.ts
usa: requireAdminSession en src/app/actions/fiestas-historicas.ts
prueba: src/__tests__/admin-session-respeta-perfil-explicito.test.ts
```
