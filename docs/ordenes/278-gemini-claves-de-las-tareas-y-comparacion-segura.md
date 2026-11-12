# Orden 278 — Las tareas automáticas con clave, y las claves comparadas de forma segura (11/11/2026)

**Para Gemini, en la computadora del dueño** (ahí está la consola de Firebase con su sesión). Sobre
`claude/app-debug-stabilize-m70e6z` actualizada (`git pull`), rama nueva `gemini/orden-278-claves-de-las-tareas`.
**Una sola entrega con los dos bloques, sin fusionar.** Repasá `docs/ANTES-DE-ENTREGAR.md`.

Sale de una revisión de seguridad externa del 11/11/2026. **Next.js ya lo actualizó Claude a 15.5.29**: no lo toques.
No toques tampoco la cabecera de seguridad (CSP en modo informe: es a propósito) ni `next.config.js`.

## Bloque 1 — Que las tareas automáticas pidan clave (y que el despertador la mande)

> **PENDIENTE (12/11/2026).** En la 1385 venía programado, pero nadie confirmó que los dos secretos existan en Firebase.
> Claude lo sacó de la publicación para no frenar la web ni las tareas: falta la línea de `apphosting.yaml`, el
> `secrets: ['CRON_SECRET']` del despertador, el 503 del despachador y la prueba `el-despertador-lleva-la-clave`.
> **Se rehace sólo después de crear los dos secretos**, en el orden de abajo.

**Hoy:** `src/lib/automatico/puerta-de-las-tareas.ts` (~108-133) deja correr sin clave las tareas de
`TAREAS_QUE_NO_HACEN_DANO` (~62) cuando no hay `CRON_SECRET`. `apphosting.yaml` **no define `CRON_SECRET`**, así que en
la app publicada cualquiera que sepa la dirección puede disparar `generate-blog-post` o `asistente-proactivo`, que
gastan de Gemini. Están limitadas, pero no deberían depender de eso.

**Qué se hace, y el orden importa** (si la app pide la clave antes de que el despertador la tenga, **todas las tareas
automáticas se paran**):

1. Generá una clave larga al azar y guardala en Secret Manager **dos veces con el mismo valor**:
   - para la app: `firebase apphosting:secrets:set cron-secret` (y dale acceso al backend cuando lo pregunte);
   - para las funciones: `firebase functions:secrets:set CRON_SECRET`.
   **No la escribas en ningún archivo del repositorio ni en el chat.**
2. `functions/src/index.ts` (~58): `despertadorTareasAutomaticas` pasa a `functions.runWith({ timeoutSeconds: 120,
   memory: '256MB', secrets: ['CRON_SECRET'] })`. Ya manda `Authorization: Bearer` si la tiene (~75). Desplegá las
   funciones (`firebase deploy --only functions:despertadorTareasAutomaticas`).
3. **Recién después**, en `apphosting.yaml`, junto a `AK_SESSION_SECRET` (~76):
   ```yaml
   - variable: CRON_SECRET
     secret: cron-secret
     availability:
       - RUNTIME
   ```
4. Buscá en `docs/` y en el código si hay **otro** servicio de afuera que llame a las tareas (`/api/cron`, `/api/despertar`,
   `?clave=`). Si lo hay, anotá en la entrega cuál es: el dueño tiene que pegarle la clave ahí, o se para.

No cambies `TAREAS_QUE_NO_HACEN_DANO` ni el freno por intentos: con la clave puesta ya no se usan.

**Ojo, lo encontró el barrido de Claude:** `src/app/api/cron-despachador/route.ts:26` hace `if (!cronSecret) return true`
y **no pasa por la puerta**: hoy cualquiera desde internet dispara la tanda entera, incluidos los recordatorios a los
invitados y los avisos al cliente. Es la ruta que llama el despertador (`functions/src/index.ts` ~68). Con el paso 3
hecho queda cerrada; además cambiá esa línea para que **sin clave en producción devuelva 503** (fuera de producción
puede seguir abierta, como la puerta).

## Bloque 2 — Las claves se comparan de forma segura, y la de borrar la base no va en la dirección

**Hoy** se compara con `===` en cinco lugares:

- `src/lib/automatico/puerta-de-las-tareas.ts:114`
- `src/app/api/despertar/route.ts:33`
- `src/app/api/admin/clean-db/route.ts:22` (que además acepta la clave en la dirección, `?secret=`)
- `src/app/api/v1/marketing/insights/route.ts:16`
- `src/app/api/meta/webhook/route.ts:47`
- `src/app/api/cron-despachador/route.ts:32`
- `src/app/api/whatsapp/webhook/route.ts:41`
- `src/app/actions/auth.ts:326` y `src/app/actions/simple-auth.ts:425` (la clave maestra `APP_PASSWORD`)

**Qué se hace:**

- Una función nueva `clavesIguales(a, b)` en `src/lib/security/claves-iguales.ts`: si falta alguna, `false`; si no,
  calcula el SHA-256 de las dos y las compara con `crypto.timingSafeEqual` (como ya hace
  `src/lib/whatsapp/webhook-security.ts` ~11). Usala en los cinco lugares.
- En `clean-db`, la clave de mantenimiento **sólo por cabecera** (`Authorization: Bearer`); sacá la de la dirección.
  La sesión de administrador sigue como está.
- `src/lib/google-workspace.ts:71`: si faltan `AK_SESSION_SECRET` y `SESSION_SECRET` firma con una constante escrita en
  el código. Que en producción tire error, igual que `src/lib/auth/session-token.ts` ~56.
- Las tareas siguen aceptando `?clave=` (hay servicios que sólo dejan pegar una dirección): no lo saques.

## Pruebas

- `src/__tests__/las-claves-se-comparan-seguro.test.ts`: `clavesIguales` da verdadero con dos iguales, falso con una
  distinta, con una vacía y con largos distintos; y en los archivos del bloque 2 no queda ninguna comparación con `===` contra
  la clave (leé los archivos y buscá el patrón). `clean-db` con la clave correcta en `?secret=` y sin sesión **no
  autoriza**.
- `src/__tests__/el-despertador-lleva-la-clave.test.ts`: `functions/src/index.ts` declara `secrets: ['CRON_SECRET']` en
  el despertador, y `apphosting.yaml` define `CRON_SECRET` como `secret:` (nunca como `value:`).

```comprobar
archivo: src/lib/security/claves-iguales.ts
usa: clavesIguales en src/lib/automatico/puerta-de-las-tareas.ts
usa: clavesIguales en src/app/api/despertar/route.ts
usa: clavesIguales en src/app/api/admin/clean-db/route.ts
usa: clavesIguales en src/app/api/v1/marketing/insights/route.ts
usa: clavesIguales en src/app/api/meta/webhook/route.ts
usa: CRON_SECRET en apphosting.yaml
usa: secrets: ['CRON_SECRET'] en functions/src/index.ts
usa: clavesIguales en src/app/api/cron-despachador/route.ts
usa: clavesIguales en src/app/api/whatsapp/webhook/route.ts
usa: clavesIguales en src/app/actions/auth.ts
usa: clavesIguales en src/app/actions/simple-auth.ts
no-usa: ak-google-state-secret-2026 en src/lib/google-workspace.ts
no-usa: if (!cronSecret) return true; en src/app/api/cron-despachador/route.ts
prueba: src/__tests__/las-claves-se-comparan-seguro.test.ts
prueba: src/__tests__/el-despertador-lleva-la-clave.test.ts
```
