# Orden 222 — Devolución de la propuesta 1353 (cuarta vuelta, 24/10/2026)

**Para Gemini. Una sola propuesta: seguí en la misma 1353**, rama `gemini/ordenes-180-195`. Primero traé
y fusioná `claude/app-debug-stabilize-m70e6z`. Si un bloque se traba, entregá el resto en la misma
propuesta y avisá cuál faltó. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

**Antes de subir, corré `npx tsc --noEmit` y `npm run "publicar?:rapido"`, y pegá en la propuesta las
dos últimas líneas de cada uno.** Esta entrega dijo "tipos en cero" y no compila.

## Qué está bien y no se toca

Lo de la orden 221 quedó hecho: los guardados en transacción, la voz del cliente sin token inventado, la
seña y el saldo fuera del alcance del personal, y la prueba de la voz.

## Bloque 1 — no compila (5 errores)

- `src/app/api/cron/asistente-proactivo/route.ts` ~253: hay un `} catch (err: any) { ... }` repetido después
  del `try` de los avisos. Sacá el segundo.
- `src/app/actions/dashboard.ts` ~154 y ~158: `f.fecha` no existe en `FiestaEnPlanificacion`. Usá sólo
  `f.configuracion?.fechaEvento`, como estaba.
- `src/lib/asistente/avisar-al-duenio.ts` ~94: `mutarDocumento` puede devolver `null` y la función promete
  `AsistenteSettings`. Si vuelve `null`, devolvé `{ ...ASISTENTE_SETTINGS_DEFAULT, ...settings }`.
- `src/lib/asistente/por-whatsapp.ts` ~144: ver bloque 2.

## Bloque 2 — plata: el bot de WhatsApp armaría un presupuesto sin precios

`atenderProspectoAnuncioWhatsApp` llama a `generateBudgetAndLeadFromSimulator` con nombre, contacto, fecha e
`invitados`. Esa función (`src/app/actions/armado-rapido.ts`, tipo `LeadFromQuickBudget` en
`src/types/armado-rapido.ts` ~63) necesita `adultos`, `ninos`, `subtotal`, `costoEstimado` y
`serviciosIncluidos`: con lo que le pasás, armaría un presupuesto de $0. Además, cada mensaje con los tres
datos crearía otro prospecto.

- **Sacá la llamada y el import** de `generateBudgetAndLeadFromSimulator` en `por-whatsapp.ts`.
- Lo que ya hace queda igual: el enlace al simulador con fecha, invitados y salón cargados. Cuando el
  prospecto lo abre y lo completa, el simulador arma el presupuesto con los precios de verdad. Eso cumple
  la orden 202 sin inventar importes.
- En la orden 221 sacá la línea `usa: generateBudgetAndLeadFromSimulator( ...` que agregaste al final:
  ahora la orden 202 pide lo contrario.
- La prueba `src/__tests__/whatsapp-presupuesto-anuncio.test.ts` tiene que comprobar que con los tres datos
  la respuesta trae el enlace al simulador con esos datos, y que **no** se llama a
  `generateBudgetAndLeadFromSimulator`.

## Bloque 3 — "Las formas que mienten" (5 lugares)

La puerta frena en estos cinco lugares:

- **Errores tragados.** Si ignorar la falla está bien, escribí el motivo en un comentario que empiece con
  `no pasa nada si falla:`. Si no está bien, contá la falla.
  - `src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx` ~127. Al cargar los
    interruptores, quedan los de por defecto.
  - `src/app/api/asistente/voz-en-vivo/accion/route.ts` ~50. Es el registro del rechazo; la acción
    igual se rechaza.
  - `src/app/api/asistente/voz-en-vivo/cliente/route.ts` ~150, `registrarConsumoIA`.
- **Comparación con `as any`.**
  - `src/app/api/asistente/voz-en-vivo/cliente/route.ts` ~68. Tipá `ajustes` como
    `Partial<AsistenteSettings>` y agregá `vozEnVivoClienteMinutosPorDia?: number` al tipo en
    `avisar-al-duenio.ts`. Sacá los `as any`.
  - `src/app/actions/playbooks.ts` ~129. Sacá el `(a as any)`: `operacionId` ya está en el tipo. Además,
    **guardalo**: en la aplicación que se registra (~214) agregá `...(operacionId ? { operacionId } : {})`.
    Hoy nunca se guarda, así que un reintento vuelve a crear las tareas.

## Bloque 4 — la prueba de la realidad aumentada no prueba nada

`tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts` mira que haya "algún div": da verde con la pantalla
vacía, y la puerta la frena. En el entorno de pruebas no hay cámara ni archivo `.mind`, así que la prueba
abre `/evento/ar/fiesta-sin-realidad-aumentada` y comprueba:

- que aparece el texto `Esta invitación todavía no tiene realidad aumentada`;
- que `Cargando Realidad Aumentada...` ya no está.

La línea de `comprobar` de la orden 196 que cambiaste a `archivo: src/lib/vendor/mind-ar/...` queda: la
biblioteca está entera en esa carpeta.

## Cómo se entrega

`npx tsc --noEmit` en cero, todo `npx jest` en verde, `npm run "publicar?:rapido"` en verde, y en
`npm run "ordenes?"` la 196, la 202, la 220, la 221 y la 222 como HECHA.

```comprobar
no-usa: f.fecha en src/app/actions/dashboard.ts
no-usa: generateBudgetAndLeadFromSimulator en src/lib/asistente/por-whatsapp.ts
no-usa: (ajustes as any) en src/app/api/asistente/voz-en-vivo/cliente/route.ts
no-usa: (a as any).operacionId en src/app/actions/playbooks.ts
usa: ...(operacionId ? { operacionId } : {}) en src/app/actions/playbooks.ts
usa: Esta invitación todavía no tiene realidad aumentada en tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts
prueba: src/__tests__/whatsapp-presupuesto-anuncio.test.ts
prueba: tests/e2e/la-realidad-aumentada-carga-mindar.spec.ts
```
