# Orden 357 — Robot, vuelta 2: la cocina cuenta a los niños igual en todos lados, el personal cobrado es lo cobrado y las tareas no dicen "al día" con fallas

**Para Gemini. Va en la MISMA propuesta que la 350, 355 y 356 (rama `gemini/orden-346`).** Si un bloque se traba, entregá
el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Toca plata y comida: Claude la
revisa línea por línea; nombrá el candado (`src/__tests__/el-candado-de-la-plata.test.ts`) y no saques permisos.

## Por qué
Segunda vuelta del robot (26/11/2026): áreas comida y personal, aspecto tareas automáticas, y el recorrido de las 152
pantallas con dos fiestas (sin rojos nuevos: los de cámara son del entorno y los demás ya están en la 346). Claude confirmó
cada punto en el código. Decisión del dueño que NO se toca: la lista de compras usa los invitados del presupuesto.

## Bloque 1 — Cocina: los niños se cuentan igual que en el costo (pregunta 150)
1. `src/lib/compras/compras-del-menu-asignado.ts` ~60-66: los platos del menú asignado que no están en el presupuesto se
   compran `porPersona * totalInvitados`, sin separar niños. El costo de la fiesta sí los separa con `getGuestCountForItem`
   (`src/lib/calculations.ts` ~29). Usá esa misma función con adultos, adolescentes y niños de la fiesta.
2. `src/components/panels/catering--lista-compras.tsx` ~133-139 (`getTargetGuests`) mira sólo `name.includes('niño')`. No ve
   "nino", "infantil", "menores" ni "kids". Reemplazala por `getGuestCountForItem`: una sola regla para lista y costo.
3. La mesa buffet: `src/components/catering/MenuForm.tsx` ~152 compara exacto con `'MESA BUFET'` o `'Mesa Buffet'`, y el
   servidor (`src/app/actions/menus-catering.ts` ~89) compara en mayúsculas con `MESA BUFET`/`MESA BUFFET`. Una función
   `esMesaBuffetBase(nombre)` en `src/lib/catering/` (mayúsculas, sin tildes, las dos grafías) y la usan los dos.
4. Unidades que no se pueden convertir (`src/lib/compras/consolidar-compras.ts` ~128-129): hoy, si la unidad del precio no
   se convierte, usa el precio del catálogo como si fuera de la unidad de la receta y el total en pesos sale mal (la pantalla
   ya avisa en rojo). Ese renglón va con total `null` y no suma al total en pesos; el total dice "sin contar N renglones con
   unidades distintas". El aviso que ya existe (`catering--lista-compras.tsx` ~540-549) queda.

## Bloque 2 — Personal
1. **Total cobrado del reporte** (`src/components/panels/empleados--reporte.tsx` ~115-136) suma el sueldo de todas las
   asignaciones aunque el recibo esté pendiente. El historial (`src/app/(app)/empleados/[id]/historial/page.tsx` ~160-172)
   sí cuenta sólo `pagado` o `firmado_subido`. Una función `totalCobradoDelPersonal` en `src/lib/personal/` que usen las dos.
   El reporte muestra aparte "Pendiente de pago". (Ya existe `el-total-cobrado-del-personal-no-miente.test.ts`: sumale el
   caso del reporte.)
2. **Recibos guardados en un lugar y leídos de otro**: `saveReciboFirmado` guarda con `mutateGenericJsonArray`
   (documento entero, `src/app/actions/recibos-personal.ts` ~166), pero `personal-recibos.json` está en `FILE_TO_COLLECTION`
   (`src/lib/firebase-sync.ts` ~82), así que `readData` (~57) lee primero la colección `personal_recibos`. Hoy anda sólo
   porque esa colección está vacía; si una restauración del respaldo la llena, los recibos nuevos dejan de verse. Sacá
   `personal-recibos.json` de `FILE_TO_COLLECTION` (los recibos viven en el documento entero, como dice
   `generic-json-store.ts`) y fijate que el respaldo (`src/lib/backup/backup-registry.ts` ~92) lo restaure al mismo lugar.
3. `src/app/(app)/empleados/page.tsx` ~89-90: el año de la fiesta sale de `new Date(fechaEvento).getFullYear()`; una fiesta
   del 1 de enero cae en el año anterior. `parseUruguayDate` de `src/lib/utils.ts`.

