# Orden 336 — Auditoría profunda de Gemini, 2da vuelta (23/11/2026): 99 hallazgos

**Para Gemini. Una sola propuesta, rama nueva `gemini/orden-336` desde la principal recién actualizada.** El informe completo,
con archivo y línea de cada hallazgo, está en `docs/auditorias/2026-11-23-gemini-2da-vuelta.md`: **es la lista de trabajo**.
Si un bloque se traba, entregá el resto en la misma propuesta y decí cuál faltó. Antes de decir "terminé", leé
`docs/ANTES-DE-ENTREGAR.md`. Corré **después** de la orden 335 (las dos tocan `TabHostShell` y el planificador: el bloque 3 de
acá se hace sobre lo que dejó la 335, no se rehace).

**Regla de esta orden:** cada hallazgo se **confirma abriendo el archivo** antes de arreglarlo (el informe salió de ayudantes
económicos). Lo que resulte falso se anota en el informe con el motivo, no se "arregla". Cada arreglo lleva su prueba que
**reproduce el caso del informe** y se pone en rojo sin el arreglo.

**Confirmados por Claude (no hace falta volver a mirarlos):** `getEntretenimientoFiesta` devuelve la fiesta entera con sólo
sesión (`src/app/actions/fiesta/entretenimiento.actions.ts` ~61-75); la transmisión en vivo no autentica a la pantalla ni al
invitado (`src/app/actions/social-live-stream.ts` ~136-282); `deleteInvoiceInner` cae al borrado sin transacción tras 1,5 s
(`src/app/actions/invoices.ts` ~635-660).

**Plata, cobros y permisos los revisa Claude línea por línea.** Nombrá en la propuesta cada acción de esos bloques. El candado
`el-candado-de-la-plata` y `lo-que-guarda-se-prueba-contra-la-base` tienen que seguir en verde.

## Bloque 1 — Seguridad y pérdida de datos (sección A y B del informe, críticos)
`readData`/`decidirGuardado` (una lectura caída no puede marcar para borrar el resto de la lista), `deleteInvoiceInner` (sin
caída a borrado sin transacción), `saveFiesta` (guardar sólo lo que cambió la pantalla, dentro de la transacción),
`getEntretenimientoFiesta` (recortar por perfil y pertenencia), transmisión en vivo (token de invitado y de pantalla),
`saveSocialPost` (id saneado), `deleteAllVideoVidaPhotos`/`deleteBuzonMessage`/`updateListaDeCargaOperativa` y las 4 descargas
ZIP (permiso y pertenencia a la fiesta), auditor bloqueado en firma digital, redes y claves, y `modulosContratados`,
`configuracion` y `clientPortalSettings` fuera del alcance del portal del cliente. Medios de la sección B incluidos.

## Bloque 2 — Plata y tope de IA (sección C y G)
Ajuste anual al cambiar la fecha (`changeEventDate`) y descuento que no se aplica a multas; presupuesto `Facturado` que no se
edita sin su factura; cupones (`montoMinimo` revalidado en el servidor y `montoPresupuesto` con el monto, no el porcentaje);
platos por defecto del paso 3 que suman al total; tope y registro de IA en `applyFaceSwap`, `runMultiAgent` y los demás flujos
del informe; `unoSoloPorNombre` en `generate_contract`; montos de presupuestos fuera del alcance del `operador`.

## Bloque 3 — Lo que se rompió en las entregas 331-334 (sección D y E)
`useAutoSave` que pierde lo pendiente al cambiar de solapa (guardar antes de desmontar), Hoja de Cocina con `menuData.items`,
Lista de Compras (sin ingredientes y `invitadosAdultos: 0`), recibos con `rolId`, enlace de utileros, las 5 pestañas del
portal tras `/entrar` (mirar la sesión del servidor, no `sessionStorage`), cliente con varias fiestas, `/portal?fiestaId=`,
`/entrar` con sesión vencida, teléfono `+598`, y los enlaces de invitado con `withGuestAccess`.

## Bloque 4 — La noche de la fiesta (sección F)
Puerta única `/evento/inicio` sin sesión de equipo, cámara de la Barra al grabar, buzón sin señal (mismos campos que lee el
servidor), consentimiento del Espejo que se reinicia por invitado, impresión que espera la imagen y marca después, y las fugas
de memoria (`AudioContext`, `URL.createObjectURL`, IndexedDB).

## Bloque 5 — Redes, despertadores y AK Editor (sección H)
Borradores sin imagen fuera de la cola, horario de 21 a 23 hs, webhook de Meta y de WhatsApp (sin perder el prospecto por la
espera), recordatorios sin fiestas suspendidas/archivadas/de muestra, `perseguidor_presupuestos` sin duplicados, `sitemap` sin
borradores, y en el AK Editor el login de Wfolio y la subida.

## Barrido en toda la app

**Escaneo automático de Claude (23/11), además del informe:** la forma de la pregunta 211 aparece también en
`src/app/actions/games.actions.ts` (~129, ~141, ~147 y ~159), y la de la 214 también en `src/components/panels/portal--mensajes.tsx` (~42)
y `src/components/panels/portal--tu-web.tsx` (~38).
Los arreglás en el mismo bloque. `node scripts/las-formas-que-mienten.mjs --todo` tiene que dar 0 en las preguntas 211, 212 y 214.
Cada forma nueva del informe se busca en toda la app con la búsqueda que el propio informe usó (está en cada sección), y lo
que aparezca de más se arregla en la misma propuesta (plata y permisos: se lista para Claude). Preguntas 210 a 214 de
`docs/COMO-AUDITAR.md`.

```comprobar
prueba: src/__tests__/auditoria-336-quien-ve-que.test.ts
prueba: src/__tests__/auditoria-336-plata.test.ts
prueba: src/__tests__/una-lectura-caida-no-borra-la-lista.test.ts
no-usa: await getFiestaById(fiestaId, LECTURA_COMPLETA); en src/app/actions/fiesta/entretenimiento.actions.ts
no-usa: Could not load the default credentials (timeout) en src/app/actions/invoices.ts
usa: menuData.items en src/components/panels/catering--hoja-de-cocina.tsx
usa: unoSoloPorNombre en src/lib/assistant/tools/executors.ts
usa: hayPresupuestoParaIA en src/app/actions/touchpix-ai.ts
usa: hayPresupuestoParaIA en src/ai/flows/multiagent-flow.ts
archivo: docs/auditorias/2026-11-23-gemini-2da-vuelta.md
no-usa: sessionStorage.getItem(SESSION_KEY_PREFIX en src/components/panels/portal--mensajes.tsx
no-usa: sessionStorage.getItem(SESSION_KEY_PREFIX en src/components/panels/portal--tu-web.tsx
no-usa: await requireAppSession(); en src/app/actions/games.actions.ts
```
