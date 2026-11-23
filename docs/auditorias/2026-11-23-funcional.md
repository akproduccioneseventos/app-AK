# Auditoría funcional del 23/11/2026 (informe externo, 40 páginas)

Probado en la app publicada con una fiesta de prueba propia (`fiesta_4d4840f2-b710-407b-bef9-a8491af2751f`) y la sesión de
auditor. 15 hallazgos; Claude ubicó cada uno en el código y los pasó a la orden 338.

| Hallazgo | Qué pasa | Orden 338 |
|---|---|---|
| H01 | Un menú de prueba se ve en la presentación LED pública; borrarlo falla y quitar un plato se revierte | Bloque 6.2-6.4 |
| H02 | Video de Vida usa la fiesta de muestra en vez de la de la dirección | Bloque 1.1 |
| H03 | El PDF del presupuesto manual sale cortado | Bloque 4.1 |
| H04 | "Ver galería" en la presentación LED borra la propuesta | Bloque 4.2 |
| H05 | "Plan de Pagos" abre un borrador viejo | Bloque 4.3 |
| H06 | La carta de tragos dice "Guardado" y al recargar no está; cancelar deja un trago | Bloque 2.1-2.2 |
| H07 | La lista de carga revierte tildes y dice "sincronizadas" aunque falló | Bloque 2.3 |
| H08 | Alertas de Mi Día se cae (opción con valor vacío) | Bloque 3.1 |
| H09 | Clientes dice "no se pudieron cargar" | Bloque 3.2 |
| H10 | Finanzas: consolidación falla con un mensaje genérico, tablero en cero, catering en cero | Bloque 5 |
| H11 | Control en vivo arma enlaces con `undefined` | Bloque 1.2 |
| H12 | Mi Mesa arma un enlace al hub con la credencial vacía | Bloque 6.1 |
| H13 | La fecha aparece un día antes al pasar del LED al manual | Bloque 4.4 |
| H14 | El manual pone 10% de descuento al transferir | **Decisión del dueño**: es la promoción; queda, y se muestra la línea (4.3) |
| H15 | La biblioteca global del muro falla | Bloque 3.3 |

Señales: `{SENIA}` sin reemplazar en el LED, gas 6.650 unidades en la lista de compras, extra manual de personal que manda
correos, botones sólo con ícono (bloques 5.4 y 7).

**Datos de prueba en producción:** el auditor dejó registros con "PRUEBA" en el nombre (fiesta, presupuestos #26 y #27,
cliente, menú, servicio, empleado, insumo, activo, salón y proveedor). No se borran en masa: el menú de prueba deja de verse
en público con el bloque 6.2; el resto lo borra el dueño cuando quiera, desde cada pantalla.

Preguntas nuevas: 218 a 226 (`docs/COMO-AUDITAR.md`), con escaneo la 218 y de la 220 a la 224.
