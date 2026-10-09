# Auditoria 82: pendientes comprobados y evidencias reutilizables

**9/10/2026.** Main contrastado `1b57abbec5162402cc30269cc276398707b28d55`.
Rama documental `codex/auditoria-81-validada-20261009`, PR 1273 abierta, no fusionada.
Codex audita; Gemini/Claude programan segun reparto. Sin cambios de codigo productivo.

- 63 tests adicionales aprobados: 41 unitarios (9 suites) en main actual, 22 E2E
  focalizados de portal, invitado, espejo, barra y estaciones en build aislado 497ee725.
  Consumidores sin cambios contrastados; no certificar funciones modificadas de otro SHA.
- NUEVO BAR82-CANCEL: cortar solo la cancelacion deja el boton bloqueado. Sonda estricta
  reproducida; orden 132 para Gemini, contraste obligatorio con su trabajo local en curso.
- Barra normal PC/movil PASA: cancelacion persistida; PREPARANDO sin cancelar/cambiar.
  Cuatro fallos originales eran semilla JSON incompatible con emulador, no fallo de app.
- Ordenes 130/131: cinco arreglos previos en curso segun dueno. No se reprograman aqui.
  Retest previo de Claude: 7 suites/22 tests y sonda TikTok aprobados; conservarlos.
- Contador: 14 areas/55 rutas existentes, pero 1111 archivos no-test fuera del mapa.
  Es clasificacion incompleta, NO 1111 defectos. Sonda auth no invalida area limpia.
  Ampliar orden 131 con inventario 82; no implementar otro contador.
- Los 19 reales NO conciliados: lectura rechazada, gRPC 7, permisos insuficientes.
  No es prueba de deuda, base caida ni ausencia de datos. Claude necesita lectura privada
  autorizada y originales; no publicarlos en Git ni aflojar permisos de la app.
- Mural/captura offline: reutilizar evidencia 81, no repetir por esta tanda.
- No hay cierre integral ni certificado de cero errores. Integraciones reales, contrato
  completo, resto de flujos y equipos fisicos conservan limites expresos en el informe.

Detalle: `docs/evidencias/82-pendientes-y-recorridos.md` y JSON/sondas 82.
Registro anterior preservado completo: `docs/evidencias/82-estado-previo.md`.
