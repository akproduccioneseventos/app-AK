# Orden166 - Gemini: compras, revision automatica y hora del personal

**PARA GEMINI.** Lo programa Gemini (regla del dueño, 15/10/2026). Arrancar desde `main` actualizado,
rama nueva, UNA sola propuesta con los cinco arreglos. Si uno se traba, entregar el resto igual y avisar
cuál faltó. Claude revisa (con lupa lo de plata), verifica y fusiona; Codex audita.

**NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE (HEAD desconocido).**
Para quienes programan: Gemini/Claude. Codex SOLO audita y conserva evidencia.
Claude revisa especialmente importes, comida y permisos, compila y fusiona.
Una sola propuesta de correcciones junto con esta documentacion, no cinco PR.

Fuente ejecutada: `ce1ac07d1bb16c24dd73e2d26ac55038028a2472`.
Main contrastado al terminar sondas: `1a717203a1a58d4dbf6c5009b7b7cf2636b9e3a4`.
Entre ambos NO hay cambios en src, package/package-lock ni configuracion Jest/Next/TS.
Main incorpora los documentos128/orden165, NO los arreglos165 ni los de esta orden.
Comparar con entregas abiertas/privadas antes de programar. No duplicar165.

## P2 - Corregir Pagado total deja cerrado el recordatorio pendiente

Archivo real: `src/app/actions/fiesta/catering.actions.ts`, `updateShoppingListStatus`.
Consumidor real: `handleStatusChange` en
`src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx`.
El interruptor `pagado-${providerId}` permite marcar y desmarcar Pagado total.

Reproduccion ejecutada: pedido=true/pagado=false crea una tarea abierta;
pagado=true la cierra; al corregir pagado=false la accion devuelve success:true
y guarda el pedido impago, pero la tarea queda completada. Cero recordatorios
pendientes, esperado uno. No es COMPRA01 de listas viejas: ese arreglo sigue vigente.

Mantener coherencia entre la marca corregida y SU recordatorio automatico sin
crear duplicados, sin modificar otras tareas ni registrar pagos reales. No
cambiar politica de pago, monto, proveedor ni permisos. Comprobar ida/vuelta y
reintento. Sonda real de accion con transaccion/permisos de prueba, no navegador.

## P2 - A cuenta acepta y guarda un importe negativo

Misma accion/consumidor. El Input `monto-${providerId}`, type=number, manda
`Number(e.target.value)` en cada cambio y no tiene minimo. La accion autorizada
recibe montoPagado=-500, devuelve success:true y guarda -500.

Validar importe finito y no negativo del lado servidor ANTES de mutar; la UI
tiene que permitir corregir un error de entrada con aviso claro. Cero y 125.50
siguen validos, sin perder centavos. No imponer un maximo inventado, ni tratar
un adelanto negativo como devolucion. No tocar recibos/cuentas del negocio.
La sonda negativa fallo; control de 125.50 aprobado. No se certificaron todos
los tipos invalidos: agregar regresiones para NaN/Infinity/cadena cuando aplique.

Evidencias de ambos: `129-compras-reversion.test.ts`,
`129-compras-ampliado-jest.json`, `129-compras-reversion-observado.json` y
`129-compras-importe-observado.json`, bajo docs/evidencias.
Resultado conjunto:3PASS/2FAIL. Primera sonda3casos conservada aparte, no sumar
ambas corridas como casos distintos.

## P2 - Revision inteligente disfraza una lectura fallida de revision completa

Archivo real: `src/app/actions/smart-automations.ts`, `runSmartAutomations`.
Consumidor real: `SmartAutomationsPage/run` en
`src/app/control-tower/automatizaciones/page.tsx`, boton Ejecutar revision inteligente.

Pagina React y accion REALES, con datos/permisos/avisos ficticios:
getAllFiestas rechaza; la accion convierte ese error en [] y el boton termina
mostrando Revisión completa. Avisos creados: 0, sin alerta.

Distinguir lectura vacia comprobada de lectura fallida. Mantener lo ya valido
sin asegurar que se revisaron todas las fuentes. Aplicar criterio a cada una de
las tres fuentes (fiestas/presupuestos/leads); no reimplementar el arreglo de
getControlTowerData o getAllFiestasPreparationScores, son OTROS consumidores.

