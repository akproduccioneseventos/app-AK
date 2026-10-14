# Recuento finito de cobertura 123

- Fuente app: `34f45fbb1a75b7ddc92edadc7831d55f098a9cdb`. HEAD documental: `34f45fbb1a75b7ddc92edadc7831d55f098a9cdb`.
- Main `096f228f70a0c4da4c17582236c07363e80b3100` integrado; juegos, votos y misiones corregidos por Claude. Director prepara PR; Claude fusiona.
- Aceptacion123 y los 52 resultados nativos PASS comparten el SHA de fuente. Proveedor: doble local; proveedor externo sin certificado.
- Jest comprobado COMPUESTO: 740/740 suites y 4660/4660 tests. 739 suites de la amplia y una focal tras completar ResizeObserver de jsdom; no una sola corrida verde. El fallo original queda archivado.
- 421 rutas reconciliadas; 14 areas, 13 con rutas. Cuatro rutas con escenarios runtime actuales; ninguna area tiene aceptacion global.
- Las referencias a suites ejecutadas no certifican funcionalmente la ruta. Evidencia122 permanece historica, aunque coincida un page.tsx.

| Clasificacion | Rutas |
|---|---:|
| `runtime_proved_current_same_sha_receipts` | 6 |
| `reference_in_executed_unit_suite` | 315 |
| `historic_execution_known_sha` | 5 |
| `reference_only` | 24 |
| `not_proved` | 71 |

## Escenarios actuales

- `/empresa/dashboard`: 34 resultados mapeados; consultar detalles y scripts en JSON. Los conjuntos pueden solaparse.
- `/api/multiagent/message`: 46 resultados mapeados; consultar detalles y scripts en JSON. Los conjuntos pueden solaparse.
- `/presupuestos/:id/ver`: 2 resultados mapeados; consultar detalles y scripts en JSON. Los conjuntos pueden solaparse.
- `/empresa/configurador-reunion`: 2 resultados mapeados; consultar detalles y scripts en JSON. Los conjuntos pueden solaparse.
- `/presupuestos`: 6 resultados mapeados; consultar detalles y scripts en JSON. Los conjuntos pueden solaparse.
- `/api/asistente/voz-en-vivo`: 2 resultados mapeados; consultar detalles y scripts en JSON. Los conjuntos pueden solaparse.

## Areas

| Area | Rutas | Aceptacion global |
|---|---:|---|
| plata | 56 | No |
| contrato | 13 | No |
| comida | 12 | No |
| permisos | 15 | No |
| fiesta | 104 | No |
| portal | 23 | No |
| invitado | 7 | No |
| web | 49 | No |
| redes | 10 | No |
| estaciones | 51 | No |
| barra | 0 | No |
| asistente | 30 | No |
| personal | 9 | No |
| automaticos | 42 | No |

## Seguimiento de evidencia

- 95 rutas en seguimiento, enumeradas por archivo/ruta en JSON. No son un recuento de defectos ni de rutas nunca auditadas.
- Historico: 2482 archivos de todos los prefijos de auditoria, incluidas corridas prototipo archivadas. El indice no declara ejecucion.
- Externos/hardware y politicas del dueno (incluida semantica Caja/saldos) tienen entradas separadas.

```comprobar
archivo: docs/evidencias/123-aceptacion.json; 123-jest-execution.json; 123-jest.json; los tres resultados nativos123
usa: recibos con applicationSourceSha exacto y resultados PASS; seis rutas con escenarios concretos, no rutas completas
prueba: node docs/evidencias/123-cobertura-recuento.mjs --source-sha <SHA-exacto> --main-sha <SHA-exacto>
```
