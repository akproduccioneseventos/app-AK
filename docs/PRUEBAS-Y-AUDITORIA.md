# Qué está probado y qué se auditó

Registro de cómo se controla que la aplicación funcione. **Se actualiza cuando se
agregan pruebas o se audita un área nueva.**

Los números de acá salen de **correr las pruebas**, no de contarlas a mano. Un
conteo a mano dio 1.233 y la corrida real da 1.617: las pruebas que recorren
varios casos cuentan como una sola en el archivo pero se ejecutan muchas veces.

**Última corrida completa: 15 de agosto de 2026.**

---

## Los números

| Qué | Cuánto | Resultado |
|---|---|---|
| Pruebas automáticas | **1.617**, en 243 archivos | Todas pasan |
| Recorridos en navegador | **50**, en 20 archivos | Todos pasan |
| Los recorridos se corren en escritorio **y** en celular | ~104 corridas | Todas pasan |
| Compilación | — | Termina bien |
| Revisor de tipos | — | Sin errores |
| Acentos | — | Sin acentos rotos |

## Cómo se corre todo

| Comando | Qué hace |
|---|---|
| `npm run build` | Compila la aplicación. **Control obligatorio**: una vez pasó el revisor de tipos y el build falló igual, y la app estuvo seis días sin poder publicarse. |
| `npx tsc --noEmit` | Revisor de tipos. |
| `npx jest --silent` | Las 1.617 pruebas automáticas. Tarda unos 15 segundos. |
| `npm run check:acentos` | Que no haya acentos rotos. |
| `npm run test:e2e:production` | Los recorridos en navegador **contra la versión compilada**. |
| `npm run test:rules` | Seguridad de la base de datos. |
| `AK_FOTOS=true node scripts/run-playwright-production.mjs tests/e2e/fotos-de-la-app.spec.ts` | Saca fotos de las pantallas del cliente para mirarlas a ojo. Quedan en `capturas/`. |

**Nunca `npx playwright test` a secas**: levanta el servidor de desarrollo, que
recompila cada ruta y renderiza distinto. Da fallas que no existen. Ya costó una
corrida entera de 27 minutos.

---

## Qué protegen las pruebas automáticas

### Plata y cobros — 27 archivos
Presupuestos, facturas, pagos, planes de pago, señas, recibos del personal,
cupones y comparativa de ganancias. Controlan que las cuentas den bien, que los
totales cierren, y que nada cambie después de cobrado.

Algunas puntuales que cuidan errores que ya pasaron de verdad:
- Una factura pagada no se puede volver a borrador ni cambiarle el monto.
- Un recibo de personal ya pagado no se puede modificar sin dejar rastro.
- La seña del contrato no se asienta sola como efectivo.
- Una solicitud de cambio se decide una sola vez.
- El saldo da igual en las cuatro pantallas donde se muestra.

### Comida — 3 archivos
Que no se guarden cantidades ni costos negativos, y que avise cuando la receta y
el catálogo usan unidades que el sistema no sabe convertir (por ejemplo "tazas"
contra "gramos"), en vez de inventar una conversión y mandar el costo mal a
todos los presupuestos.

### Permisos y quién ve qué — 24 archivos
Sesiones, roles, tokens de proveedor, y que las pantallas públicas no muestren
datos privados. Acá está la prueba que impide que una acción del servidor escriba
sin pedir la sesión primero.

### Pantallas y navegación — 28 archivos
Portal del cliente, portal del invitado, confirmación de asistencia, invitaciones
y el menú. Incluye la que controla que incidentes, aprobaciones y guías de armado
sigan enlazadas desde el menú.

### Entretenimiento — 13 archivos
Fotocabina, espejo mágico, plataforma 360, muro social, aprobación de fotos y
trivia. Que sólo se muestre lo aprobado.

### Organización del evento — 11 archivos
Agenda del personal, tareas, fechas y sincronización de la fiesta.

### Resto — el grueso restante
Formatos, cálculos, integraciones con Google e Instagram, y controles de que el
proyecto no se rompa solo (por ejemplo, que un archivo de servidor no exporte
cosas que no puede).

---

## Qué recorren las pruebas de navegador