## P2 - Un aviso que no pudo guardarse figura como simple Detectado

`notifyOnce` en la misma accion reduce a false tanto success:false como un aviso
silenciado o duplicado; luego runSmartAutomations devuelve success:true.
La pagina real muestra Revisión completa con cero avisos sin aclarar el fallo.
Lote ejecutado: un aviso creado y otro que devuelve error conserva created=1,
pero solo anuncia exito global, sin warning/error/estado parcial.

Separar creado, silenciado, duplicado y fallido; la UI debe explicar lo que no
se guardo y permitir reintentar sin repetir avisos existentes. Conservar los
creados si un paso falla, y no contar silenciados/duplicados como errores.
No enviar WhatsApp, mail ni push reales durante la prueba. No cambiar reglas
de negocio ni permisos. El contador correcto de156 ya esta arreglado: conservarlo.

Sonda: `docs/evidencias/129-automatizaciones-reales.test.tsx`.
7casos:4PASS (vacio real, silenciado, duplicado, nuevo),3FAIL (lectura,
guardado y lote parcial). Evidencias `129-auto-*-observado.json` y
`129-automatizaciones-jest.json`. No son tres defectos: dos causas distintas.

## P2 - El personal ve otra hora despues de un reintento de llegada

Archivo real: `src/app/acceso-personal/[tokenId]/page.tsx`,
`PortalPersonalPage/handleMarcarLlegada` y su `ejecutarRegistro`.
Acciones reales: `registrarLlegadaPersonal` y `getAccesoPersonalPortalView`
en `src/app/actions/accesos-personal-view.ts`.

Pagina React, vista y accion reales; token/base/ubicacion con dobles:
primera llegada a las20:00 Uy guarda el horario, se pierde SOLO la respuesta;
reintento a las20:05 conserva correctamente20:00 en el servidor, pero la UI
inventa new Date() y muestra20:05. Al recargar vuelve a20:00.
No se pide rehacer el candado que YA conserva la hora original en servidor.

Mostrar el valor confirmado y persistido por servidor tras exito/reintento,
sin inventar hora del navegador ni duplicar llegada. Respuesta con timestamp
o relectura segura, segun patron existente. Conservar el acceso por enlace,
validacion de ubicacion/permisos y hora original. No tocar sueldos ni inventar
flujo de salida (no se encontro uno implementado; eso NO es defecto).

Sonda: `docs/evidencias/129-personal-llegada-reintento.test.tsx`.
Control sin corte1PASS; reintento con cinco minutos1FAIL. Observado incluye
texto antes/despues de recarga. Es prueba de componentes, no GPS fisico/Next.

## Aceptacion y entrega

- Conservar estos resultados originales. Migrar las sondas a regresiones del
  proyecto; un error esperado NO equivale a arreglo terminado.
- Probar el parche sobre su SHA nuevo, sin editar esperados para callar fallos.
- Claude: una compilacion/validacion amplia final con fuentes congeladas;
  la amplia128 de769/4819 verdes sigue valida SOLO para la fuente anterior.
- Entorno QA actual para viajes nativos segun requisito114, no abrir otro igual.
- No datos/cuentas/pagos/mensajes reales. No cambiar funcion comercial sin dueno.
- Registrar cada resultado y SHA en YA/ESTADO. Codex no fusiona ni declara0errores.


## Camino exacto (Claude, 15/10/2026)

Leer antes `docs/ANTES-DE-ENTREGAR.md`. No tocar ninguna línea de permisos (`requireEventPermission`,
`requireAppSession`, `CAMPOS_DE_PAGO`): lo frena `src/__tests__/el-candado-de-la-plata.test.ts`.