## Bloque 3 — Tareas automáticas
1. `procesarPosteosProgramados` (`src/lib/presencia-digital/publicador.ts` ~873-880) devuelve `ok: true` aunque haya
   `fallados`, y `src/app/api/cron/publicar-programados/route.ts` ~19 marca la corrida como buena. Con fallados, la tarea
   devuelve falla con cuántos y por qué, y no se marca corrida (`esFalla` de `al-entrar-a-la-app.ts` ~114 tiene que verla).
2. `src/app/api/cron/generate-blog-post/route.ts` ~22 llama a `runMarketingAutomation` sin `includeRecontacto: false`. El
   recontacto de prospectos lo corre el orquestador (`al-entrar-a-la-app.ts`); esta ruta escribe el blog. Pasale
   `includeRecontacto: false`, para que nunca mande mensajes a prospectos por otra puerta ni saltee el reloj con `force=1`.

## Barrido en toda la app
- Niños detectados por texto suelto (pregunta 150): `grep -rnE "includes\('ni(ñ|n)o'\)" src --include=*.ts*`; todo pasa por
  `getGuestCountForItem` o `PALABRAS_DE_MENORES`.
- Comparaciones de nombres de platos con mayúsculas fijas: `grep -rnE "name === '[A-Z ]+'" src --include=*.ts*`.
- Archivos que se guardan con `mutateGenericJsonArray` y están en `FILE_TO_COLLECTION` (pregunta del error 18):
  `grep -rn "mutateGenericJsonArray" src/app/actions` y cruzar cada archivo con `src/lib/firebase-sync.ts`.
- Tareas que devuelven `ok: true` con fallas adentro: `grep -rnE "fallad|errores" src/lib/presencia-digital src/lib/automatico`.
Plata, cobros y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar que la lista de compras use los invitados del presupuesto.
- No tocar el recordatorio de invitados que no abrieron la invitación (decisión del dueño, con interruptor en Ajustes).
- No borrar recibos ni reescribirlos para "migrarlos".

## Qué tiene que comprobar la prueba
- `src/__tests__/la-cocina-cuenta-a-los-ninos-igual.test.ts`: con 80 adultos y 20 niños, un plato "Menú infantil" de un
  menú asignado se compra para 20, igual que su costo; "Nuggets kids" también; "MESA BUFFET" y "Mesa buffet" suman los
  ingredientes de la mesa en el editor y en el servidor; un renglón en "unidad" con precio en "kg" no suma al total.
- `src/__tests__/el-total-cobrado-del-personal-no-miente.test.ts`: el reporte con un recibo pendiente no lo suma a
  "cobrado".
- `src/__tests__/los-recibos-se-leen-donde-se-guardan.test.ts`: `personal-recibos.json` no está en `FILE_TO_COLLECTION`, y
  un recibo guardado con `saveReciboFirmado` vuelve en `getRecibosFirmados` aunque la colección vieja tenga documentos.
- `src/__tests__/una-tarea-con-fallas-no-dice-al-dia.test.ts`: con un posteo fallado, la tarea no se marca corrida.

```comprobar
usa: getGuestCountForItem en src/lib/compras/compras-del-menu-asignado.ts
usa: getGuestCountForItem en src/components/panels/catering--lista-compras.tsx
usa: esMesaBuffetBase en src/components/catering/MenuForm.tsx
usa: esMesaBuffetBase en src/app/actions/menus-catering.ts
usa: totalCobradoDelPersonal en src/components/panels/empleados--reporte.tsx
usa: totalCobradoDelPersonal en src/app/(app)/empleados/[id]/historial/page.tsx
no-usa: 'personal-recibos.json': 'personal_recibos' en src/lib/firebase-sync.ts
usa: parseUruguayDate en src/app/(app)/empleados/page.tsx
usa: includeRecontacto: false en src/app/api/cron/generate-blog-post/route.ts
usa: fallados.length en src/lib/presencia-digital/publicador.ts
prueba: src/__tests__/la-cocina-cuenta-a-los-ninos-igual.test.ts
prueba: src/__tests__/los-recibos-se-leen-donde-se-guardan.test.ts
prueba: src/__tests__/una-tarea-con-fallas-no-dice-al-dia.test.ts
```
