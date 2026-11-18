# Orden 319 — Auditoría funcional integral del auditor (17/11/2026)

Informe "Auditoría funcional integral" (34 entradas nuevas). Lo probó sobre la versión de las 17:37 del 17/11: **F1, F3 y F8
ya estaban arreglados en la publicación siguiente** (orden 318). Va en la **misma propuesta** que tus órdenes abiertas, al
final. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé". F4, F5, F9, F10, F11, O1, O4, O9, O10, O13 y O14 ya están
pedidos en la orden 318: no se repiten acá.

## Lo que ya arregló Claude (NO rehacer)

- **N1:** Ajustes → IA decía "Modo operativo: desactivado" y el asistente escribía. Ahora dice lo mismo que hace
  (`assistant-operational-status.ts`).
- **N26:** la lista de compras suma el menú asignado a la fiesta (`catering/lista-compras/page.tsx`).
- **N32:** "Propuestas activas" del CRM deja afuera los presupuestos archivados (`crm.ts`).
- **O15:** el costo de cada servicio copiado del presupuesto es el costo base del catálogo (`valorUnitarioEstimado`), no el
  precio de venta; sin costo cargado queda en $0 con el aviso.

## Bloque 1 — N27: editar un empleado no se guarda (MEDIR PRIMERO)

`/empleados/[id]/editar` → cambiar nombre o teléfono → "Guardar Cambios" → al recargar vuelve el valor viejo, sin error.
La pantalla manda `id` (`editar/page.tsx:126`) y `saveEmpleado` (`src/app/actions/empleados.ts:~52`) escribe con
`mutateDataItem`. **No se sabe la causa:** reproducilo con el emulador (`tests/firebase/`) y mirá qué queda en la base y qué
devuelve la lectura (`readDataConDetalle`, copia local `refreshCollectionFallback` en `src/lib/data-service.ts:~284`). Arreglá
la causa medida y dejá la prueba de ida y vuelta: guardar, volver a leer de la base, el nombre nuevo está.

## Bloque 2 — Fallos que no hacen lo que dicen

- **N9 Salones:** `/empresa/salones` → Agregar → Guardar cierra sin aviso y no crea (3 de 3). Medí y arreglá; cartel de éxito o motivo.
- **N4 Base de conocimiento** (Ajustes → IA): un `.txt` no hace nada y un `.pdf` se registra dos veces.
- **N7 Incidentes:** uno resuelto desaparece de todas las vistas. Que quede en "Resueltos".
- **N19 Portal de proveedores:** "Llegada estimada" es obligatoria y no está marcada; sin hora no pasa nada visible. Marcarla y avisar.
- **N20 Check-in:** poder deshacer un ingreso marcado por error (`src/app/recepcion/[fiestaId]/RecepcionClient.tsx:59`).
- **N18 Accesos de proveedor:** botón para revocar antes de que venzan.
- **N31 Rifa:** al recargar el muro a mitad del sorteo, el panel tiene que poder retirar la ruleta de la pantalla pública.
- **N33/N34 Guías (playbooks):** los "documentos requeridos" y las "compras sugeridas" que crea una guía se muestran con acciones
  (marcar hecho/comprado, borrar) y las compras pasan a la lista de compras.
- **N29:** "Cerrar fiesta con retroalimentación" → renombrar "Generar balance de cierre" (no cierra la fiesta).
- **N11:** a 1280x720 la barra fija tapa "Crear Factura" y "Registrar Nuevo Pago": dejar espacio abajo para la barra.
- **N3:** lo del despertador ya está en la orden 278 (desplegarlo). Mientras no corra, que la pantalla no diga "cada 15 minutos".

## Bloque 3 — Observaciones que sí se arreglan

N5 ("null" bajo el perfil del widget), N13 (saludo "Buen día" a las 19:22: usar la hora de Uruguay), N14 (el muro pregunta
"¿cuándo cumplís tus quince?" en un Cumpleaños: el texto según el tipo de fiesta), N16 (invitados importados nacen
"Pendiente", no "Confirmado"), N17 (botones de ícono con nombre accesible y ayuda en invitados, tareas y CRM), N21 (agentes sin
novedades: "Sin novedades", no "Aviso"), N22 (una sola zona horaria, Uruguay, en todos los paneles), N24 ("Tasa de conversión"
dice "sobre presupuestos cerrados"), N25 ("Consultar disponibilidad" en una línea y el logo con su monograma), N28 (el diálogo
de borrar tarea muestra el nombre), O6 (singular y plural: "1 mesa", "1 ítem"; lista en el informe sección 5).

**No se tocan** (decisión o fuera de alcance): N2 (conexiones, las hace el dueño), N6, N12 (guardar el avance del simulador es a
propósito), N15 (sin confirmar), N23 (control correcto), N30.

## Qué tiene que comprobar la prueba

- `tests/firebase/editar-empleado-se-guarda.test.ts`: guardar la edición, volver a leer de la base, el cambio está.
- `tests/e2e/el-salon-nuevo-se-crea.spec.ts`: alta de salón → aparece en la lista o muestra el motivo.
- `src/__tests__/el-check-in-se-puede-deshacer.test.ts`.

## Barrido en toda la app

Hecho por Claude el 17/11:
- **Pregunta 176 (un estado en pantalla que contradice la regla que aplica el código):** `process.env.*_ENABLED` leído con
  `=== 'true'` en un lado y `!== 'false'` en otro: sólo el asistente (arreglado).
- **Pregunta 177 (una pantalla que promete sumar algo de otra y no lo lee):** "se sumarán automáticamente" / "se agregan solos"
  en `src/app`: la lista de compras (arreglado); las compras de las guías (bloque 2, N34).
- **Pregunta 178 (un total que no excluye lo archivado):** `archived` en los totales de `crm.ts`, `dashboard.ts`, `analytics.ts`
  y `contabilidad`: sólo "Propuestas activas" del CRM (arreglado); el resto ya lo filtraba.
- **Pregunta 179 (un guardado que dice listo y al recargar no está):** edición de empleados (bloque 1) y salones (bloque 2).

```comprobar
prueba: tests/firebase/editar-empleado-se-guarda.test.ts
prueba: tests/e2e/el-salon-nuevo-se-crea.spec.ts
prueba: src/__tests__/el-check-in-se-puede-deshacer.test.ts
usa: Generar balance de cierre en src/app/(app)/multiagente/acciones/page.tsx
```
