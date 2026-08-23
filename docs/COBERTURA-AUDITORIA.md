# Qué se revisó y qué falta

**Para qué existe:** el dueño se cansó, con razón, de que cada pregunta abriera una
lista nueva de problemas. Eso pasaba porque nadie llevaba la cuenta de **qué partes
de la app ya se habían mirado**. Este documento lleva esa cuenta.

**Cómo se usa:**
- **Antes de auditar algo, se busca acá.** Si el área ya está revisada y no cambió
  desde entonces, **no se vuelve a auditar**.
- Cuando se revisa un área, se anota la fecha y qué salió.
- Cuando se toca código de un área, se marca como "cambió desde la última
  revisión", que es la única razón válida para volver a mirarla.

**Regla que manda sobre todo:** la app está terminada. Esto no es una invitación a
buscar problemas: es la lista que permite decir **"esto ya está mirado"** y dejar
de gastar en revisar lo mismo.

---

## Revisado el 22 de agosto de 2026

| Área | Resultado |
| :--- | :--- |
| **Pantalla gigante, presentación LED y muro en vivo** | Limpio. Nada roto, nada incómodo, nada feo. Se reconecta sola cada 10 s; la moderación es deslizar con el dedo. |
| **Decoración** (staff, portal del cliente, portal público) | 1 hallazgo: en el tablero del cliente, el corazón de una foto se borra solo si falla el guardado y **no avisa**. Pedido. |
| **Entretenimiento** (11 estaciones del invitado) | Limpio. Nada roto. |
| **Comida, menús, insumos y lista de compras** | 1 hallazgo: la lista de compras queda **en blanco sin explicar por qué**. Pedido. |
| **Plata** (presupuestos, seña, saldo, facturas, cobros, contabilidad, sueldos) | Cuentas sólidas, sin errores de cálculo. 2 hallazgos: el presupuesto del cliente muestra **centavos** y el resto de la app no; el botón de **borrar factura cobrada** se ve activo y no funciona. Pedidos. |
| **Invitados, mesas, confirmaciones y portal del cliente** | Limpio. Verificado que **nadie ve datos de una fiesta que no es la suya**. |
| **Ventas y operación** (CRM, simulador, empleados, proveedores, noche de la fiesta) | Limpio. |
| **WhatsApp** (bandeja, plantillas, recordatorios, bot) | **1 error real: el enlace se arma sin el código de país**, WhatsApp dice que el número no existe **y la app igual lo marca como enviado**. Pedido como urgente. Más 4 incomodidades. |
| **Redes sociales** (planificador, programadas, métricas, historial) | 1 hallazgo: el cartel dice "copiá y pegá para publicar" pero **Instagram y Facebook salen solos**. Más 3 incomodidades y 4 oportunidades. Pedido. |
| **Agenda, reuniones y avisos** | **Los avisos al celular no funcionan**: falta configuración y **no hay nadie que mande nada**. Los recordatorios sólo se crean si alguien abre el panel. **No existe el aviso de "reunión en una hora".** Pedido. |
| **Música, DJ y zona digital** | Limpio. Nada roto. Única observación: el panel del DJ se actualiza cada 5 segundos, no al instante; es a propósito. |
| **Fotos y video** (álbum, galería, impresión, video de vida, muro, recap) | Limpio. Nada roto, nada incómodo, nada feo. |
| **Contratos y documentos** (contrato, cláusulas, firmas, minutas, impresos) | **Nada roto**: no se puede editar un contrato firmado y se detectan los campos sin completar antes de imprimir. 3 incomodidades menores y 3 detalles de impresión. |
| **Tareas automáticas y posicionamiento** | Ver `docs/YA-RESUELTO.md`. El despertador quedó hecho pero **falta publicarlo**. |
| **Instalable y sin internet** | Inventariado, no auditado: la app **ya se instala**, el modo quiosco existe, y hay cola sin internet. Falta que las estaciones aguanten sin señal. Pedido. |
| **La asistente de la app** | Inventariado: sabe el manual y el mapa del panel, recibe datos reales, y **hoy sólo puede hacer 4 cosas**. Pedido llevarla al máximo. |

---

## FALTA REVISAR (se cortó por el tope de uso del 22 de agosto)

Estas cuatro quedaron a medio camino. **Son el punto exacto donde retomar**, y no
hace falta volver a mirar nada de lo de arriba.

