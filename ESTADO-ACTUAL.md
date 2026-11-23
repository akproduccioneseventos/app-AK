# Estado actual — 23 de noviembre de 2026

## Publicado
- **#1462** (23/11): órdenes 331 a 334.
- **#1463** (23/11): mirar no escribe (`codigoDeFiesta`, reparación de fechas apagada en solo lectura) y orden 336 lista.

## En revisión: orden 335 (rama `gemini/orden-335`, una sola propuesta)
- Hecho: solapas (PDF del itinerario), cuatro impresos de mesa recuperados, ingreso de rentabilidad desde el presupuesto
  (**plata: Claude revisa línea por línea**), "No disponible" ≠ "Al día", presencia sin datos, cuenta regresiva con hora,
  motivo claro en muro y carga operativa.

## Siguiente para Gemini (en propuesta nueva, después de la 335)
- **Orden 336 (`docs/ordenes/336-gemini-auditoria-2da-vuelta.md`):** lista de la 2da auditoría profunda; confirmar cada
  hallazgo abriendo el archivo antes de tocar. Plata y permisos los revisa Claude.

## Para Claude: barrido pregunta 207 (get/leer que escriben, sin arreglar)
- No toca plata: `getFiestas`/`leerFiestaConEstado` (`codigoDeFiesta`), `getAlertasGlobalesConLeidas`,
  `getMissionControl`, `getDigitalPresenceDashboard`.
- Toca credenciales o plata (decidir vos): `getConnectedCompanyGoogleAccount`/`getCompanyGoogleAccountStatus` (guardan token
  de Google), `getParteDeLaManana` (cachea resumen con cuotas).
- Pantallas que guardan al abrir: `pagina-web.tsx` (arma con IA solo), campana de notificaciones (crea avisos).

## Pregunta 208 (faltan pruebas de clic real)
- Menú de las 6 casas, 26 solapas del planificador y ~44 tarjetas de `/fiestas/nueva`; `planner-dashboard-modules.test.ts`
  usa una lista copiada vieja.

## Ojo
- La puerta falla seguido por carga de la máquina: `npm run otravez` antes de creer una falla.
- Se llena el disco: borrar `.next` y `test-results` de las copias aparte en el scratchpad.