Son 20 recorridos que se hacen en Chrome de verdad, en escritorio y en celular,
contra la aplicación compilada:

| Recorrido | Qué hace |
|---|---|
| `public-smoke` | Que las pantallas públicas abran. |
| `simulator-budget-journey` | Un prospecto arma el presupuesto entero y descarga el PDF. |
| `prospecto-simulador` | El otro simulador, de punta a punta. |
| `viaje-invitado` | Desde que recibe la invitación hasta después de la fiesta. |
| `noche-de-fiesta` | Las pantallas del equipo y del invitado durante el evento. |
| `entertainment-stations` | Fotocabina, buzón y las demás estaciones. |
| `muro-subir-foto` | Un invitado sube una foto al muro. |
| `senal-mala` | Cómo se comporta todo cuando se corta internet. |
| `catalogo-publico` | El catálogo de servicios. |
| `impresion-a4` | Que los documentos salgan bien impresos. |
| `tarjetas-whatsapp` | Las tarjetas que se mandan por WhatsApp. |
| `mobile-overflow` | Que nada se desborde en el celular. |
| `layout-baseline` | Que la maquetación no cambie sin querer. |
| `internal-smoke`, `internal-route-inventory`, `internal-dynamic-route-inventory` | Que las pantallas internas abran. |
| `planner-missing-portals` | Portales que falten en el planificador. |
| `public-experience-matrix` | Las combinaciones de acceso público. |
| `sofia-composer` | El asistente. |
| `fotos-de-la-app` | Saca las fotos para revisar la estética a ojo. |

---

## Auditorías hechas y su resultado

| Área | Cuándo | Resultado |
|---|---|---|
| **Las 370 pantallas** | 13 de agosto de 2026 | Auditadas. No quedan zonas sin mirar. |
| **Plata, cobros y permisos** | 15 de agosto de 2026 | **Sin hallazgos.** Presupuestos, facturas, recibos, gastos, cupones, planes de pago y pagos del portal: todos con turnos de guardado, control de permiso y bloqueo después de cobrado. Divisiones controlan el cero, redondeo centralizado. |
| **Comida** | 15 de agosto de 2026 | 5 arreglos, todos hechos: números negativos, aviso de platos sin ingredientes, cantidad cero. |
| **Pantallas del cliente y del invitado** | 15 de agosto de 2026 | **Sin nada roto, nada incómodo, nada feo** en la revisión de código. |
| **Pantallas internas del equipo** | 15 de agosto de 2026 | Nada roto. 4 incomodidades, todas resueltas. |
| **Estética, mirando las pantallas** | 15 de agosto de 2026 | 6 arreglos. Ver abajo. |

### La estética se revisó mirando, no leyendo

Es la única forma de verla. Las pruebas comprueban que las pantallas
**funcionen**; que se **vean bien** es otra cosa. Se sacaron fotos de las
pantallas del cliente y del invitado, en escritorio y en celular, y se miraron
una por una. Lo encontrado:

1. Un globo blanco vacío donde va el logo, en la portada del simulador.
2. En el celular, un botón tapaba el nombre de la empresa en el portal del cliente.
3. "Faltan 0 días" el día de la fiesta, y "Faltan 1 días" la víspera.
4. "Acceso de estacion no autorizado": jerga, sin acento y sin decir qué hacer.
5. La presentación que se le muestra al cliente repetía la misma frase dos veces.
6. El aviso de que no se puede entrar con Google hablaba de cosas técnicas.

**Los arreglos visibles se comprobaron con una foto nueva después de compilar.**
No se dan por hechos.

---

## Lo que NO está probado, dicho de frente

- **No hay prueba automática de que algo se vea lindo.** Eso se mira a ojo, con
  las fotos, y se hace cuando se toca una pantalla que ve el cliente.
- **Los recorridos cubren los caminos principales, no todas las combinaciones.**
  La aplicación tiene unas 370 pantallas. Van a aparecer errores que nadie tocó
  todavía: eso le pasa a todo programa. Cuando aparezcan, se arreglan.
- **Los controles rojos de GitHub no valen**: son por facturación bloqueada. Lo
  que cuenta es lo que se verifica localmente, que es lo que está en esta hoja.
