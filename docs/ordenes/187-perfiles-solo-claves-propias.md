# 180 - Claude: validar solo los siete perfiles propios

ID estable: AK-CODEX-138-PERFIL-PROPIO. Usar este ID y el nombre COMPLETO
del archivo: existe otra180 sobre menu/galeria de Gemini, no es este arreglo.
Contraste140: Gemini `4d845b921d3b579515de7937fd7d209cbab71f3b`, rama
`feat/ordenes-178-179-impresos-ia38`, conserva perfiles.ts IDENTICO a7230.
NO CONTRASTADO CON LA CABEZA PRIVADA ACTUAL DE CLAUDE.
Fuente ejecutada7230f9d02b32805952a185f704a0208bd5d643e6. En PR1325
`5f704e68ffc65796d74bbe5d11046bf1c0413004` y PR1326
`a21d0b6987bb55757be217bdadf63f8ca67a6cb6`, `src/lib/auth/perfiles.ts` y su
consumidor `src/app/actions/auth.ts` no cambian. Reconfirmar al implementar.
No hay orden previa de este caso en YA-RESUELTO ni en ordenes consultadas.

## P2 - Validacion de perfil invalido y fallo interno

`esPerfilValido` usa `valor in PERMISOS_POR_PERFIL`, que incluye propiedades
heredadas de Object, no solo dueno/secretaria/operador/personal/cliente/
prospecto/invitado. La sonda138 ejecuta el archivo real, transpila TypeScript
a CommonJS y conserva SHA256 del archivo y SHA de app.

- `constructor`, `toString` y `__proto__` devuelven **true**, aunque no son perfiles.
- Con cada uno, `puede({role:'user', perfil}, ORGANIZACION)` lanza
  `TypeError: ...includes is not a function`, en vez de aplicar la politica
  existente para un perfil desconocido.
- Control `inventado`: false y conversion historica a secretaria, sin excepcion.

Tres entradas fallidas, **una sola causa**, no tres vulnerabilidades distintas.
La traza real del consumidor: `loginUser`, `listUsers`, `createUser` y
`updateUserModules` usan el mismo predicado para mapear/guardar el perfil.
El formulario normal no ofrece esos tres valores: no se afirma que haya una
cuenta afectada hoy, que un invitado pueda escribirlos ni que se hayan ganado
permisos. No se actualizo usuario alguno y no se probaron claves reales.

## Correccion acotada

Comprobar pertenencia **propia** a la lista/mapa, no heredada. Preservar:
los siete perfiles validos, la prioridad del perfil sobre role y la conversion
historica aprobada de cuentas sin perfil. No aprovechar para cambiar politica
de permisos o dar nuevas autorizaciones a un perfil desconocido.

Incluir los tres nombres heredados en `src/__tests__/perfiles.test.ts` y
contrastar el consumidor de autenticacion con datos ficticios. Esta ampliacion
de Jest esta PENDIENTE: Codex ejecuto la sonda pura138, no una sesion/login de
usuario corrupto ni la accion de modificar un usuario en base real.

Evidencia pura: `docs/evidencias/138-perfiles-heredados-results.json`,1controlPASS/
3entradasFAIL.

Confirmacion HTTP posterior: `138-perfiles-http-results.json`, misma compilacion
135 de7230, servidor aislado y cookie firmada de usuario FICTICIO `role=user`.
GET de un nombre sintetico de PDF que NO existe: control `inventado` llega a404,
los otros tres producen500, cuerpo0bytes. Es coherente con el TypeError del
ayudante en la ruta real `/api/budgets/[filename]`. No se creo archivo, cambio
una cuenta ni recupero documento real; no se afirma acceso indebido.
El login con un registro corrupto y la ampliacion Jest siguen pendientes.

No invalida las50fronteras HTTP ni11denegaciones de prospecto136: se trata de
entradas distintas a los siete perfiles validos, antes no ejecutadas.
Claude implementa/valida; Codex solo documenta. Una sola tanda con las otras
correcciones, no otra PR por este ayudante.

Correccion de mi verificador140: los tres controles originales daban3PASS
porque archivos/simbolo/prueba ya existian con el error aun presente. Se
agregan abajo condiciones que hoy FALLAN para impedir ese falso cierre.
Siguen siendo controles estructurales: incluso verdes NO sustituyen ejecutar
la regresion de138 y la ampliacion Jest contra el SHA corregido.

```comprobar
archivo: src/lib/auth/perfiles.ts
usa: esPerfilValido en src/app/actions/auth.ts
prueba: src/__tests__/perfiles.test.ts
no-usa: valor in PERMISOS_POR_PERFIL en src/lib/auth/perfiles.ts
usa: constructor en src/__tests__/perfiles.test.ts
usa: toString en src/__tests__/perfiles.test.ts
usa: __proto__ en src/__tests__/perfiles.test.ts
```
