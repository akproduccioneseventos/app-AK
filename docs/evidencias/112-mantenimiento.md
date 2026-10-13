# Codex112 - Recorrido completo de mantenimiento

12/10/2026. Pedido: completar SOLO el punto1 pendiente, mantenimiento de equipos.
HEAD `ead1238e9a762b06b158f5a889649231294a76d4`, PR1288 ABIERTA.
Fuente app `8fa5b56a2833938541a657dcd15ef88130d24b0e`, sin cambios productivos.
Main99faf4eb contrastado sin delta en accion/consumidor/gastos/alertas.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE: pedir HEAD antes de corregir.

## Resultado

18 criterios ejecutados de navegador:15PASS/3FAIL; dos familias P1, orden159.
`112-mantenimiento-resultado.json`:14PASS, siete criterios en PC y celular.
`112-mantenimiento-fallos-resultado.json`: un PASS y tres FAIL.

| Prueba | PC | Pixel7 |
| --- | --- | --- |
| Equipo vencido asignado a fiesta en cuatro dias: alerta visible | PASS | PASS |
| Cancelar mantenimiento no escribe historial ni gasto | PASS | PASS |
| Transporte cortado antes del envio: error y borrador conservado | PASS | PASS |
| Reintentar: un registro, un gasto123.45, flag pendiente falso | PASS | PASS |
| Recargar ficha y abrir Gastos: historial, fecha y gasto visibles | PASS | PASS |
| Mantenimiento al dia: desaparece alerta de mantenimiento vencido | PASS | PASS |
| Fila pendiente sembrada: Reintentar crea gasto45.67 y limpia flag | PASS | PASS |
| Respuesta perdida DESPUES de HTTP200: reintento no debe duplicar | FAIL | FAIL |
| Dos operadores/trabajos simultaneos: conservar ambos historiales/gastos | PASS | FAIL |

Respuesta perdida: el primer registro/gasto123.45 existe antes del reintento;
el reintento crea otro123.45 y otra fila. Total246.90 para un mismo trabajo.
Concurrencia celular: dos gastos10.25/20.50, una fila de historial; ambos
dialogos cerrados como exito. Una corrida PC paso; NO aceptar todas las carreras.
El fallo financiero se define por SDK persistido, no solo un toast/captura.

## Metodo y errores propios

Playwright Chromium headless PC1440x1000 y Pixel7; Firestore demo local8085,
Next3301 ya compilado, autenticacion QA aislada; ninguna credencial externa.
Fixtures de equipo/fiesta a partir del modelo existente. Todas las escrituras
funcionales se hicieron por botones reales; SDK solo prepara y comprueba datos.
Solicitud financiera real interceptada por Next-Action exacta; no abortar todo.
Recorrido de mantenimiento pendiente sembrado directo declarado, no presentarlo
como error inducido a mitad de servidor ni como cobertura de todos sus reintentos.
Dos paginas envian en paralelo; no barrera interna determinista, pendiente formal.

Inicial conservado en `112-mantenimiento-inicial.json`: dos NOT_ACCEPTED del
auditor por exigir nombre de equipo en alerta que solo muestra nombre de fiesta.
La alerta SI estaba visible. Se corrigio el criterio al consumidor existente;
esa falta de detalle es propuesta UX, no un defecto nuevo del calculo.
Se reforzo tambien la comprobacion posterior: ausencia del mensaje de vencido,
no ausencia del nombre del equipo (que nunca estaba en la alerta).
Otra corrida no arranco por guard de colecciones: el emulador conserva nombres
de colecciones vacias. Se cambio a contar documentos; log/execution conservados.
Iniciales/guard excluidos de los18 criterios, sin ocultar esos intentos.

## Evidencia y limites

Scripts112, resultados, HTTP200 confirmado, capturas visibles revisadas,
logs gzip y `112-resultado.json` con hashes. Source/consumer ubicados con
Graphify puntual y Serena. Sin reconstruccion completa ni nueva compilacion.
Se reutiliza build/tipos/Jest106 solo por fuente compilada inalterada, no como
aceptacion de estos bordes nuevos. Sondas fallidas finalizan exit1 a proposito.

Fixturas retiradas: cero documentos finales; JSON restaurados byte a byte con
fixtureGuard. Servicios propios detenidos tras comprobar parentesco/comando;
puertos3301/8085 sin listeners. Exit1 del cierre intencional del emulador no
es defecto de app. Datos ajenos notificaciones conservados por hash.

No se probaron gastos reales, Hosting, permisos de todos los roles, impresora,
service fisico ni toda la app. Claude programa/compila159; no certificado0errores.
No cambian funciones ni se fusiona PR. Continuar otros puntos solo por alcance pedido.
