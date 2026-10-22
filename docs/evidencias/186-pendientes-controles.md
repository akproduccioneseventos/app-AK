# 186 - Escenarios de control pendientes (sidecar)

No es aceptación ni una auditoría general. Contraste documental para el SHA destino `09ea4138f5146cd2dfa6b792eda31cc04c30843f`; la rama observada es `codex/160-contraste-correcciones-20261021` en `89d968d6b2d7ad30063896a5b186514f080e1ecb`, distinta del destino. No se modificó la app ni se ejecutó build, servidor o test.

## Único escenario concreto pendiente

- **Proveedor, lectura inicial rechazada por transporte:** con un token ficticio válido, hacer que `getProveedorByToken(token)` rechace (no que devuelva `success: false`). El consumidor comprobado en el blob destino es `loadAccess` de `src/app/proveedor/acceso/[token]/page.tsx`, llamado desde `ProviderAccessPage`.
- **Control/estado:** vista `Acceso de proveedor` durante carga; label observable de estado fallido esperado: `Acceso no disponible` junto con mensaje, sin spinner infinito ni rechazo sin manejar.
- **Evidencia que lo deja abierto:** `docs/evidencias/183-proveedor-consumidor-dom.json`, `transport-read-failure-leaves-loading` falló en JSDOM con body vacío, spinner activo y rechazo no manejado. Es solo evidencia de consumidor DOM; no es retest nativo. La rama de resultado estructurado `success: false` sí pasó y no se duplica.
- **Fixture reutilizable:** token ficticio `qa183`; mock de `getProveedorByToken` rechazando `Error('QA183: respuesta de transporte rechazada')`, según el caso de evidencia 183. Sin cuentas reales ni proveedor externo.
- **Resultado esperado observable:** error de carga visible y spinner finalizado. Esto no determina si el problema es de aplicación, proveedor de red o entorno; “no evidenciado” no significa bug.
- **Estado:** pendiente de contraste en QA nativo aislado; no aceptación.

## Límites y exclusiones

134 y 165 son inventarios históricos/estructurales, no matrices de aceptación. Sus conteos no generan escenarios. 169 registra teclado nativo de galería, pero no aporta un delta pendiente nuevo de este alcance; se excluye como caso previo de mismo ámbito. Se excluyen los flujos de tareas, estados y notas del proveedor con PASS documentado en sus límites respectivos, además de manual del dueño, cuentas externas/hardware y órdenes 205, 209, 163 y 208 en curso.

Graphify se consultó de forma puntual, pero no existe `graphify-out/graph.json` en este checkout; no se reconstruyó el grafo. No se ejecutaron herramientas pesadas, servidor, Jest ni app.

## Comprobar

- archivo: `src/app/proveedor/acceso/[token]/page.tsx` en `09ea4138f5146cd2dfa6b792eda31cc04c30843f`
- usa: `ProviderAccessPage` usa `loadAccess`, que consume `getProveedorByToken(token)`
- prueba: fixture/caso de referencia `docs/evidencias/183-proveedor-consumidor-dom.json`; **retest nativo pendiente**, todavía no ejecutado para este sidecar
# Estado del borrador186

NO ACEPTADO como cobertura nueva ni como lista de defectos pendientes. El unico
caso devuelto por el ayudante repetia PROVEEDOR-LECTURA-RECHAZADA ya registrado
en209 y asignado208. Se conserva la salida original debajo para trazabilidad.
La ausencia de graphify-out en este worktree no implica ausencia del grafo del
proyecto: se consulto el grafo existente del candidato103 con consulta puntual.
No se delegaron decisiones financieras. El ayudante se cerro.

