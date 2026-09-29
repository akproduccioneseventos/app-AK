# Auditoría — check-in de personal y QR de carga, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Base GitHub: `main` en `b52b1f013d21bd2831b918fb04649636ce24033a`
Estado: PR abierta. Inspección estática de la rama; no probado en producción. Codex no ejecutó las pruebas.
Clasificación: riesgos de integridad/feedback en la tanda pendiente; no se afirma que hayan ocurrido con usuarios reales.

## Hallazgos

### P1 — El enlace de un proveedor puede registrar la llegada de otra persona

En `src/app/actions/accesos-personal-view.ts`, `registrarLlegadaPersonal` carga el acceso con `getAccesoById(tokenId)`, y luego busca la asignación por `acceso.empleadoId`. Si el acceso no tiene empleado asociado (caso permitido explícitamente por `AccesoPersonal` para fotógrafos, catering y otros proveedores), el bloque de respaldo escribe el check-in en `personal[0]`. Por tanto, el token de un proveedor externo podría marcar como llegado al primer integrante de la nómina, no al titular del enlace.

La acción tampoco valida allí vencimiento o permiso del acceso: `getAccesoById` solo busca el id. La página llama la acción directamente desde el cliente. La prueba `la-llegada-con-ubicacion-mide-bien.test.ts` solo usa tokens con empleadoId válido o token inexistente; no cubre un proveedor externo, permiso no pertinente ni acceso vencido.

Impacto: registro de asistencia y ubicación atribuido a la persona equivocada; los registros no son confiables para coordinación o control de llegada.

Recomendación: no asignar nunca al primer empleado como respaldo. Requerir un empleadoId válido y asignado a esa fiesta para este check-in, o guardar una llegada separada identificada por el acceso/proveedor. En la propia acción del servidor, comprobar vigencia, fiesta y alcance del permiso antes de escribir. Agregar pruebas para enlace sin empleado, empleado inexistente, permiso insuficiente y token vencido.

### P2 — El escaneo QR anuncia éxito antes de confirmar el guardado

En `src/app/(app)/fiestas/nueva/carga-operativa/page.tsx`, `handleScanCode` aplica el cambio local, llama `void persistItemPatch(...)` y enseguida muestra “Equipo Cargado/Retornado” y cierra el diálogo. `persistItemPatch` captura los errores internamente, recarga los datos y no los propaga. Si falla la escritura, el toast de éxito igualmente se muestra aunque después aparezca el indicador general de error.

Impacto: el operador puede creer que el equipo quedó anotado cuando el servidor rechazó o no guardó el cambio.

Recomendación: esperar el resultado de persistencia en el flujo QR; mostrar confirmación y cerrar solo si el servidor devuelve éxito. En error, conservar el diálogo/código y mostrar el error concreto. Prueba E2E: escaneo válido con escritura fallida no muestra éxito y el estado permanece pendiente; éxito persiste tras recarga.

## Qué se verificó

- El lector actual es un campo de texto para una entrada tipo teclado (`ak-equipo:<id>`); no se comprobó lectura con cámara física. No describirlo como escáner de cámara.
- El método de persistencia sí comunica fallos en el estado general de la pantalla, pero el toast de QR no espera esa confirmación.
- El test de llegada verifica distancia, token inexistente y switch desactivado; no reproduce las ramas señaladas.
- Revisión estática de archivos de la PR; no se ejecutó test/build, no se cambió código ni se escribió en datos reales.

## Instrucción para Gemini después de concluir auditoría

Corregir ambos hallazgos sin cambiar reglas comerciales. Asociar el check-in exclusivamente al titular permitido del enlace y validar permiso/vigencia en el servidor. Para QR, confirmar persistencia antes del toast/cierre. Agregar pruebas de error y de éxito persistido. Claude compila y registra SHA, entorno y salidas. Mantener compatibilidad con lectores QR tipo teclado; no asumir cámara.


## Comparación con la devolución de Claude

El caso de acceso sin `empleadoId` que termina actualizando `personal[0]` ya está descrito en `docs/ordenes/97-devolucion-de-la-orden-95.md` en `main`; no contarlo como hallazgo nuevo ni volver a pedir esa misma corrección. El punto independiente nuevo de este documento es que el QR muestra éxito antes de que la persistencia confirme. El alcance incompleto de lector/etiquetas se documenta por separado en `docs/evidencias/109-qr-sin-etiquetas-ni-lector.md`.