# Preparacion, compras consolidadas y buzon administrativo

## Actualizacion prioritaria de entrega - 2026-09-21

La tanda avanzo a bc7fbb3d9226585f234b331e157490e861e0b3b4 (PR1210).
El contraste de codigo muestra correcciones presentes para CTRL-01 (planDePagos),
CTRL-04 (clave con unidad) y CTRL-06 (getter con detalle de fallo y consumidores).
NO revalidadas: no se repitieron las sondas durante esta primera pasada. No emitir
ordenes de reimplementacion de esos tres casos. CTRL-02, CTRL-03 y CTRL-05 conservan
la logica descrita. Lo que sigue documenta pruebas HISTORICAS sobre d2f359, no
resultados actuales sobre bc7fbb3. La mejora de clave con unidad no certifica todas
las identidades/costos del catalogo.

Fecha: 2026-09-20. Codex audita y registra; no programa la app ni compila.

## Alcance y base

PR1210 d2f35915590b9901243d9d7b2f68e1d21713ebd5. Primera pasada de estos comportamientos, no repeticion de impresos, insumos, logistica ni captura del buzon. El historico contiene apertura de pantallas y captura de saludos, no estas combinaciones de errores.

Se contrastaron archivos de las seis PR abiertas: 1210, 1209, 1207, 1206, 1202 y 1197. 1210/1209 cambian uploadBuzonMessage para deduplicar subidas; NO corrigen getBuzonMessages ni su consumidor administrativo. No se solicita rehacer esa deduplicacion ni se certifica aqui. Ninguna modifica readiness-score, la pagina de readiness o resumen-planificacion.

14 casos nuevos: 7 PASS y 7 FAIL, agrupados en seis hallazgos. Sondas AST de funciones reales con dependencias simuladas. No navegador real, Firebase, datos del cliente, pagos, correos ni build. Las cantidades e importes son fixtures sinteticos, no resultados de las 19 fiestas.

Repositorio local original no disponible y Graphify local no disponible; navegacion dirigida por arbol remoto, registro y simbolos. No se afirma auditoria visual ni uso de agentes en esta tanda.

## Parte 1: indicador de preparacion

Fuente: `src/lib/readiness-score.ts`, calculateReadinessScore. Consumidor confirmado: `src/app/(app)/fiestas/nueva/readiness/page.tsx`, load llama a la funcion y muestra detalles/porcentaje/etiqueta.

### CTRL-01 / P1: no ve el plan de pagos utilizado por la app

Lee `(fiesta as any).planPago`, pero `src/app/actions/payment-plans.ts` guarda y lee `fiesta.planDePagos`. La pantalla plan-pagos consume getPlanDePagos. No es solo una sospecha por nombres diferentes: el productor y consumidor reales tienen contratos distintos.

Fixture con una cuota pendiente de 1000 en planDePagos y sin otros riesgos devuelve pagosPendientes=0, score=100. Caso score-payment-plan FAIL. No cambia saldos ni prueba un cobro: el error es el diagnostico que ve el organizador.

Responsable Claude: usar el contrato real y definir tambien cuotas parciales/vencidas y planes ausentes. No duplicar ni migrar datos por suposicion. Criterio pendiente integrado: guardar cuota pendiente en entorno de prueba, abrir indicador y comprobar alerta; pagarla por el flujo autorizado y volver a calcular.

### CTRL-02 / P2: vence tareas del dia antes de tiempo

Compara new Date(fechaLimite) contra medianoche local. Con fecha actual fijada a 20/9/2026 en Montevideo, una tarea para 2026-09-20 se cuenta vencida. Una de 19/9 se cuenta correctamente. Casos score-due-today FAIL y score-overdue PASS.

Gemini: comparar fechas de calendario para vencimientos sin hora. Mantener semantica separada cuando exista hora explicita. No modificar globalmente todas las fechas por este caso.

### CTRL-03 / P2: bebidas vacias hacen aparecer catering configurado

Para tieneDatosCatering basta `bebidas.categorias.length`. Fixture con catering contratado, sin menu ni entrada, y una categoria de bebidas DESACTIVADA y vacia devuelve cateringStatus=Configurado y score=100. Sin categoria devuelve Pendiente de configuracion correctamente.

Casos score-drinks-only FAIL; score-empty-catering PASS. No se pide inferir comida a partir de bebida ni cambiar servicios contratados. Claude por comida: verificar datos operativos reales del menu; Gemini ajusta presentacion si corresponde. Definir el minimo con el dueno antes de cambiar criterios funcionales. Caso positivo adicional score-normal PASS, limitado a los chequeos existentes; no significa fiesta completa lista.

## Parte 2: resumen de compras de planificacion

Fuente y consumidor: `src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx`, loadData -> shoppingList -> tabla y costo total mostrado. Dependencias verificadas: getPresupuestoById, getMenus, getInsumos. No se audita de nuevo el editor maestro de insumos.

