# 136 - Selector de viajes nativos de negocio sin evidencia vigente

## Alcance y contraste

Solo selector de cobertura; no reporte de defectos ni orden de programación. HEAD local exacto: `c7188d19a33365bd0195444311a1d063ed15b0a7`, rama `codex/134-conciliacion-cobertura-20261015`. La conciliación 134 describe fuente publicada `main` `7230f9d02b32805952a185f704a0208bd5d643e6`; no demuestra que este HEAD ni la tanda privada de Claude/Gemini sean idénticos. **NO CONTRASTADO CON LA TANDA PRIVADA**: su HEAD no está disponible. Antes de encargar cualquier implementación, comparar el consumidor señalado con el HEAD exacto de la tanda y con main. No asumir rama base ni que una ausencia de recibo es un fallo.

Regla de lectura: la fila `NO_LINKED_CURRENT_NATIVE_SCENARIO` de `docs/evidencias/134-rutas.csv` indica falta de enlace nativo en el ledger, no que nunca se haya probado. Tests de acciones con dobles, inventarios y respuestas HTTP no equivalen a clicar el trabajo principal, persistir y recargar. No se recomienda repetir seguridad/perfiles (lo cubre la matriz en curso), ni flujos actuales de 135/129-133, ni toda la app.

## Candidatos acotados

### Prioridad alta: maestros de negocio, alta visible y lectura persistida

Recorrido propuesto como una pasada de QA aislado, con datos ficticios y un caso pequeño por tipo: catálogo/servicio, proveedor, empleado y activo fijo. Desde cada pantalla real, ejecutar la acción principal de alta o edición, comprobar el registro y sus campos en lista/detalle tras navegación o recarga. No probar permisos por rol aquí.

- Activos fijos: rutas publicadas actuales `/empresa/activos-fijos/nuevo` y `/empresa/activos-fijos`; `docs/evidencias/134-rutas.csv:32-33` registra referencia unitaria/inventario, sin escenario nativo enlazado. Test focal candidato `src/__tests__/pregunta-58-rebarrido-plata.test.ts`, caso `Activo fijo nuevo` (líneas 202-214), prueba `saveActivoFijo` con dobles y unicidad de reintento; no UI ni recarga.
- Servicios de empresa: `/empresa/servicios`, `/empresa/servicios/nuevo`; `docs/evidencias/134-rutas.csv:74-75`. `src/__tests__/pregunta-58-altas-reintento-no-duplica.test.ts:200-208`, caso `servicio del catalogo`, valida acción/duplicado sobre almacenamiento falso. `src/__tests__/servicios-empresa-guarda-de-a-uno.test.ts:54-83` cubre concurrencia y altas/bajas de acciones con copias en memoria, no formulario real ni reload.
- Proveedores: `/proveedores`, `/proveedores/new`; `docs/evidencias/134-rutas.csv:188-189`. Mismo test de altas, caso `proveedor`, líneas 180-188: action real y mock, identidad/reintento, no listado/formulario tras reload.
- Empleados: `/empleados`, `/empleados/nuevo`; `docs/evidencias/134-rutas.csv:26-27`. Mismo test, caso `empleado`, líneas 190-198, acción/mock únicamente. Excluir `/empleados/roles` y pruebas de denegación: están fuera de este selector por matriz de permisos en curso.

Es un candidato a **un solo viaje combinado**, no cuatro órdenes ni cuatro auditorías completas. El historial 129-133 incluye coberturas parciales de personal, compras y proveedores; sus resultados no sustituyen la alta visible de estos maestros. El registro 135 cubre otros recorridos, no hay que repetir su cocina, agenda Google, 3D ni portal.

### Prioridad media: cliente y agenda comercial con persistencia visible

`/empresa/crm` (`docs/evidencias/134-rutas.csv:42`) no tiene enlace nativo actual en la conciliación. `src/__tests__/pregunta-58-rebarrido-eventos-y-clientes.test.ts:164-180` prueba el caso `prospecto CRM` y duplicados con acción/dobles; no el trabajo visible en CRM tras recarga. Candidato: una creación/edición pequeña de prospecto en interfaz y lectura persistida en lista/detalle, sin repetir la conversión desde simulador.

