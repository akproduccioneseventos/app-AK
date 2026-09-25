# Logistica y retornos - revalidacion 25/09/2026

Base main2c652dddeaf33e4d709256a60a57ceac6376a225, sin cambio respecto de tanda anterior.
Alcance: LOG01-04 ya auditados; no mejoras nuevas81. Codex audita, sin codigo app/build/merge.
Se reutilizaron sondas historicas adaptando SOLO alias de rutas a archivos reales.9 casos:7 PASS/2 FAIL. Funciones AST con almacenamiento simulado; no Firebase/ensayo fisico.

## Cerrado en estos casos
- Necesidad6 de stock10 no marca conflicto; necesidad11 si.
- Borrar activo asignado se rechaza, tanto con nombre original como renombrado. LOG02 pasa.
- Retorno registra operador y marca cargado; guardar estructura preserva retorno.
- Cantidad remota8 reemplaza cantidad local2. LOG03 pasa.

## LOG01 persiste: stock por renglon en lugar del total del activo
src/app/actions/fiesta/carga-operativa.actions.ts:198 checkAssetConflicts.
Stock10 y dos renglones del mismo origenId con cantidad6 cada uno: devuelve hasConflict=false para ambos. Se requieren12, no6.
La funcion resta lo que llevan otras fiestas pero compara solo cantidad de cada renglon de esta.
Consumidores: src/app/(app)/fiestas/nueva/carga-operativa/page.tsx:256,401,442,571,644. Algunas llamadas pasan solo categoria o un renglon; sumar solo el argumento tampoco cubre todas las entradas.
Claude: computar necesidad total vigente de este activo para la fiesta, incluyendo categorias, y aplicar la edicion propuesta sin contarla dos veces; conservar descuento de otras fiestas. Gemini adapta consumidores si cambia contrato.
Pruebas: mismo activo en dos categorias, edicion6->7, quitar renglon, stock exacto, diferentes origenId. No cambiar inventario real en pruebas.

## LOG04 parcialmente corregido: respuesta atrasada con item sin marca
src/app/(app)/fiestas/nueva/carga-operativa/page.tsx:147 mergeRemoteOperationalState.
Existe proteccion cuando AMBOS items tienen actualizadoAt. Si llega una instantanea vieja donde B todavia no tenia marca, no se aplica: B vuelve a cargado=false.
Sonda: snapshot A a12:00; luego snapshot B a12:00:01. Aplicar nueva y despues vieja deja [true,false] en vez de [true,true].
Consumidores verificados: polling lineas295-310 y respuesta de guardado linea334. No hay descarte de respuesta por revision global antes del merge. pendingItemUpdates evita iniciar cierto polling, no invalida respuestas ya en vuelo.
Es regresion de pantalla demostrada por funcion real; NO se afirma que esta sonda borre el estado remoto.
Gemini: no permitir que instantanea anterior/sin marca pise item con revision mas nueva; manejar revision de lista/item y respuestas de otra fiesta. No desactivar sincronizacion ni bloquear cambios intencionales.
Probar orden normal/invertido, viejo sin actualizadoAt, foco en cantidad, cambio de fiesta y desmarcado intencional posterior. Claude revisa contrato de versiones si requiere servidor.

## Limites
No aprobacion de toda logistica. No reejecutar casos de regalos/video/barra sin cambios.
Sondas/resultados en docs/evidencias/logistica-retornos-2c652dd*. Requieren logistica-sonda.cjs y retornos-sonda.cjs de la misma carpeta.
Los tests siguientes son PROPUESTOS/PENDIENTES, no ejecuciones declaradas.

```comprobar
archivo: src/app/actions/fiesta/carga-operativa.actions.ts
usa: checkAssetConflicts en src/app/(app)/fiestas/nueva/carga-operativa/page.tsx
prueba: src/__tests__/carga-stock-total-por-origen.test.ts
archivo: src/app/(app)/fiestas/nueva/carga-operativa/page.tsx
usa: mergeRemoteOperationalState en src/app/(app)/fiestas/nueva/carga-operativa/page.tsx
prueba: src/__tests__/carga-respuestas-viejas-sin-marca.test.ts
```
