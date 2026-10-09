# Auditoria 83: contrato y entrega de recuerdos

**9/10/2026.** Main contrastado `859fd23b1175646edc0209cab114241327d302ba`.
Rama documental `codex/auditoria-83-contrato-estaciones-20261009`.
PR 1275/1276 fusionadas por otra sesion. No subir mas a rama 82 cerrada.
Codex audita; Gemini/Claude programan segun reparto; Claude compila.

- CUATRO nuevos pendientes, no correcciones de app. Ordenes 133/134.
- Contrato PC: 2 E2E pasan, 2 fallan. Constancia persiste nombre/huella y no
  contrata ni registra papel; corte de firma libera boton/conserva nombre.
- CT83-NOMBRE P2: vista pierde signedBy; firma del titular vacia.
- CT83-PAPEL P2: constancia oculta imprimir aunque sigue exigiendo papel.
- ENT83-360 P1: manda plataforma-360; servidor acepta plataforma360; cola sin
  entregar, rechazo real repetido. No hubo corte de red en esa sonda.
- ENT83-GUEST P1: Bogue genera loop pero guardado general rechaza QR de invitado.
  Claude: escritura estrecha; NO aflojar permisos generales ni tocar dinero.
- Buzon PASA tras corregir selector de sonda: una fila/ACK, Storage, URL200,
  MIME y bytes iguales; WebM 47.008 bytes reproducido 640x480/cuadro visible.
  Tercer fallo original era de MI prueba, no guardar del Buzon. No arreglarlo por eso.
- Build ejecutado 497ee725; fuentes relevantes sin cambios hasta main final.
  Padre /portal SI cambio: no aceptar su navegacion por estas pruebas directas.
  No certificar app nueva completa ni web publicada autenticada por equivalencia.
- BAR82-CANCEL: correccion presente en PR 1276; conservar evidencia de Claude.
  No repetir orden 132 ni inventar retest propio. Pruebas 80/81/82 reutilizadas.
- No contrastado trabajo LOCAL de otras IA no subido: comprobar antes de programar.
- 19 originales siguen sin conciliar; limite anterior gRPC7 en 82-base-real.json.
  No reintentar ni cambiar permisos sin acceso nuevo; no es deuda ni app caida.
- Integraciones reales, contrato fisico/documento largo, otras estaciones/reintentos/
  concurrencia y matriz integral conservan limites. Hardware se prueba al final.
- Sin codigo productivo, credenciales/datos reales, mensajes/cobros ni dependencias
  nuevas. Agente cerrado, servidores/emuladores propios detenidos. No cero errores.

Detalle docs/evidencias/83-contrato-y-entrega-estaciones.md; resultados/sondas 83.
Estado anterior integro preservado docs/evidencias/83-estado-previo.md.
