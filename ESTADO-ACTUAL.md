# Auditoria 82: pendientes comprobados y evidencias reutilizables

**9/10/2026.** Main final `eef90bd3874f80df5ec3564dc96fff5e4cb6df0d`.
Rama documental `codex/auditoria-82-pendientes-20261009`; no fusionar automaticamente.
PR 1273/1274 fueron fusionadas por otra sesion; esta entrega contiene solo el delta 82.
Codex audita; Gemini/Claude programan segun reparto. Sin cambios de codigo productivo.

- 63 tests adicionales aprobados: 41 unitarios (9 suites) en fuente 1b57, 22 E2E
  focalizados de portal, invitado, espejo, barra y estaciones en build aislado 497ee725.
  Consumidores sin cambios contrastados; no certificar funciones modificadas de otro SHA.
- NUEVO BAR82-CANCEL: cortar solo la cancelacion deja el boton bloqueado. Sonda estricta
  reproducida; orden 132 para Gemini, contraste obligatorio con su trabajo local en curso.
- Barra normal PC/movil PASA: cancelacion persistida; PREPARANDO sin cancelar/cambiar.
  Cuatro fallos originales eran semilla JSON incompatible con emulador, no fallo de app.
- Ordenes 130/131: Claude entrego arreglos en PR 1274 mientras corria esta tanda.
  Conservar su registro; no reprogramarlos ni declarar retest nuevo que no se hizo.
  Retest previo de Claude: 7 suites/22 tests y sonda TikTok aprobados; conservarlos.
- Contador: inventario 1111 y sonda auth son HISTORICOS de 1b57. PR 1274 amplio mapa
  y dependencias. No reportarlos como defectos actuales ni repetir esa implementacion.
  Retest en eef90: 208 rutas/prefijos, 0 pantallas/API sin area; auth SI invalida.
- Portal/RSVP fueron tocados despues de los E2E: sus resultados siguen asociados
  a 497ee725/1b57, no al nuevo main entero. MiniQuiosco/barra no cambiaron.
- Los 19 reales NO conciliados: lectura rechazada, gRPC 7, permisos insuficientes.
  No es prueba de deuda, base caida ni ausencia de datos. Claude necesita lectura privada
  autorizada y originales; no publicarlos en Git ni aflojar permisos de la app.
- Mural/captura offline: reutilizar evidencia 81, no repetir por esta tanda.
- No hay cierre integral ni certificado de cero errores. Integraciones reales, contrato
  completo, resto de flujos y equipos fisicos conservan limites expresos en el informe.

Detalle: `docs/evidencias/82-pendientes-y-recorridos.md` y JSON/sondas 82.
Registro anterior preservado completo: `docs/evidencias/82-estado-previo.md`.
