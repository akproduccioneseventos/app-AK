# En curso: auditoria 71 y orden 122

6 de octubre de 2026. Main auditado: `e52c07839563115236652229d73ac5ebf2e4e551`
(merge 1258). Rama documental: `codex/auditoria-integral-20261006`.
No fusionar documentos solos: incorporar a la siguiente tanda de codigo.

## Comprobado por Codex

- Main: 603 suites / 3490 unitarias aprobadas; 56 focalizadas incluidas, no sumadas.
- Las seis regresiones de orden 120 pasan sobre este SHA; no reabrirlas.
- PR1259 sigue abierta: `feat/orden-117-video-invitados`, `f836c128cfad861a55a2352782f18c805b55e13a`.
- Tanda: 4 suites / 27 unitarias aprobadas. No equivale a build/E2E/voz/camara reales.
- Sondas reproducen cuatro casos en main y en archivos sin cambios de la tanda:
  CAMPO01/02: guardado general permite cuotas/contrato a operador o cliente;
  COMPRA01: compras viejas revierten pago concurrente;
  RED03: importaciones concurrentes pierden un video del objeto de galeria.
- Evidencia/limites: `docs/evidencias/71-auditoria-integral-y-retest.md`,
  `71-resultados/manifest.json`, `71-matriz-integral.md` (14 areas).
- Alerta del ayudante sobre timer de totem descartada: solo rige sin video.
- No generalizar RED03 a colecciones; no cambiar permisos actuales de costos.

## Sigue

- Orden 122: Claude dinero/permisos/comida; Gemini RED03; Claude compila.
- Codex retesta SOLO lo corregido en el nuevo SHA, reutilizando pruebas vigentes.
- Ordenes 117/121 y AUD01 siguen con sus responsables, sin duplicarlas.
- Orden 114: falta entorno compilado estable con backend de prueba para recorridos.
- Computer Use detuvo el navegador por no poder identificar URL con certeza;
  recorrido no ejecutado, no es defecto de AK ni falta de permiso del dueno.
- Pendientes de aceptacion: recorridos completos, proveedores externos, 19 originales,
  catalogo real, despliegue del SHA y hardware al final. No hay certificado integral.

No se programo app, compilo ni fusiono. No investigar facturacion de GitHub.
No tocar/revertir JSON de notificaciones escritos por pruebas. Fusion del dueno;
compilacion y puerta de Claude, con `expectedHeadSha` del resultado verde.