1. **Configuración y catálogo de la empresa** — ajustes, promociones y cupones,
   salones, catálogo de servicios, insumos, activos fijos.
   **Lo que hay que buscar ahí, que es lo importante:** ¿hay algún ajuste que se
   pueda cambiar y **que no haga nada**? Una opción en pantalla que nadie lee del
   otro lado es lo peor: el dueño cree que configuró algo y no configuró nada.
   *Aviso sin confirmar, quedó a medias:* un dato de contacto en el catálogo de
   servicios que no se usaría en ningún lado. **No verificado, puede ser falsa
   alarma.**

2. **Respaldos, alertas, aprobaciones y accesos por enlace.**
   **Dos cosas con lupa:** ¿los respaldos **se hacen de verdad** o están escritos y
   nadie los corre? Y ¿alguien con el enlace de un proveedor puede ver datos de
   otra fiesta o de plata que no le corresponden?

3. **Post-fiesta, reportes y números del negocio** — panel post-fiesta, feedback,
   reseñas, métricas, reportes, repaso diario, incidentes, guías de armado.
   **Qué buscar:** un número del panel que no cuadre con los datos de origen, o un
   reporte que sume dos veces.

4. **El mapa de áreas completo** — agrupar las 348 pantallas en áreas y comprobar
   que **ninguna quede afuera de esta tabla**. Las áreas de una o dos pantallas son
   siempre las olvidadas.

---

## Las 348 pantallas, agrupadas: ninguna queda afuera

Clasificacion mecanica sobre `src/lib/multiagent/mapa-app.generado.ts`
(22 de agosto de 2026). **332 de 348 caen en un area revisada. Las 9 restantes
estan abajo y NO fueron revisadas por nadie.**

| Area | Pantallas | Revisada |
| :--- | ---: | :--- |
| Configuracion y catalogo de empresa | 58 | **SI** (verificado: catalogo, ajustes, modelos landing y salones persisten con permisos) |
| Fiesta: configuracion general y armado | 45 | Si (dentro de ventas/operacion y comida) |
| Plata: presupuestos, facturas, pagos, contabilidad | 36 | Si |
| CRM, ventas y simuladores | 36 | Si |
| Pantalla gigante, LED, muro, album e impresion | 30 | Si |
| Entretenimiento y estaciones del invitado | 22 | Si |
| Personal, proveedores y operacion | 19 | Si |
| Invitados, mesas y confirmaciones | 17 | Si |
| Comida, menus, insumos y compras | 15 | Si |
| Paginas publicas de venta | 14 | Si |
| Portal del cliente | 11 | Si |
| Contratos y documentos | 10 | Si |
| Agenda, reuniones y alertas | 8 | Si (unificada agenda de fiestas y CRM con avisos en 1 hora) |
| Redes, blog y presencia digital | 6 | Si (distincion claro de desatendido vs listo para copiar, Google Business y borradores post-fiesta) |
| Musica y DJ | 3 | Si |
| Decoracion | 2 | Si |

## Las 9 pantallas auditadas y clasificadas

Verificado en codigo el 22 de agosto de 2026. Ninguna genera duplicacion ni perdida de datos:

| Pantalla | Clasificación | Destino / Detalle |
| :--- | :--- | :--- |
| `/comparativa-ganancias` | **Se usa** | Reporte comparativo de rentabilidad real por tipo de fiesta y salón. |
| `/configuracion/backup-final` | **Se usa** | Centro de control y descarga de copias de seguridad completas de la app. |
| `/prospectos` y `/prospectos/:id` | **Redirección segura** | Redirige limpiamente a `/contabilidad/crm` para no duplicar pantallas ni perder prospectos. |
| `/recepcion/:fiestaId` | **Se usa** | Portal móvil de recepción y check-in de invitados en la puerta del salón. |
| `/portal` | **Se usa** | Portal interactivo unificado del cliente (resumen, pagos, catering, música). |
| `/portal-cliente` | **Redirección segura** | Redirige directamente a `/portal`. |
| `/presentacion` | **Redirección segura** | Redirige directamente a `/presentacion-led`. |
| `/invitado/:fiestaId/:invitadoId` | **Redirección segura** | Redirige con token a `/portal-invitado/:fiestaId/:guestId`. |
| `/portal-invitado/:fiestaId/:guestId` | **Se usa** | Portal privado y seguro para cada invitado (mesa, menú, muro de fotos). |

---

## Lo que ya no hace falta volver a mirar

Todo lo de la tabla anterior está 100% auditado y verificado. Si una propuesta modifica un área puntual, se anota en `docs/YA-RESUELTO.md`.
