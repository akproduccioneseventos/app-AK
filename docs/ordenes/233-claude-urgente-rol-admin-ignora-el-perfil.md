# Orden 233 — URGENTE, permisos: once controles miran el rol viejo y no el perfil (26/10/2026)

**Para Gemini. Propuesta CHICA y aparte**, contra `claude/app-debug-stabilize-m70e6z`, en una rama nueva
`gemini/orden-233-rol-admin`. No va dentro de la 1353: es permisos en la app publicada, y se publica primero
(error 41 de CLAUDE.md). Leé `docs/ANTES-DE-ENTREGAR.md` (pregunta 69) antes de decir "terminé".

## Qué pasa

Codex encontró (orden 230) que `requireAdminSession` dejaba pasar una cuenta con rol viejo `admin` aunque su perfil
fuera otro. Si al dueño le cambia el perfil a una cuenta "admin" para que sea secretaria u operador, esa persona
igual entraba a lo del dueño. La 1353 lo arregla en `requireAdminSession` y `requirePermiso`. Pero la misma forma,
`session.user?.role === 'admin'`, sigue en otros once lugares que deciden permisos.

## Qué cambiar

En cada lugar, **reemplazá el control por `requireAdminSession()`** de `src/lib/auth/require-session.ts`, o por
`puede(usuario, PERMISOS.ADMINISTRACION)` si no hay sesión a mano. Así la respuesta para quien no puede queda
igual que hoy.

- `src/app/actions/ai-consumo.ts` ~26 y ~36.
- `src/app/actions/blog-ai.ts` ~20.
- `src/app/actions/marketing-automation.ts` ~14, ~24 y ~37.
- `src/app/api/marketing/automation/route.ts` ~9.
- `src/app/api/admin/clean-db/route.ts` ~26. **Es el borrado de la base: va primero.**
- `src/app/actions/auth.ts` ~741: `auth.user?.role !== 'admin'` → `!puede(auth.user, PERMISOS.ADMINISTRACION)`.
- `src/app/actions/fiesta/carga-operativa.actions.ts` ~77: sacá `|| ses.user.role === 'admin'` y dejá sólo
  `puede(..., PERMISOS.ORGANIZACION)`.
- `src/lib/agentes/motor-agentes.ts` ~537 (`puedeVerConta`) y ~598 (`esDuenio`): sacá las comparaciones con
  `role`, dejá sólo `puede(...)`.

Traé también, tal cual, `requireAdminSession` y `requirePermiso` de `src/lib/auth/require-session.ts` de la rama
`codex/653-correcciones-20261025`: son el arreglo de la orden 230 y todavía no están publicados.

## Qué NO tocar

- `src/app/actions/auth.ts` ~455-486: es el ingreso con la clave maestra. Queda igual.
- `src/app/(app)/admin/usuarios/page.tsx`: lo que dice la pantalla de usuarios no decide permisos.
- `perfilDesdeRolViejo` en `src/lib/auth/perfiles.ts`: las cuentas viejas sin perfil siguen pasando a dueño.

## La prueba

`src/__tests__/el-rol-admin-no-pasa-por-encima-del-perfil.test.ts`. Para cada acción del listado, con la sesión
`{ role: 'admin', perfil: 'secretaria' }`, la acción tiene que rechazar. Con `{ role: 'admin' }`, sin perfil, y con
`{ perfil: 'dueno' }`, tiene que dejar pasar.

Además, una búsqueda que frena: ningún archivo de `src/app` ni `src/lib`, salvo `auth.ts` y `perfiles.ts`, puede
tener `role === 'admin'` ni `role !== 'admin'`. Comprobá que se pone en rojo si volvés a poner uno.

```comprobar
no-usa: role !== 'admin' en src/app/actions/ai-consumo.ts
no-usa: role !== 'admin' en src/app/actions/blog-ai.ts
no-usa: role !== 'admin' en src/app/actions/marketing-automation.ts
no-usa: role !== 'admin' en src/app/api/marketing/automation/route.ts
no-usa: role === 'admin' en src/app/api/admin/clean-db/route.ts
no-usa: role === 'admin' en src/app/actions/fiesta/carga-operativa.actions.ts
no-usa: usuario.role === 'admin' en src/lib/agentes/motor-agentes.ts
prueba: src/__tests__/el-rol-admin-no-pasa-por-encima-del-perfil.test.ts
```