No volver a correr el simulador entero para este hueco: `docs/evidencias/133-simulador-whatsapp.md` ya documenta en build `a635b27071ecea22092eba2a285892c84c6f9d08` un viaje desktop con UTM Facebook, oferta, presupuesto/lead en CRM y contacto interceptado (no mensaje real); móvil fue omitido. Su consumidor exacto fue `docs/evidencias/133-simulador-whatsapp-despues-de-oferta.spec.ts`, caso `el prospecto puede rechazar la oferta, abrir WhatsApp oficial y aparecer en el CRM` (1 PASS desktop). Eso es evidencia previa, no aceptación de la fuente nueva ni motivo para duplicar el trayecto. Si se necesitara delta, limitarlo a la pantalla CRM/lectura persistida o al móvil solo tras contraste de fuentes.

Reunión: `tests/e2e/la-reunion-de-organizacion-guarda-donde-corresponde.spec.ts`, caso `completar la canción de entrada...` líneas 31-85, sí usa UI, comprueba toast, archivo de fixture y valor en la pantalla de música; por eso **no recomendar repetir reunión de organización completa**. Es alcance distinto de agenda CRM. La conciliación incluye `/contabilidad/crm/agenda` (`134-rutas.csv:11`) sin enlace nativo vigente. Los `src/__tests__/pregunta-58-altas-reintento-no-duplica.test.ts:96-109` prueban alta/duplicidad de cita con dobles, no interfaz/recarga; `tests/e2e/calendarios-react19.spec.ts:19-46` navega calendario y lee cantidad, no crea/guarda una cita. Candidato: crear una cita ficticia desde CRM/agenda y confirmarla tras reload, sin Google real.

### No seleccionar ahora: simulador, presupuesto y PDF

Hay evidencia específica preexistente: `tests/e2e/simulator-budget-journey.spec.ts:48-135` completa el simulador y verifica descarga/tamaño/contenido del PDF; `src/__tests__/simulador-budget-pdf-flow.test.ts` (referenciado en `docs/YA-RESUELTO.md:4093-4097`) cubre acciones/flujo formal con dobles; el recorrido 133 comprueba lead/UTM. No pedir otra pasada completa ni afirmar vigencia sobre 7230 sin comparar consumidores. El test histórico `tests/e2e/simulador-contacto-oficial.spec.ts:14-16,41-56` está obsoleto y puede omitirse fuera de `AK_ENTORNO_AISLADO=true`; 173 ya lo trata como mantenimiento del test, no como defecto del producto.

## Aserciones E2E que no deben tomarse como aceptación

- `tests/e2e/prospecto-simulador.spec.ts:62-77,86-103`: calendario, avanzar, oferta y resumen son condicionales (`isVisible().catch(() => false)`); el bucle puede `break` si no aparece Continuar. El cierre final y el precio sí tienen aserciones obligatorias, así que acredita llegada/visualización parcial, no todos los pasos, guardado CRM ni persistencia.
- `tests/e2e/simulator-budget-journey.spec.ts:90-93`: la oferta opcional usa esperas con `.catch(() => undefined)` y solo pulsa si aparece. El test aún comprueba después resumen, PDF descargado y texto; esta tolerancia no invalida esas aserciones ni justifica rerun general. No inferir que se aceptó/rechazó una oferta si la rama no se ejecutó.
- `tests/e2e/simulador-contacto-oficial.spec.ts:15-16`: dos `test.skip` intencionales limitan a Chromium desktop y QA aislado. Si fue omitido, no es aprobado ni fallido. Además espera tres avances genéricos `Continuar` (líneas 41-44), discrepancia ya documentada en orden 173; no usar ese resultado antiguo como bug actual.
- `tests/e2e/la-reunion-de-organizacion-guarda-donde-corresponde.spec.ts:71-85`: consulta el archivo del fixture antes de navegar a música; la vista posterior demuestra lectura en pantalla, pero no una recarga explícita. Es evidencia válida de ese flujo y razón para no repetirlo, no evidencia genérica para otros maestros o agenda CRM.

## Selector final y límites

1. Primero contrastar exactos símbolos/consumidores con HEAD de tanda y main publicado; si la diferencia de fuente ya cubre la acción y reload, retirar el candidato.
2. Si sigue faltando recibo, priorizar una única pasada UI aislada de alta y lectura tras reload para catálogo/servicio, proveedor, empleado y activo fijo; anotar una observación por registro, no convertir cada ruta del inventario en caso.
3. Añadir CRM y agenda comercial solo si caben en el mismo entorno aislado sin duplicar el recorrido 133 ni la reunión de organización. No tocar integraciones externas.
4. Marcar toda prueba futura PENDIENTE hasta existir, ejecutarse y conservar archivo de caso, resultado y SHA. Esto selecciona evidencia ausente; no declara un fallo, una auditoría nunca hecha, aprobación de rama ni despliegue verificado.

No se ejecutaron pruebas, build, E2E, Git push ni cambios de aplicación.
