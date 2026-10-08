# Auditoria 79: retest real, no certificado de cero errores

**8/10/2026.** Fuente main `09c8d814fdecdca00da71de7bc22c1d64ef0e662`.
1266/1267 fusionadas; no habia PR abierta en ese contraste.
Registro nuevo en `codex/auditoria-79-20261007`, NO main hasta integrarlo.
Detalle: `docs/evidencias/79-barra-real-y-limites-estaciones.md`.

## Comprobado

- Excepcion autorizada: Codex compilo una copia aislada, no datos reales.
  Build `y3pk-oG28Gx7I91pIPgS2`; nueve pruebas puntuales/4 suites pasan.
- 128 A: presupuesto con pollo CON MESA BUFET guardado por navegador.
- 128 B: PDF directo de dos A4 legibles; su enlace abre sin equipo.
  Token falso rechaza; sin token pide login. No controles de edicion/aprobacion.
- 128 D: CRM muestra Fiesta, no Cita; JSON no inventa `followUpDate`.
- 128 C: 121/37 PERSONAS correctas; queda etiqueta del acceso de pendientes.
- Barra: pedir -> preparar -> listo -> entregar; cancelar otro pedido
  devuelve insumos. UI y stock persistidos; codigo relevante sin cambios.
- Sesiones: barman/ajustes sin equipo bloqueados; token de otro invitado rechazado.

## Pendiente unico, sin reencargar lo ya corregido

- Gemini: remate 128 C, "19 invitaciones (37 personas)", no "19 invitados".
- Gemini: orden 129, test de fotocabina puede aprobar un clic SIN foto/tira.
  Es fallo de verificacion, no prueba de fotocabina rota.
- Claude: 114.3 existente, backend prueba para mural/sesiones/subida/entrega.
- Conservar matriz 74 y evidencias 75-78: limites no cubiertos siguen pendientes,
  incluidos originales de 19 presupuestos, proveedores e integraciones reales.
- Gemini: 112 B.1 (AUD01), pendiente previo. No usar billing de GitHub como señal.
- Fotos: ejemplo correcto si falta propia, decision del dueño. No pedirlas otra vez.

No marcar 14/14 por estos casos. Propuestas visuales van aparte y no frenan cierre.
Servidor y pestañas de prueba cerrados. Codex no programa app ni fusiona.
Fusion: `expectedHeadSha` debe coincidir con puerta verde; no `commit -a`
ni cambio de rama mientras corre. No fusionar documentacion sola.
