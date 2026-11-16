# Orden 311 — Nuevo escaneo del auditor (16/11/2026, tarde)

Informe del auditor externo "Nuevo escaneo de la app AK". Va en la **misma propuesta** que lo que falta de la 310, rama
nueva desde `origin/main`. Leé `docs/ANTES-DE-ENTREGAR.md` antes de decir "terminé".

## Bloque 1 — Datos personales en el repositorio público (N-01) — lo revisa Claude

El repositorio es público y el dueño decidió dejarlo así hasta terminar la app. Entonces **los datos reales no pueden
estar en los archivos del repositorio**:
- `src/data/empleados.json` (14 personas con `cedula` y `fechaNacimiento`), `src/data/accesos-personal.json`,
  `src/data/personal-recibos.json`, `src/data/historial-fiestas.json`, `src/data/fiestas-historicas.json` y
  `src/data/social-chat/*.json`.
- Primero **comprobá en la base** (en la computadora del dueño) que esos datos están allá. Si están, en el repositorio
  dejá versiones **de muestra**, con nombres inventados y sin cédula ni fecha de nacimiento, y agregá los originales a
  `.gitignore`. Si algún dato **sólo** está en el archivo, copialo a la base antes, y anotalo.
- Prueba: `src/__tests__/el-repositorio-no-lleva-datos-personales.test.ts` falla si un archivo de `src/data` o `data`
  que está en git tiene un campo `cedula`, `ci`, `documento`, `telefono` o `fechaNacimiento` con valor.

## Bloque 2 — El presupuesto manual avanza con -1 adultos (N-02)

`src/app/(app)/presupuestos/nuevo/crear/page.tsx`: adultos, adolescentes y niños no aceptan negativos ni decimales; con un
valor inválido sale el error junto al campo y **"Siguiente" no avanza**. El servidor (`src/app/actions/presupuestos.ts`,
al crear o guardar) también rechaza cantidades negativas. Prueba de navegador: escribir -1, tocar Siguiente, sigue en el
paso 1 con el error a la vista.

## Bloque 3 — Mi Día adelanta tres horas (N-03)

`src/app/(app)/mi-dia/page.tsx` línea ~268 formatea la hora con `toLocaleTimeString('es-UY', …)` **sin zona**: en el
servidor sale la hora de Greenwich (15:57 en vez de 12:57). Agregar `timeZone: 'America/Montevideo'`. Barrido: toda
llamada a `toLocaleTimeString`/`toLocaleString`/`toLocaleDateString` en pantallas que se arman en el servidor (sin
`'use client'`) lleva `timeZone: 'America/Montevideo'`. Prueba: Mi Día y Agentes muestran la misma hora para la misma
corrida.

## Bloque 4 — Las guías se pueden revisar enteras antes de aplicar (N-04, A-01)

`src/app/(app)/playbooks/page.tsx` línea ~231 corta en 8 tareas con "...y N más" sin forma de verlas. Botón "Ver todas"
que despliega las 12, y el diálogo de Aplicar muestra la lista completa con sus fechas. A 390 px y 320 px: título entero,
descripción legible y botones apilados.

## Bloque 5 — "Política de Señas y Reservas" lleva a promociones (N-05)

`src/app/(app)/settings/page.tsx` línea ~112 apunta a `/settings/promos`. La seña se cambia en Configuración del
Simulador (`/settings/budget-display`): cambiá el `href` a esa pantalla. **No cambies el monto ni ninguna regla de seña.**

## Bloque 6 — Conteos escritos a mano

`settings/agentes-autonomos/page.tsx` ("Los 5 Agentes" con 7 tarjetas) y `settings/sincronizaciones/page.tsx` ("13
integraciones" con 14): que el número salga de contar la lista.

## Bloque 7 — Video de Vida: 50 o 300 fotos (A-02)

La configuración dice "máximo 50" y el editor anuncia "300+". Buscá los dos textos y que lean del mismo límite.

## Bloque 8 — La DEMO coherente (A-03, A-04)

Va con el bloque 2 de la 310: "82 adultos de 0", preparación 85% con catering sin menú, y la reunión final después de la
fiesta. La DEMO tiene que tener una fecha, un menú de muestra y fechas de agenda antes de la fiesta.

## Barrido en toda la app

Hecho por Claude el 16/11:
- Horas sin zona: 141 llamadas a `toLocale*` sin `timeZone` en `src/app` y `src/components`; las que importan son las de
  pantallas del servidor → bloque 3.
- Conteos escritos a mano: los dos de Ajustes → bloque 6 (más los del catálogo, orden 310 bloque 4).
- Enlaces de Ajustes que dicen una cosa y abren otra: sólo el de Señas → bloque 5.
- Datos personales en archivos del repositorio: 6 archivos → bloque 1.

```comprobar
archivo: src/__tests__/el-repositorio-no-lleva-datos-personales.test.ts
usa: America/Montevideo en src/app/(app)/mi-dia/page.tsx
usa: /settings/budget-display en src/app/(app)/settings/page.tsx
prueba: src/__tests__/el-repositorio-no-lleva-datos-personales.test.ts
```
