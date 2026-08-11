# Traspaso para Gemini, Claude y otros agentes

Ultima revision: 11 de agosto de 2026.

Trabajar sobre `release/final-11ago`, PR abierta `#942`. La PR #941 ya fue
fusionada. Antes de investigar, leer:

1. `ESTADO-ACTUAL.md`
2. `docs/YA-RESUELTO.md`
3. El diff de la PR #942 contra `main`

## No repetir

- No reabrir arreglos marcados como hechos en esos documentos.
- No tratar el rojo de GitHub Actions como error de codigo: los jobs no arrancan
  por facturacion y el dueno no agregara tarjeta.
- No declarar correctos los 19 eventos usando JSON locales vacios.
- No inventar publicaciones de Instagram/Facebook, pagos, correos ni resultados
  de proveedores que no hayan respondido realmente.
- No crear otra PR para la misma auditoria. Los hallazgos reales van a la #942.

## Trabajo activo

La matriz local de lanzamiento ya fue ejecutada sobre el candidato de la #942:
build productivo, E2E interno, Firebase Emulator, autenticacion, simulador,
experiencias publicas, entretenimiento, visual PC/celular y rendimiento
representativo. No repetirla si el SHA no cambia.

Quedan solo comprobaciones que requieren el entorno real: los 19 eventos en
Firebase, respuesta efectiva de Gmail/Instagram/Mercado Pago/Gemini y hardware
del salon. Reportar aprobaciones en una linea y detallar solamente fallos
reproducidos, fricciones y mejoras de valor.
