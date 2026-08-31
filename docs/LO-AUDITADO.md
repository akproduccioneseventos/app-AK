# Lo auditado, y CÓMO

**Idea del dueño, 31 de agosto de 2026.** Sus palabras: *"debería haber una lista interna de lo
auditado y de qué forma, para ir descontando; y si volvemos a ver otro método, se sabe cómo se
auditó antes."*

## Por qué existe

Esta lista dice qué se auditó, con qué método y qué día. Lo que ya
está mirado **con el método más fuerte se descuenta** y no se vuelve a mirar.

## Los métodos, del más flojo al más fuerte

| # | Método | Qué prueba | Qué NO ve |
|---|---|---|---|
| 1 | **Leído por un ayudante** | Que el código exista y parezca correcto | Casi todo lo que falló este año. No ve si funciona |
| 2 | **Revisor de tipos y compilación** | Que encaje y se pueda publicar | No ve si hace algo |
| 3 | **Prueba de las de siempre** (jest) | Que una función devuelva lo esperado | No ve la pantalla |
| 4 | **Prueba de navegador que abre la pantalla** | Que dibuje, que tenga botones, que no muestre basura | No ve si el ajuste se respeta |
| 5 | **Prueba de navegador que comprueba el RESULTADO** | Que lo que se configura **se vea**, que la captura salga | — |
| 6 | **Mirado en pantalla por una persona** (foto de pantalla) | Cómo se ve de verdad: colores, tamaños, si encandila | No corre solo |

**El piso para dar algo por auditado es el 4.**

## La lista de pantallas (6 de 353 con nivel 4 o más — 2%)

| Qué | Método | Cuándo | Quién | Qué se encontró |
|---|---|---|---|---|
| `/evento/bogue/[fiestaId]` | **5 + 6** | 31/08/2026 | Claude | Muestra el texto de marca. Sana |
| `/evento/buzon/[fiestaId]` | **4 + 6** | 31/08/2026 | Claude | Anda. **Es la única pantalla blanca**: encandila en un salón a oscuras |
| `/evento/espejo-magico/[fiestaId]` | **4 + 6** | 31/08/2026 | Claude | Sana. Tiene accesorios arrastrables y firma. **Falta comprobar el texto de marca** |
| `/evento/fotocabina/[fiestaId]` | **5 + 6** | 31/08/2026 | Claude | Sana. Saca la tanda y arma la tira. Es la mejor de las seis |
| `/evento/plataforma-360/[fiestaId]` | **5 + 6** | 31/08/2026 | Claude | Muestra el texto de marca. **No usa el color de la fiesta** |
| `/evento/touchpix/[fiestaId]` | **4 + 6** | 31/08/2026 | Claude | Sana. **NO VERIFICADO** que muestre la marca: su boton de disparar no tiene nombre y no se puede tocar desde una prueba. Pedido en la orden 20, bloque 9.c |
| `/admin` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/admin/usuarios` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/alertas` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/aprobaciones` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/auditoria` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/calendario` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/comparativa-ganancias` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/contabilidad/comercial-360` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/contabilidad/crm/agenda` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/contabilidad/crm/atraccion-fiestas` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/contabilidad/crm/ciclo-comercial` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/contabilidad/crm/marketing-ads` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/contabilidad/crm/outbox` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/contabilidad/crm` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/contabilidad/fiestas-historicas` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/contabilidad` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/customers/new` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/customers` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/customers/reporte` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/customers/[id]/edit` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/customers/[id]` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/empleados/nuevo` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/empleados` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/empleados/reporte` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/empleados/roles` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/empleados/[id]/editar` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/empleados/[id]/historial` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/empresa/activos-fijos/editar/[id]` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/empresa/activos-fijos/nuevo` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| `/empresa/activos-fijos` | **1** | 31/08/2026 | ayudante | Sin auditar con método de navegador |
| *...y otras 317 pantallas en nivel 1* | **1** | 31/8/2026 | ayudante | Pendientes de recorrido navegador |

## La otra mitad: LOS MÓDULOS (4 de 16)

| Módulo | Plataformas miradas | Pantalla abierta | Orden escrita | Fecha |
|---|---|---|---|---|
| Entretenimiento (6 estaciones) | 13 | sí, con fotos | orden 20 | 31/08/2026 |
| Pantalla gigante | 13 | sí, con prueba | orden 22 | 31/08/2026 |
| Invitación digital | 5 | sí, con prueba y fotos | orden 23 | 31/08/2026 |
| Red social del evento | 5 | sí, con prueba y fotos | orden 23 | 31/08/2026 |
| Decoración | 13 | no | orden 24 | 31/08/2026 |
| Presupuestos y ventas | — | — | — | **pendiente (Claude: es plata)** |
| Cobros, cuotas y facturas | — | — | — | **pendiente (Claude: es plata)** |
| Comida y lista de compras | — | — | — | **pendiente (Claude: es comida)** |
| Permisos: quién ve qué | — | — | — | **pendiente (Claude)** |
| Invitados y confirmaciones | — | — | — | pendiente (Gemini) |
| Portal del cliente | — | — | — | pendiente (Gemini) |
| Música y DJ | — | — | — | pendiente (Gemini) |
| Personal y proveedores | — | — | — | pendiente (Gemini) |
| Logística y armado | — | — | — | pendiente (Gemini) |
| Marketing y redes | — | — | — | pendiente (Gemini) |
| Configuración de la empresa | — | — | — | pendiente (Gemini) |

