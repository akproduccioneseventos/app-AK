# Lo que hay que hacer ahora

**Para:** Gemini (Antigravity)
**Escribe:** Claude (auditoría y verificación)
**Fecha:** 15 de agosto de 2026
**Base:** `main` actualizado. Sincronizar antes de empezar.

Ésta es la **única orden vigente**. Lo que está en `hechas/` ya se hizo.

**Todo va en UNA SOLA PROPUESTA.** Leé `LEEME.md` de esta carpeta para las reglas
y los controles.

---

# El trabajo: terminar los colores del tema

La escala visual ya está fijada y **no se cambia**: tarjetas `rounded-xl`,
botones y campos `rounded-lg`, y los colores salen del tema (`bg-primary`,
`text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted/40`,
`border-border`) en vez de estar escritos a mano (`bg-amber-400`,
`text-slate-800`).

Ya se hicieron: portal principal y sus variantes, confirmación de invitados,
muro social, invitación pública, portal del invitado, contrato, moodboard,
configuración de la fiesta, la bandeja del portal, y las pantallas de Ajustes
(promos, catálogo de servicios, feature flags, seguridad de la cuenta y cupones).

**Lo que queda es grande: 354 archivos y unas 7.200 apariciones.** No entra en
una tanda. Por eso esta orden pide **una parte concreta**, la que más se ve.

## Empezá por estas ocho, en este orden

Son las que ve el cliente o el invitado. Es lo que compite con las plataformas
pagas, así que es donde más rinde:

1. `src/app/simulador-de-presupuesto/page.tsx` — 350 apariciones
2. `src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx` — 203
3. `src/app/portal/c/[accessKey]/PublicPortalView.tsx` — 201
4. `src/app/portal-cliente/[id]/page.tsx` — 151
5. `src/app/evento/buzon/[fiestaId]/page.tsx` — 94
6. `src/app/presentacion-led/portafolio/portafolio-led-client.tsx` — 88
7. `src/app/portal-cliente/[id]/muro-social/page.tsx` — 83
8. `src/app/simulador-ak/page.tsx` — 81

**Si no llegás a las ocho, entregá las que hiciste** en la misma propuesta y
decime en cuál quedaste. Es preferible seis bien hechas que ocho a los tropezones.

## Cómo hacerlo

- **Pantalla por pantalla, nada de buscar y reemplazar masivo.** De golpe es
  imposible de revisar y ya rompió cosas antes.
- **Probá en claro y en oscuro** antes de dar una pantalla por lista.
- **Anotá hasta dónde llegaste**, para poder retomarlo la próxima.
- **No toques** los colores que elige el usuario (croquis, decoración, números de
  mesa, invitaciones) ni el fondo blanco de los documentos que se imprimen.
- Ojo con `src/__tests__/pantallas-de-la-noche.test.ts`: controla el texto del
  código de impresión, presentación y tótem. Si tocás esas tres, revisá la prueba
  y ajustala **en la misma propuesta**, no la borres.

---

## Lo que NO se toca nunca

- La validación del token de proveedor (`verifyAccesoPersonalToken`) en
  `fotografia` y `catering`. **Si hay conflicto ahí, quedate siempre con esa
  versión**: ya se reabrió el agujero una vez.
- Los tiempos de la fotocabina: 10 segundos la primera foto, 4 las demás.
- Los topes del contrato: 10% de reducción, 30% de aumento.
- Plata, cobros, comida y permisos: eso lo escribe Claude. Si te cruzás con algo
  de eso, avisá y seguí.

## Nada de cambios sueltos

**Pasó en las dos últimas entregas y hubo que sacarlos a mano antes de fusionar.**
La propuesta tiene que traer **sólo** lo que pide esta orden:

- **No commitees `public/firebase-messaging-sw.js`**: se genera solo al compilar.
- **No cambies imports ni librerías que no tengan que ver con los colores.** La
  última entrega cambiaba el `z` de `genkit` a `zod` en el asistente del
  simulador: compilaba igual, pero podía fallar recién al usarlo.
- Si de paso encontrás algo roto, **avisalo, no lo arregles acá**.

## Cuando termines

Avisá el número de la propuesta, anotá lo hecho en `docs/YA-RESUELTO.md` y
actualizá esta orden con las pantallas que quedaron pendientes, en la misma
propuesta.
