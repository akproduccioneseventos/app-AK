# Orden 83 — Lo que atiende al invitado no llama a acciones del equipo (barrido, pregunta 24)

**Para Gemini. UNA SOLA PROPUESTA.** Si una parte se traba, entregá el resto en la misma
propuesta y decí cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md` y la
**pregunta 24** de `docs/COMO-AUDITAR.md`.

## De dónde sale

El 25 de septiembre de 2026 la barra (que atiende invitados) llamaba a
`invalidateInsumosCache` y a `getCartaTragosMaster`, dos acciones que empiezan con
`requireAppSession()`. Para el invitado, una tiraba error después de descontar botellas y la
otra fallaba en silencio (`.catch(() => defaultCartaTragosData.items)`) y mostraba la carta de
fábrica. **Claude ya arregló la barra**; esta orden busca la misma forma en el resto de la app.

## La búsqueda, mecánica

1. Listá las funciones exportadas de `src/app/actions/**/*.ts` cuya primera línea del cuerpo
   es `await requireAppSession()`, `requirePermiso(` o `verifySession()`.
2. Listá los archivos de `src/app/actions/` que atienden sin sesión: los que usan
   `hasPublicGuestAccess`, `findAuthorizedGuest`, `enforcePublicRateLimit` o
   `verifyEntertainmentAccessToken`.
3. Un **hallazgo** es: una función del punto 2, **en el camino sin sesión**, que llama a una del
   punto 1. Cuidado con los falsos: si la llamada está en otra función del mismo archivo que sí
   pide sesión, no cuenta. Tampoco cuenta si se pasa un permiso interno, como
   `getWhatsAppConfig(WHATSAPP_WEBHOOK_INTERNAL_TOKEN)` en `src/app/actions/feedback.ts`.

Candidatos que ya salieron de una primera pasada, **para confirmar o descartar uno por uno**:
`simulador-copilot.ts` → `getServiciosEmpresaPublicos`; `feedback.ts` → `getCompanyInfoPublica`.

## Cómo se arregla

**No se le saca la guardia a la acción del equipo.** Se hace una lectura interna en `src/lib/`,
sin `'use server'`, y el camino público la usa. Modelos: `src/lib/insumos/leer-insumos.ts` y
`src/lib/carta-tragos/leer-carta-master.ts`. La acción del equipo pasa a llamar a esa lectura
después de su guardia.

## Qué NO se toca

- Lo que toque **presupuestos, facturas, cobros, cupones, insumos, menús, sueldos o permisos**
  (por ejemplo `crm.ts` → `getPresupuestoById`, `commercial-intelligence.ts` →
  `getPresupuestos`): **no lo arregles**. Listalo en la descripción de la propuesta con el
  archivo y la línea, y se lo pasás a Claude.
- `src/app/actions/fiesta/barra-tecnologica.actions.ts`: ya está.

## Qué tiene que comprobar la prueba

Una prueba de Jest por hallazgo arreglado, que llame a la función pública **con la sesión del
equipo apagada** (el mock de `hasAppSession` devolviendo `false`) y compruebe **el resultado**:
que devuelve los datos cargados (no los de fábrica) o que la operación se guarda. **Se da por
buena cuando se pone en rojo con el código de antes.**

```comprobar
archivo: docs/COMO-AUDITAR.md
usa: Pregunta 24 en docs/COMO-AUDITAR.md
```