### CTRL-04 / P1: mezcla unidades y costos de productos distintos

La clave de consolidacion es nombre + proveedor; omite unidad e identidad origenId. Suma cantidades y conserva unidad/costo del primer registro. Fixture para dos adultos: 1 kg por persona y 500 g por persona, mismo nombre/proveedor, ids distintos. Resultado: 1002 kg y costo 10020, sin error. La combinacion correcta requiere convertir con una regla verificada o mantener filas separadas; NO sumar valores crudos.

Casos shopping-units-mixed FAIL, shopping-same-unit PASS y shopping-normal PASS. La prueba negativa comprueba la suma cruda incorrecta; no aprueba cualquier conversion alternativa.

Responsable Claude: agrupar por identidad y unidad compatible; conversion explicita y probada donde exista. Revisar tambien stock/costo/origen de cada fila. Antes de fusionar productos distintos por nombre, pedir decision del dueno. Prueba pendiente de integracion: mismo nombre con kg/g, unidades no convertibles y costos diferentes; verificar tabla y total.

### CTRL-05 / P1: cero adultos se reemplaza por invitados totales

`adultos = presupuestoData?.invitadosAdultos || Number(configuracion.invitadosEstimados) || 0`. Cero es un dato valido, pero el OR lo trata como ausente. Fixture: presupuesto con cero adultos y diez ninos, estimado diez, un plato principal adulto. Genera insumos para diez adultos (10 kg, costo100) en vez de cero. Caso shopping-zero-adults FAIL.

Responsable Claude por comida/numeros: distinguir cero de dato faltante; respetar desglose real. No borrar el servicio del presupuesto ni reinterpretar cantidad de invitados. Probar cero, ausente, adultos+ninos+adolescentes y desfases de datos. No se comprobo un gasto real: es el calculo mostrado por este resumen.

## Parte 3: administracion de saludos

Fuentes: `src/app/actions/buzon.ts` getBuzonMessages y `src/app/(app)/fiestas/nueva/buzon/page.tsx` handleRefresh. Se incluyeron ambas funciones reales en la misma sonda, no solo un mock de respuesta vacia.

### CTRL-06 / P2: lectura fallida se anuncia como sincronizacion exitosa

getBuzonMessages captura fallos de Firestore y de requireAppSession, registra warn y devuelve []. handleRefresh reemplaza mensajes por [] y muestra Sincronizado. Con mensajes anteriores visibles, tanto fallo de base como sesion rechazada vacian la lista y anuncian exito.

Casos mailbox-db-failure y mailbox-denied FAIL; mailbox-normal y mailbox-empty PASS. Un buzon genuinamente vacio debe seguir siendo valido. No se probo borrado en servidor ni acceso indebido: la guardia rechaza correctamente; el problema es ocultar el error al consumidor.

Claude: contrato de error distinguible, sin debilitar autenticacion. Gemini: conservar ultima lista con aviso de que no pudo actualizar; si expiro sesion, ofrecer recuperacion apropiada. Revisar tambien polling, que usa el mismo getter, pero no se ejecutaron sus temporizadores aqui.

## Evidencia y reproduccion

- `docs/evidencias/control-operativo-sonda.cjs`
- Resultado conservado de ejecucion: 14 casos, 7 PASS/7 FAIL. PASS: score-normal,
  score-overdue, score-empty-catering, shopping-normal, shopping-same-unit,
  mailbox-normal, mailbox-empty. FAIL: score-due-today, score-payment-plan,
  score-drinks-only, shopping-zero-adults, shopping-units-mixed,
  mailbox-db-failure, mailbox-denied. No se regenero un resultado sobre otro SHA.

Preparar fuentes exactas del SHA indicado en una carpeta:
- score.tsx = src/lib/readiness-score.ts
- resumen-planificacion.tsx = src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx
- buzon.tsx = src/app/(app)/fiestas/nueva/buzon/page.tsx
- buzonActions.tsx = src/app/actions/buzon.ts

Node + TypeScript: `node docs/evidencias/control-operativo-sonda.cjs CARPETA`. AUDIT_TYPESCRIPT permite indicar ruta al modulo. El reloj de readiness se fija a 20/9/2026; zona America/Montevideo. Sin accesos a red ni escrituras. Ejecucion completa codigo0; no se repitio para redactar el informe.

## Limites y continuidad

No certificado de modulo completo ni de despliegue. Pendientes browser/E2E, persistencia real controlada, catalogo real/unidades, conciliacion de cobros y datos de las 19 fiestas. No hay prueba de perdida de mensajes almacenados. No se programo app, compilo, fusiono ni inicio otra IA. Seguir primera pasada y luego revalidar correcciones sobre su SHA, conforme al pedido del dueno.

