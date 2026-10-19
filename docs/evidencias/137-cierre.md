# QA137 - altas de cliente y salon

HEAD auditoria: `9dc6e78408963dc592d74750b45b7568119fb290`.
Fuente/compilacion QA: `7230f9d02b32805952a185f704a0208bd5d643e6`, build135 exit0,
health `ok` a las `2026-10-16T12:24:20.743Z`; servicios externos reportados false,
Firebase local true. Sin compilacion ni cambios de codigo de app.

## Recorridos

- Cliente: desde el enlace visible `Clientes` (`/customers`), se siguio el enlace
  visible `Añadir Cliente` a `/customers/new`, se completo `#customer-name` con
  `QA137_6276_1792153465728_Cliente` y se pulso `Guardar Cliente`. La UI volvio
  a `/customers`; tras recargar no aparecio el nombre. Resultado funcional:
  **NO APROBADO; persistencia no demostrada**.
- Salon: desde el enlace visible `Salones` (`/empresa/salones`), se pulso
  `Agregar Salón`, se completo `#salon-nombre` con
  `QA137_22804_1792153602762_Salon` y capacidad ficticia `80` (el guardado
  rechaza capacidad cero). El nombre aparecio en UI inmediata, pero tras
  recargar ya no aparecio. Resultado funcional: **NO APROBADO; persistencia no
  demostrada**. No existe ruta actual `/empresa/salones/nuevo`; el alta es un
  formulario en la lista.

No clasificar como defecto confirmado: el log de serve registra
`Firestore connection check failed: Timeout de consulta a base de datos superado
(2000ms)` durante la ronda; no se obtuvo lectura durable del emulador que aisle
la causa. Los resultados Playwright registran dos assertions de UI fallidas tras
guardar/recargar. Primera pasada de sonda: cliente selector de label incorrecto;
salon capacidad omitida. Tras esos dos ajustes, los dos recorridos se repitieron
y llegaron a alta, pero la verificacion posterior a recarga siguio fallando.
No mas reintentos en esta tarea.

## Contraste posterior del director, 16/10 a las16:05UTC

Los resultados anteriores NO prueban perdida de datos: en el cliente la
captura de accesibilidad decia `Cargando clientes...`. Se conservaron antes
de ajustar la sonda: `137-maestros-v1.spec.ts`, resultados/recibo/log iniciales
comprimidos. No se conservo por separado cada captura de la primera ronda.

Se agrego lectura REST **del emulador local** antes/despues de recargar, con
Authorization owner ficticio, sin cambiar codigo de app ni recompilar. El
resumen `137-consolidado.json` conserva campos, IDs, tiempos y estados:

- Cliente: la app registro `Guardado exitoso` para el ID
  `cust_94e905a1-3358-4b6e-8eb7-bad7f6c338f7`, pero el viaje siguio en
  `/customers/new` con `Guardando...` al vencer la espera de25s. No se llego
  a la lectura durable ni a la recarga: **INCONCLUSO**, no cliente perdido.
- Salon: se observo exactamente UN documento con capacidad80; la lectura
  posterior a recarga conserva el mismo ID, campos y create/updateTime, y
  la lista vuelve a mostrar el salon. Captura `137-salon-recarga.png` revisada
  manualmente. **Persistencia y UI tras recarga COMPROBADAS en esos puntos**.
- El runner final sigue **0PASS/2noPASS**: cliente falla por espera de URL y
  salon agota el limite global90s durante la captura/finalizacion (duracion
  registrada128s). NO convertir estos checkpoints en dos tests aprobados.

El health inicial ya reportaba Firebasefalse (plazo2s), aunque ambas altas
llegaron al SDK local. El servidor muestra multiples consultas de respaldo
con plazo3.5s agotado y `AutoBackup failed`; no se aislo si el cuello viene del
emulador, recursos de esta maquina o comportamiento de app. Es un limite
de evidencia, no diagnostico de produccion ni una nueva orden para reescribir
guardados. No se hizo otra ronda a ciegas para obtener verde.

Runtime de diagnostico cerrado despues de los limites. Launcher/server12292 y
Java5224 detenidos, puertos3300/8085 sin listener, sin diff de fuentes QA.
Logs/recibos iniciales y diagnosticos separados; recibos historicos135/136
restaurados por bytes desde HEAD, con hashes en137-consolidado. No aceptar
el area completa, ni movil/editar/fotos/disenos/contratos de salones por esto.

Para continuar cliente hace falta aislar el tiempo del guardado y la lectura
del registro antes de otra aceptacion UI. No usar los dos fallos iniciales
como evidencia de perdida ni repetir las8altas136 ya vigentes.

## Runtime y resguardo

Se lanzo el runtime autorizado, Java emulador local proyecto `demo-ak-producciones`
en `127.0.0.1:8085`, servidor build135 `127.0.0.1:3300`, sin claves reales.
Recibos/logs crudos de la ronda: `137-runtime-emulator-receipt.json`,
`137-runtime-emulator.log`, `137-runtime-serve-receipt.json`,
`137-runtime-serve.log`. Recibo Playwright: `137-execution.json`; resultados,
capturas de accesibilidad en fallos y artefactos en `137-results.json` y
`137-artifacts/`. QA snapshots y restauracion byte-exact de
`customers.json`/`salones.json` en `data` y `src/data` registrados en el test.
Esos archivos no cambiaron durante la ronda.

Procesos runtime detenidos; verificado sin listener local en puertos 8085/3300.
El emulador era en memoria y desaparecio al cerrarse. Se conservaron errores y
logs; no hubo acciones de borrar desde la UI. No se probaron otros modulos ni se
emite conclusion sobre toda la aplicacion.
