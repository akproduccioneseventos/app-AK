# Guias: documentos y compras anunciados - 2026-09-19
PR1209 e43260f068a751b5c6e2cc519db84e595c14c89f. Punto expresamente pendiente en GUIAS-ARMADO-2026-09-19.md; NO se repite GUI01 ni identidad/enlaces.
Historial consultado. Codex documenta; Gemini interfaz; Claude revisa compras/datos y compila. Dueno decide alcance funcional antes de agregar generacion.

## GUI02 P2: cuenta documentos de la plantilla como si los hubiera generado
src/app/actions/playbooks.ts, applyPlaybookToFiesta, modifica solo tareas de fiesta y registra aplicacion con documentosGenerados=playbook.documentos.length.
Consumidor real: src/app/(app)/playbooks/page.tsx, handleApply muestra "Se generaron ... documento(s)".
No hay construccion de documentos en esta accion. Se inspecciono saveFiesta en src/app/actions/fiesta/fiesta.actions.ts del mismo SHA: valida permisos/personal, preserva secretos y escribe fiesta; no es generador de documentos de la plantilla.
Sonda real por AST: guia con dos definiciones documentales devuelve 2 generados; los argumentos enviados a persistencia no contienen ninguna definicion. Guia sin documentos devuelve 0 (control).
Limite de sonda: no prueba archivos binarios ni callbacks externos de produccion; demuestra el conteo sin materializacion en este recorrido. No atribuir ausencia a toda la app.
Correccion inmediata propuesta: no anunciar documentos generados que no existen. Para crearlos de verdad, definir con el dueno que documento se genera, en que modulo aparece y como se usa; no inventar PDF/contratos ni marcar obligatorio completado.
Aceptacion pendiente: cada documento contado tiene identificador/recurso accesible al reabrir evento; si solo son requisitos sugeridos, la UI y el registro deben llamarlos asi.

## Compras: discrepancia de alcance, no nueva regla implementada
La introduccion de la pagina promete generar compras automaticamente, pero el detalle las llama "Compras sugeridas".
applyPlaybookToFiesta no consume playbook.compras. La fixture contiene una compra y no aparece en persistencia.
No se deduce que no exista lista de compras en otros modulos: existe. Este boton no transfiere estas sugerencias.
Pedir decision del dueno: sugerencias solamente o borradores de compra vinculados. Nunca generar pedidos reales, gastos ni pagos automaticos sin aprobacion.

## Evidencia
docs/evidencias/guias-documentos-sonda.cjs: 2 casos, 1 PASS/1 FAIL de conteo documental; observacion de compra no transferida en ambos.
Con TypeScript disponible: node docs/evidencias/guias-documentos-sonda.cjs SNAPSHOT_ACTIONS_TS del SHA arriba.
Funciones reales con dependencias simuladas. Sin navegador, build, datos reales, merge ni cambio funcional.
Graphify local indisponible por ausencia del repositorio original; lectura remota dirigida. No revalidar arreglos hasta terminar primera pasada.
