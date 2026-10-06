# En curso: auditoria 72, ordenes 122 y 123

6/10/2026. Codigo main: e52c07839563115236652229d73ac5ebf2e4e551 (1258).
Rama documental: codex/auditoria-integral-20261006; no fusionar docs solos.
PR1259: feat/orden-117-video-invitados, 7c96e11427c673d72638ac593bcd783915955aa8.
Ese HEAD avanzo durante la auditoria; se contrasto antes de emitir 123.

## Evidencia vigente

- Main: reutilizar 71, 603 suites / 3490 unitarias; 56 incluidas. No repetir.
- Las seis regresiones de 120 pasan. No reabrirlas ni los arreglos de 116.
- Ultima tanda: seis suites / 32 unitarias pasan. No sumarlas a las 27 previas.
- 71 / orden 122: CAMPO01/02, COMPRA01, RED03; no corregidos en esta sesion.
- 72 / orden 123: cuatro casos nuevos reproducidos en main y ultima tanda:
  cambiar trago omite token; UI ofrece botones rechazados en preparando;
  reintento por ID conocido devuelve pedido sin validar token; plantilla pierde escala.
- Decision del dueno sobre cambiar/cancelar preparando consultada y PENDIENTE.
- Siete casos del helper de acceso del invitado por SHA pasan; NO HTTP/RSVP/medios.
- Evidencia, scopes y hashes: docs/evidencias/72-recorridos-y-casos-nuevos.md
  y 72-resultados/manifest.json. Matriz 14 areas en 71, ampliada por 72.

## Navegador y limites

- CUA publico AHORA disponible: inicio, menu movil, galeria/FAQ, Club, demos,
  blog y simulador hasta avisos de datos vacios. No guardar leads reales al probar.
- El footer desde Club navega bien; no elevar hashes a bug sin click/destino.
- Articulo aun usa foto de fondo: observacion historica 66, no orden nueva.
- SHA del despliegue no demostrado; no transferir UX a main por suposicion.
- Backend privado local sin servidor compilado estable: orden 114 pendiente.
- No app compilada por Codex, no E2E completo/proveedores/19 originales/hardware.

## Sigue

- Claude: acciones de barra/permisos y 122 dinero/comida; Gemini UI/salon/RED03.
- Una tanda de codigo con documentos, no una PR por caso. Dueno fusiona.
- Claude compila y registra SHA/entorno/logs; Codex retesta solo deltas.
- 117/121/AUD01 mantienen responsables. No duplicar ni bloquear por GitHub billing.
- No tocar/revertir JSON runtime ni .serena local. No certificado cero errores.