### 1. Corregir "Pagado" reabre el recordatorio
`src/app/actions/fiesta/catering.actions.ts`, `updateShoppingListStatus` (~línea 45), dentro de
`actualizarFiesta`, junto al bloque `if (campos.includes('pagado') && resultado.pagado)` (~línea 111):
agregar el caso contrario `campos.includes('pagado') && !resultado.pagado && resultado.pedido` → la tarea
con `texto === tareaTexto` vuelve a `completada: false`; si no existe ninguna con ese texto, crearla con el
mismo armado de la línea ~95. No tocar otras tareas ni crear dos (mirar `yaEsta`).

### 2. Adelanto negativo
Misma función, ANTES de `actualizarFiesta` (después de `cambiosPedidos`): para cada cambio que traiga
`montoPagado`, rechazar con `{ success:false, error:'El importe a cuenta tiene que ser un número de 0 o
más.' }` si no es `Number.isFinite` o es `< 0`. 0 y 125.50 siguen válidos (no redondear). Pantalla
`src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx`, input `monto-${providerId}`: `min={0}`
`step="0.01"` y, si la acción devuelve error, mostrarlo y dejar el valor anterior.

### 3 y 4. Revisión inteligente
`src/app/actions/smart-automations.ts`:
- `runSmartAutomations` (~línea 129): cambiar los tres `.catch(() => [])` por capturas que anoten la
  fuente que falló (`fuentesQueFallaron: ('fiestas'|'presupuestos'|'leads')[]`) y sigan con las otras.
- `notifyOnce` (~línea 105): devolver `'creado' | 'silenciado' | 'duplicado' | 'fallido'` en vez de
  boolean (`success:false` o excepción = `'fallido'`; `notification` vacío = `'silenciado'`;
  `isRecentDuplicate`/`isDuplicate` = `'duplicado'`). Contar `created` sólo con `'creado'` (como hoy) y
  sumar `fallidos`.
- Devolver `{ success, results, created, fallidos, fuentesQueFallaron }`; `success` sigue `true` si algo
  se revisó, pero la pantalla decide el cartel con los dos campos nuevos.
- `src/app/control-tower/automatizaciones/page.tsx`, `run`: si `fuentesQueFallaron.length` → cartel
  "No se pudieron leer: <fuentes>. La revisión quedó incompleta." con Reintentar; si `fallidos > 0` →
  "<n> avisos no se pudieron guardar"; sólo sin ninguno de los dos se muestra "Revisión completa".
  Reintentar no repite avisos (ya lo cuida `isRecentDuplicate`).

### 5. Hora de llegada tras reintento
- `src/app/actions/accesos-personal-view.ts`, `registrarLlegadaPersonal` (~línea 150): dentro de
  `actualizarFiesta` guardar en una variable la hora que quedó (`p.checkInTimestamp || nowIso`) y
  devolverla: `{ success: true, distanciaMetros, checkInTimestamp }`.
- `src/app/acceso-personal/[tokenId]/page.tsx`, `ejecutarRegistro` (~línea 59): usar
  `res.checkInTimestamp` en lugar de `new Date().toISOString()`. No tocar ubicación, enlace ni sueldos.

### Qué tiene que comprobar la prueba
Pasar las tres sondas de Codex a `src/__tests__/` con el MISMO esperado (bases de mentira que devuelven
copias): ida y vuelta de Pagado deja un recordatorio abierto; -500, NaN e Infinity rechazados y 0/125.50
aceptados; fuente caída o aviso fallido no muestran "Revisión completa"; reintento de llegada muestra
20:00. Romper cada arreglo a propósito y ver que la prueba falla. Reemplazar las tres líneas `prueba:`
de abajo por las rutas reales.

```comprobar
archivo: src/app/actions/fiesta/catering.actions.ts
usa: updateShoppingListStatus en src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx
prueba: src/__tests__/compras-reversion-y-adelanto.test.ts
archivo: src/app/actions/smart-automations.ts
usa: runSmartAutomations en src/app/control-tower/automatizaciones/page.tsx
prueba: src/__tests__/automatizaciones-revision-inteligente-avisos.test.tsx
archivo: src/app/acceso-personal/[tokenId]/page.tsx
usa: registrarLlegadaPersonal en src/app/acceso-personal/[tokenId]/page.tsx
prueba: src/__tests__/personal-llegada-reintento-hora-original.test.tsx
```

