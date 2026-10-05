# Revision 69 - Ultima entrega y limites del cierre

5/10/2026. Codigo: `feb90f4d40906029d6d31ba2e2abbed64461a2ad`, main, PR 1256
fusionada por Claude. No habia otra PR abierta al contrastar. Codex no programo
la app, no compilo produccion ni fusiono nada. **CIERRE NO APROBADO.**

## Hallazgos por area

- Area: `permisos` / `fiesta`. Commit: `feb90f4d40906029d6d31ba2e2abbed64461a2ad`.
  **BASE01 / P1:** personal sin organizacion ni asignacion lee fiesta, lista e
  historial con claves/tokens y acepta guardados completos/parciales de costos.
  `src/app/actions/fiesta/fiesta.actions.ts`; sonda
  `69-sonda-puertas-generales-fiesta.cjs`. Persistencia/sesion sinteticas, no
  extraccion HTTP ni escritura productiva. Orden 118, Claude.
- Area: `permisos` / `fiesta`. Commit: `feb90f4d40906029d6d31ba2e2abbed64461a2ad`.
  **BASE02 / P1:** `getFiestaActual` y `getFiestaBySlug` retornan fiesta cruda
  sin sesion con claves/credenciales; misma sonda. La pagina por slug transforma
  los datos: NO se demostro que su HTML muestre secretos. Revisar tambien la
  exposicion de Server Actions. Orden 118, Claude.
- Area: `portal`. Commit: `feb90f4d40906029d6d31ba2e2abbed64461a2ad`.
  **PORTAL01 / P2:** fiesta de hoy aparece concluida antes de su inicio. Navegador
  y `69-sonda-fecha-portal.cjs` cargando el calculo real de
  `src/app/portal-cliente/[id]/page.tsx:568-572`: UTC se convierte al dia anterior
  en Uruguay. Orden 119, Gemini.
- Area: `portal`. Commit: `feb90f4d40906029d6d31ba2e2abbed64461a2ad`.
  **PORTAL02 / P2:** WhatsApp tapa el asistente a 660 px. DOM: asistente
  (374,500,206,56), ayuda (468,512,176,44); interseccion 112 x 44 px. Consumidor
  `AsistenteDelCliente` en la pagina; boton en
  `src/components/portal/AsistenteDelCliente.tsx:112`. Orden 119, Gemini.

## Evidencia ejecutada

- Jest: 597 suites / 3.432 pruebas. Primera corrida: 589 suites aprobadas y ocho
  con interferencia del entorno local en mocks. Repetidas SOLO esas ocho con su
  entorno: ocho suites / 32 pruebas aprobadas. Sustituyendo sus resultados:
  **597 suites / 3.432 pruebas aprobadas**. No sumar 32 a 3.432.
- Originales comprimidos, SHA-256 y resultados por caso:
  `69-resultados/manifest.json`. Comandos en el mismo manifiesto/informe.
- Las sondas salen con cero cuando reproducen el defecto esperado: NO son
  pruebas de seguridad o fecha aprobadas tras una correccion.
- Cliente ficticio: ingreso valido y pestanas Progreso/Invitados/Pagos; 61
  confirmados/19 pendientes; total $335.000, pagado $0, saldo $335.000 consistente.
- Invitado ficticio: enlace personal, fecha correcta "El evento es hoy", mesa/QR
  visibles, ocho accesos sin controles administrativos; carta con ingredientes
  abre, red social abre, formularios de foto/video y dedicatoria accesibles.
  NO se confirmaron descarga de QR, subida, pedido/cola/entrega ni check-in.
- Dedicatoria intentada sin confirmacion: modo JSON local desactiva `dbAdmin`;
  `social-interactive.ts` requiere Firestore y devuelve "Firestore no disponible."
  No es prueba de fallo productivo.
- CUA: `Timed out running CDP command "Page.navigate" for tab 1`; luego aparecio
  el DOM. No es evidencia de fallo de login. La primera fiesta ficticia fue
  eliminada por limpieza E2E: se descarto ese intento y se aislo otra fixture.
- E2E amplia interrumpida tras 29 minutos: timeouts de 90 s, compilacion inicial
  96-158 s, sin JSON final valido. NO aprobada y no atribuida automaticamente a
  defectos productivos. Un error exacto capturado: `69-resultados/browser-incomplete-errors.json`.
  La siembra posterior reutilizo `test-results` y borro los rastros previos: NO
  se conservan trazas ni reporte completo. Configuracion de siembra corregida
  para aislar su salida; no repetir ese error de metodologia de Codex.
- Causa adicional comprobada: `dev.log:135,237,385` dice "Server is approaching
  the used memory threshold, restarting...". Tres reinicios con limite de heap
  de 3072 MB del lanzador local. Son del servidor de DESARROLLO, no una medicion
  ni un diagnostico del servidor publicado. Claude debe servir una version
  compilada estable para navegador (orden 114), sin aumentar memoria productiva
  ni repetir la corrida amplia en este mismo entorno inestable.
- Dos ayudantes economicos hicieron inventarios acotados y fueron cerrados.
  Inventarios estaticos NO equivalen a integraciones aprobadas. Ninguna dependencia
  de produccion ni fuente de aplicacion/prueba existente fue modificada.

## Matriz de limites, no de falsas aprobaciones

Todos los grupos tienen suites ejecutadas; no se declaran areas enteras limpias.

| Area | Limite pendiente para cierre |
| --- | --- |
| plata | Conciliar 19 presupuestos reales y recorrido de caja autorizado |
| contrato | Contrato/firma completos en navegador estable |
| comida | Catalogo real, imagen/menu/precio sincronizados en pantalla |
| permisos | Orden 118 y acciones reales por perfil/evento |
| fiesta | Orden 118 y recorrido organizador con persistencia |
| portal | Orden 119 y resto de flujos/estados del cliente |
| invitado | Guardado, check-in y descargas completos con backend de prueba |
| web | Simulador hasta PDF/CRM y visual sobre mismo SHA |
| redes | OAuth vigente, sincronizacion y entrega externa por proveedor |
| estaciones | Orden 117 existente, captura/entrega virtual; luego ensayo fisico |
| barra | Pedido, cola, entrega y stock integrados; luego equipo fisico |
| asistente | Orden 117, voz/multipaso y proveedor conectado |
| personal | Asistencia/rechazo de fiesta ajena en recorrido integrado |
| automaticos | Ejecucion con backend de prueba y entrega externa |

370 rutas: 173 coinciden directamente con `areas.json`, 197 no. **No son 197
defectos:** mapa incompleto ya tratado por orden 112 B.1/AUD01. No marcar limpio
por omision. Historico de navegador (380 aprobados/588 omitidos) es de otro SHA;
no trasladarlo a partes modificadas en 1256. Presupuestos versionados vacios NO
demuestran ausencia ni correccion de las 19 importaciones productivas.

## Entrega

Ordenes 118 y 119 pueden ir en una tanda. No duplicar 117, 112 B.1 ni auditoria
66 sin cambios; sus nuevas regresiones unitarias pasaron. Claude compila y
registra SHA/entorno/resultados; Codex revalida SOLO cambios y limites pendientes.
Orden 114 conserva entorno compilado verificable; prueba fisica 92 va al final.
No se usaron controles rojos de GitHub por facturacion como señal de defecto.
No se proponen funcionalidades nuevas ni cambios de negocio en este informe.
La auditoria end-to-end exhaustiva sigue sin evidencia suficiente para cierre.
