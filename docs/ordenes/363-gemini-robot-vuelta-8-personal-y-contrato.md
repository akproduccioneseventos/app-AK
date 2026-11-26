# Orden 363 — Robot, vuelta 8: guardar el personal no borra las llegadas y el contrato engancha la seña que ya existe

**Para Gemini. Va en la MISMA propuesta que la 350 y la 355 a la 362 (rama `gemini/orden-346`).** Si un bloque se traba,
entregá el resto y avisá cuál faltó. Antes de decir "terminé", leé `docs/ANTES-DE-ENTREGAR.md`. Los bloques 1.3 y 2 tocan
sueldos y la seña: Claude los revisa línea por línea.

## Por qué
Octava vuelta del robot (26/11/2026), sobre las áreas personal y contrato, de punta a punta. Esto está bien: los recibos
(con el candado del recibo pagado), la cédula y el sueldo para quien no tiene permiso, la llegada por enlace con ubicación,
la firma digital con la huella del texto y la constancia, que no se pisa desde el guardado general. Claude confirmó cada
punto en el código.

## Bloque 1 — Guardar la pantalla de Personal no borra lo que marcó el personal (pregunta 210)
`src/components/fiestas/panels/personal.tsx` lee `personalAsignado` una sola vez (~134 y ~147) y el autoguardado (~241) manda
**la lista entera de ese momento** a `updatePersonalFiestaActual` → `updatePersonal`
(`src/app/actions/fiesta/personal.actions.ts` ~109, `updateFiestaPartial(fiestaId, { personalAsignado: personal })`), que la
reemplaza toda. Si en el medio alguien marcó su llegada (`marcarLlegadaPersonal`, `src/app/actions/personal-fiestas.ts` ~62;
`registrarLlegadaPersonal`, `src/app/actions/accesos-personal-view.ts` ~228) o confirmó o rechazó su asistencia, al tocar un
rol o un sueldo **vuelve a figurar "no llegó" / "pendiente"**.
1. `updatePersonal` combina, **dentro de la misma escritura** (`actualizarFiesta`, como ya hace `marcarLlegadaPersonal`), cada
   fila que llega con la guardada: los campos que marca el personal (`checkInTimestamp`, `checkInUbicacion`,
   `asistenciaConfirmada`, `fechaConfirmacionAsistencia`, `motivoRechazoAsistencia`, `src/types/fiesta.ts` ~192-200) salen
   **siempre de la base**, nunca de la pantalla.
2. Las filas se emparejan por `empleadoId` **y** `rolId`, no sólo por `empleadoId`.
3. Mismo emparejamiento para conservar el sueldo de quien no tiene permiso SUELDOS: hoy `personal.actions.ts` ~41
   (`currentPersonal.find(prev => prev.empleadoId === p.empleadoId)`) y `src/lib/fiesta/recortar-para-afuera.ts` ~214 (un
   `Map` sólo por `empleadoId`) le ponen a la segunda asignación de una persona el sueldo de la primera.
No cambies las reglas de personal por invitados ni quién ve el sueldo.

## Bloque 2 — El contrato en papel engancha el recibo de seña que ya existe (pregunta 236)
`uploadPhysicalContract`, `src/app/actions/fiesta/documentos.actions.ts` ~367-412: si el guardado final de la fiesta (~435)
falla, el recibo de seña ya quedó creado. Al reintentar, `hasDeposit` lo encuentra por `sourceFiestaId` (~372-375), pero la
rama `else` (~410-412) sólo borra `reciboSenaPendiente` y **no agrega su id a `invoiceIds`**: la fiesta queda Contratada y el
recibo no figura entre sus facturas. En el `else`, buscá ese recibo y sumá su `id` a `updatedFiesta.invoiceIds` si no está.
Además, ~316-322: el archivo se sube antes de saber si la fiesta se guarda, y cada reintento sube otro. Usá un nombre fijo
por fiesta (que el reintento reemplace el mismo archivo).

## Bloque 3 — La firma del portal no dice "registrada" si no registró nada
Mismo archivo, ~249 y ~276: si el contrato ya estaba firmado (en el portal o en papel), devuelve `{ success: true }` sin
guardar nada, y el portal (`src/app/portal/[fiestaId]/contrato/page.tsx` ~153) muestra "¡Constancia Registrada!". Devolvé
`{ success: true, yaEstabaFirmado: true }` y que el portal diga "Este contrato ya figura firmado".

## Barrido en toda la app
- Pantallas que autoguardan una lista entera leída al abrir, donde otro flujo escribe campos de la misma fila (pregunta 210):
  `grep -rn "updateFiestaPartial(.*{ *\w\+:" src/app/actions` y, por cada lista, ¿alguien más escribe en sus filas?
- Reintentos que encuentran lo ya creado y no lo enganchan (pregunta 236): `grep -rn "hasDeposit\|yaExiste\|existing" src/app/actions`
  y mirar la rama "ya existe": ¿hace lo mismo que la rama "lo creé"?
- Emparejar filas sólo por `empleadoId` cuando la clave es persona y rol: `grep -rn "empleadoId === " src/app/actions src/lib`.
Plata, sueldos y permisos: se lista y Claude lo revisa.

## Lo que NO hay que hacer
- No cambiar que la reserva y la seña salgan sólo del contrato en papel (decisión del dueño, 25/09).
- No tocar el monto de la seña: eso ya lo pide la orden 356.

## Qué tiene que comprobar la prueba
- `src/__tests__/guardar-el-personal-no-borra-las-llegadas.test.ts` (base de mentira que devuelve **copias**): una llegada
  marcada después de abrir la pantalla sigue marcada tras el autoguardado con la copia vieja; dos asignaciones de la misma
  persona con roles distintos conservan cada una su sueldo cuando guarda alguien sin SUELDOS.
- `src/__tests__/el-reintento-del-contrato-engancha-la-sena.test.ts`: con un recibo de seña ya creado para la fiesta y
  `invoiceIds` vacío, subir el contrato deja ese id en `invoiceIds` y no crea otro recibo.
- `src/__tests__/la-firma-ya-hecha-no-dice-registrada.test.ts`: firmar un contrato ya firmado devuelve `yaEstabaFirmado`.

```comprobar
usa: actualizarFiesta en src/app/actions/fiesta/personal.actions.ts
usa: yaEstabaFirmado en src/app/actions/fiesta/documentos.actions.ts
usa: yaEstabaFirmado en src/app/portal/[fiestaId]/contrato/page.tsx
prueba: src/__tests__/guardar-el-personal-no-borra-las-llegadas.test.ts
prueba: src/__tests__/el-reintento-del-contrato-engancha-la-sena.test.ts
prueba: src/__tests__/la-firma-ya-hecha-no-dice-registrada.test.ts
```
