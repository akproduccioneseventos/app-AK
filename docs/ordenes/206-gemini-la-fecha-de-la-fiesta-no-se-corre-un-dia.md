# Orden 206 - La fecha de la fiesta no se corre un día en las pantallas

## Contexto
Al formatear fechas de eventos cargadas como fechas civiles simples (ej: `2027-08-08`) usando `new Date(fecha).toLocaleDateString(...)` sin considerar la zona horaria de Uruguay (UTC-3), la fecha se interpretaba como medianoche en UTC (00:00:00Z), mostrándose a las 21:00 hs del día anterior (7 de agosto en vez del 8 de agosto).

## Alcance y corrección
Se realizó el barrido sobre las pantallas de visualización de eventos y presupuestos:
- `src/app/(app)/eventos/page.tsx`: Gestor de fiestas muestra la fecha exacta civil sin corrimiento.
- `src/app/control-tower/page.tsx`: Visualización de próximo evento con `formatearFechaEvento`.
- `src/app/simulador-de-presupuesto/page.tsx`: Lista de presupuestos anteriores asociados al teléfono.
- `src/app/video-vida/page.tsx`: Fichas de fiestas en el hub de Video de Vida.
- `src/components/decoracion/DecoMuestrario.tsx`: Muestrario de paletas y estilos de fiestas.
- `src/components/presupuestos/paso-4-resumen.tsx`: Mensaje de WhatsApp y vista del presupuesto.
- `src/components/crm/BookingConfirmationDialog.tsx`: Diálogo de conversión de lead y contratación.
- `src/components/presupuestos/presupuesto-card.tsx`: Tarjetas de presupuestos en la lista general.

Se preservaron intactos los cálculos de ajuste anual de precios y no se afectaron contratos ni recibos.

```comprobar
archivo: src/app/(app)/eventos/page.tsx
usa: formatearFechaEvento( en src/app/(app)/eventos/page.tsx
usa: formatearFechaEvento( en src/app/control-tower/page.tsx
usa: formatearFechaEvento( en src/app/simulador-de-presupuesto/page.tsx
usa: formatearFechaEvento( en src/app/video-vida/page.tsx
prueba: src/__tests__/orden-206-la-fecha-no-se-corre-un-dia.test.ts
```
