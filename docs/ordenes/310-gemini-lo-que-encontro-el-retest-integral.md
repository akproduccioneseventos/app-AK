# Orden 310 — Lo que encontró el retest integral del auditor (16/11/2026)

Informe del auditor externo, revisión en vivo del 16/11 (08:38-09:04). Va en **una sola propuesta**, rama nueva desde
`origin/main`. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé". Lo que toca plata, cobros o permisos lo
**listás y no lo arreglás**: Claude lo revisa.

## Bloque 1 — URGENTE, sólo lectura, en la computadora del dueño: ¿dónde están las fiestas?

El auditor vio en Eventos **1 fiesta futura (la DEMO) y 1 archivada (Sheila)**; el 12/11 había 59 (22 futuras, 8 pasadas,
16 archivadas). Pagos sigue mostrando 29 presupuestos y el CRM 12. Claude revisó el código: `dedupeImportedEventCopies`
(`src/lib/events/event-ordering.ts`) sólo esconde la copia `fiesta_doc_*` que tiene gemela `fiesta_verified_*` con la
misma fecha y sin plata; **no explica que falten 57**.

1. **No borres ni restaures nada.** Contá en la base (colección `fiestas` y `historialFiestas`/archivadas) cuántas hay hoy.
2. Contá lo mismo en el respaldo más viejo que haya (Ajustes → Backup; hay 15) y en el del 16/11 03:26.
3. Anotá en tu entrega, en `docs/YA-RESUELTO.md`: cuántas había y cuántas hay, y **la lista de ids que faltan**.
   Si cuando borraste lo de Lorena se fue algo más, decilo tal cual.
4. Si faltan fiestas de verdad, **no las devuelvas vos**: lo decide el dueño con Claude.

## Bloque 2 — La DEMO no se mezcla con la operación (T3, T14, T24)

La DEMO (`estado === 'Demo AK'` o id `demo_*`) sigue apareciendo en Eventos, tareas, alertas "urgente por falta de seña"
y como fiesta con "4 personas sin rol, nómina 13.100 y costos 0".
- Sacarla de: alertas (`src/app/actions/alertas.actions.ts`, `alertas-errores-humanos.ts`), `control-tower.ts`,
  `smart-automations.ts`, `commercial-intelligence.ts`, `multiagent.ts` y de las tareas del día. Usá **una** función
  `esFiestaDemo(f)` nueva en `src/lib/events/event-ordering.ts` y llamala en todos esos lugares.
- En Eventos se ve aparte, con el rótulo "Fiesta de muestra", nunca como urgente.
- La DEMO misma tiene que ser coherente entre vistas (planificador, portal, configuración de estaciones y tablero):
  si el tablero dice "7/7 Todo en orden" y configuración "8 módulos al 49%", uno de los dos lee otra cosa. **Que los dos
  lean del mismo cálculo**.

## Bloque 3 — Registros PRUEBA del auditor (T12)

Borrá, desde la app y con la sesión del dueño, los prospectos y presupuestos "PRUEBA BORDE TRES" y "PRUEBA RONDA VIVO"
(y cualquier otro cuyo nombre empiece con "PRUEBA"). Sólo esos. Anotá cuántos borraste.

## Bloque 4 — Conteos del catálogo escritos a mano (T17)

El catálogo anuncia "25 entradas" y hay 22; "19 principales" y hay 22. Buscá dónde se escriben esos números
(presentación/catálogo de catering y sus diapositivas) y que **se calculen** de la lista real.

## Bloque 5 — Textos internos que ve el cliente (T21, T25)

- "Firebase" en los recuerdos post-fiesta del cliente y la nota de venta interna en la pantalla LED: fuera.
- "AK está preparando esta sección" que ve el invitado: cambiar por un texto que diga qué va a encontrar, o esconder la
  sección vacía.

## Bloque 6 — Documentos (prioridad 5 del informe)

- Contrato real (ejemplo Virginia Reina): faltan cédula, domicilio y teléfono, y dos hitos de pago salen sin fecha.
  Que el contrato tome esos datos del cliente/presupuesto y, si faltan, lo diga en rojo antes de imprimir.
- "Guardar PDF" del simulador abre una pestaña vacía: tiene que bajar el archivo.
- Fin de la fiesta: el calendario termina 02:00 y el portal 05:00. Las dos tienen que salir de `horaFin` de la fiesta.

## Bloque 7 — Respaldos (T6)

El respaldo falla por tiempo (44 s leyendo presupuestos) y el aviso ">24 h sin copia" sale aunque la última buena es de
5 h antes. Leer presupuestos en partes y que el aviso mire la fecha de la última copia buena.

## Bloque 8 — Lo que el auditor todavía ve para borrar (T15)

"Eliminar" sigue visible para el auditor en recetas y personal. Usá el mismo control de la orden 308.

## Barrido en toda la app

Hecho por Claude el 16/11:
- Conteos de menú escritos a mano en pantallas: no aparecieron con número fijo en `src/app` ni `src/components`; están en
  los datos del catálogo → bloque 4.
- La DEMO sin filtrar: 7 archivos de acciones que arman alertas o tareas no la excluyen (bloque 2, lista exacta).
- Fin de la fiesta: `05:00` fijo en `mission-control.ts`, `demo-fiesta-factory.ts` y `fiesta-defaults.ts`; el calendario
  arma su propio fin en `src/lib/google-calendar-sync.ts` → bloque 6.

```comprobar
usa: esFiestaDemo en src/app/actions/alertas.actions.ts
usa: esFiestaDemo en src/app/actions/control-tower.ts
usa: esFiestaDemo en src/app/actions/smart-automations.ts
usa: horaFin en src/lib/google-calendar-sync.ts
```
