# Revalidacion de auditorias anteriores - 25/09/2026

Pedido: revisar correcciones anteriores, excluyendo las nuevas mejoras de orden81.
Base main: 834fc98e312d657f0486993138e10028bbe49308.
Tanda abierta: PR1223, 4881e4b0321920c6bcd198b8820861814947ee99 (orden83).
No modifica la barra; no contiene correccion del residual descrito abajo.
No se programo app, no build, no merge, no datos reales.

## Resultado prioritario: NO todo cerrado
BAR01 sigue parcialmente abierto. reintentarDevolucionesPendientes vacia la lista durable en la transaccion (lineas206-207), y despues llama reponerStock (linea221).
Sonda AST del codigo actual: en el punto donde la devolucion espera, pendingRecords=0 y stockCommitted=false. Una caida/reinicio en ese intervalo puede perder la devolucion. No se simulo una caida real de Firebase; se comprobo el intervalo sin registro durable. Tampoco se afirma que ya haya ocurrido en produccion.
La toma atomica evita dos consumidores simultaneos, pero no garantiza recuperacion tras interrupcion.
Claude: registrar reclamacion durable con recuperacion y aplicar stock + marca de movimiento idempotente de forma atomica cuando corresponda. No basta borrar antes para evitar duplicados. Probar interrupcion antes/despues del stock y dos trabajadores; no duplicar ni perder devolucion. Respetar modo sin base y no prometer durabilidad si falla todo almacenamiento.

## Confirmado por sonda actual
- BAR02: tras fallo de una tarea, la siguiente SI se ejecuta (2 llamadas). El error de la primera sigue visible. PASS.
- REG01: lista de regalos guardada y vacia intencional: 2 PASS.
- REG02: disponible se reserva; ocupado/inexistente devuelve error sin escribir: 3 PASS.
- GUI02: documentos anunciados se conservan en la estructura de fiesta: 2 PASS. No prueba archivos binarios ni descarga.
Son 8 controles PASS y 1 control FAIL en estos casos. Persistencia simulada; no equivalen a recorridos completos.

## Correcciones presentes, no nueva validacion integrada por Codex
- Fotos: createDataItem/mutateDataItem/deleteDataItem sustituyen lista completa en produccion.
- Salones: cambiarUnSalon usa mutateDataItem y cubre foto/pagos; tests estructurales ampliados.
- Barra: reintentos pendientes y guardado de respaldo sin permiso administrativo; se distingue mejora presente del residual de interrupcion.
- Secretario/salon3D: PR1214 fusionada (8a2b24f); devolucion seis E2E archivada. El registro declara puerta aprobada; no nueva ejecucion E2E en este entorno.
- Calendario/RSVP/reemplazo de trago/ultimo borrado tenian evidencia anterior; dependencias modificadas requieren respetar limites del SHA, no adjudicarles una prueba nueva.

## Registro historico reconciliado
Se examinaron 73 secciones del registro compartido fechadas 8-21/9. En 53 hay referencia explicita a prueba. Todas las rutas archivo/prueba citadas en esas secciones existen en main actual.
Detalle mecanico: docs/evidencias/reconciliacion-historica-834fc98.json.
Esto NO significa 73 hallazgos independientes ni 53 pruebas ejecutadas; incluye entradas de metodo y falsos positivos. Sirve para no pedir implementar otra vez lo registrado.
Areas registradas: contabilidad, galeria/atribucion comercial, publicidad, planificacion, login, decoracion/avisos, portales, Touchpix, persistencia, respaldos, reportes, post-fiesta, logistica, insumos, incidentes, reuniones, impresos, compras, buzon, secretario y personal.
No queda certificado CADA hallazgo historico solo por esta reconciliacion. Faltan pruebas de comportamiento actuales para los casos sin evidencia vigente contrastada.

## Limites y pendientes anteriores visibles
- Importacion de invitados: tests/e2e/importar-invitados-de-una-planilla.spec.ts:56 todavia excluye todo lo que no sea chromium-desktop. No dar la importacion movil por comprobada; verificar orden76/decision de producto antes de llamarlo defecto actual.
- Varias sondas historicas esperan alias de archivos o dependencias anteriores. El primer intento masivo uso argumento inadecuado y dio ENOENT/EISDIR: error del ejecutor Codex, NO fallos de app. Video/incident dieron dependencia no inyectada: tampoco fallos de app. No se cuentan en totales.
- La sonda antigua GUI01 reintenta incluso despues de success:true con historialNoAnotado; su FAIL no reproduce automaticamente el comportamiento actual de pantalla. NO emitir nuevo defecto por ese resultado sin contrastar consumidor.
- No se ejecutaron Jest/build/E2E del conjunto ni se probo publicado; no hay node_modules ni build local en esta copia de auditoria. No se repite compilacion que corresponde a Claude.
- Hardware/conexiones reales siguen requiriendo ensayo. Mejoras nuevas orden81 excluidas del veredicto.

## Reparto
Claude: residual BAR01 y evidencia de compilacion/recuperacion. Gemini: orden83 pendiente separada; no abrir otra implementacion de los cierres ya presentes. Codex: dictamen limitado a evidencia descrita.
No aumentar memoria ni revertir autorizaciones: el historial actual indica que el dueno autorizo1024MB el23/9, a diferencia del estado viejo. No modificar configuracion en esta revision.
