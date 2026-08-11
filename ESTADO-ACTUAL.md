# Acá quedé

Última actualización: 11 de agosto de 2026.

Rama de trabajo: `release/final-11ago`, nacida del `main` que ya incluye la PR
`#940`. La propuesta final todavía no estaba creada al escribir este traspaso.

## Qué se corrigió en esta tanda

- Portal LED: menú adulto, entradas, menú infantil, total por método de cálculo y
  traspaso completo al presupuesto manual.
- Auditoría: control financiero cruzado de presupuestos, pagos, facturas y fiestas.
- Seguridad: operador limitado a fiestas asignadas; aprobaciones, agenda social,
  Google Workspace, Mercado Pago y cron del blog protegidos en el servidor.
- Muro social: moderación encendida por defecto, incluido contenido generado por
  estaciones de entretenimiento.
- Rendimiento: la portada pública vuelve a ISR de cinco minutos y deja de
  recalcular todas las fuentes por visitante.

El detalle y el motivo de cada decisión están en `docs/YA-RESUELTO.md`.

## Evidencia disponible

- Candidato congelado: TypeScript sin errores, lint de archivos tocados sin
  errores ni advertencias y 143/143 pruebas focalizadas en 13 suites aprobadas.
- Graphify actualizado: 7.800 nodos, 28.661 relaciones y 376 comunidades.
- Tandas anteriores reutilizadas: 99/99, 114/114, 18/18 y 104/104.
- Suite Jest completa: intento superior a diez minutos sin resumen; no contarla
  como aprobada.
- Build de producción: intento de treinta minutos sin resumen; no contar como
  aprobado. E2E de producción pendiente por esa misma razón.
- Los 19 eventos reales no existen en el respaldo JSON local. Ejecutar el botón
  `Revisar ahora` de Auditoría dentro de la app conectada a Firebase.

## No repetir

No volver a separar el catálogo maestro de catering de los ítems que entran al
presupuesto. No declarar saldos reales correctos usando archivos locales vacíos.
No marcar una publicación como enviada a Instagram o Facebook sin respuesta real
del proveedor.
