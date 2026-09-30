# 101 — El asistente del cliente, las preguntas frecuentes del contrato, la web lista para asistentes de afuera y un secretario "tipo Muse"

**Para:** Gemini.
**Escrita por:** Claude, el 30 de septiembre de 2026, por pedido del dueño ("hacé todo").

## Cómo se entrega

- **Después de terminar la orden 100.** Rama nueva desde la versión principal de ese momento y
  **una sola propuesta** con los cinco bloques. Si uno se traba, entregá el resto y avisá cuál.
- `npm run "publicar?"` completo y la última pantalla pegada en la propuesta.
- Pasá por `docs/ANTES-DE-ENTREGAR.md`. Nada de esto manda mensajes, cobra ni acepta nada solo.

---

## Bloque 1 — El asistente del cliente, en su portal

**Qué hay hoy.** `chatConAsistenteCliente` (`src/app/actions/asistente-virtual.ts` ~l.159) está
escrito y **ninguna pantalla lo usa**. Y tiene un agujero: **sólo pide el número de la fiesta**, sin
comprobar que quien pregunta entró al portal. Es una acción del servidor: hoy cualquiera con el
número puede sacarle nombre, fecha, salón y tareas.

**Qué hacer:**

1. Que reciba la misma llave de sesión del portal que usa `getFiestaForPortalSession`
   (`src/app/actions/fiesta/portal.actions.ts`) y **la valide igual, antes de leer la fiesta**. Sin
   sesión válida: "Tu sesión del portal venció. Volvé a entrar." y no se lee nada.
2. Componente `src/components/portal/AsistenteDelCliente.tsx`, copiando la forma de
   `src/components/invitacion/AsistenteDelInvitado.tsx` (burbuja, historial, carga, error).
   Montalo en `src/app/portal-cliente/[id]/page.tsx` sólo cuando la sesión está iniciada.
3. Que su instrucción incluya `PREGUNTAS_FRECUENTES_DEL_CONTRATO` (bloque 2) y la regla: "Si la
   respuesta depende de su caso (montos, fechas, excepciones), decile que lo confirma el
   organizador por WhatsApp. No prometas nada que no esté acá."

**La prueba** (`src/__tests__/el-asistente-del-cliente-pide-su-sesion.test.ts`): sin sesión o con
la de otra fiesta, **no se lee la fiesta** y no se llama a la IA; con la sesión correcta, contesta y
la instrucción que recibe la IA incluye una pregunta del contrato.

## Bloque 2 — Las preguntas frecuentes salen del contrato

`src/data/preguntas-frecuentes-contrato.ts` exporta `PREGUNTAS_FRECUENTES_DEL_CONTRATO` con **este
texto, tal cual** (lo sacó Claude del contrato revisado del 30/09/2026; si el contrato cambia, se cambia acá y lo
leen todos):

| Pregunta | Respuesta |
|---|---|
| ¿Cómo reservo la fecha? | Firmando el contrato y abonando la seña acordada: confirma la reserva y se descuenta del total. |
| ¿Qué incluye el servicio? | Sólo lo que figura en el presupuesto firmado y lo que se agregue después por escrito (presupuesto, factura o adenda). El salón no está incluido salvo que figure en el presupuesto. |
| ¿Cuántas horas dura la fiesta? | Hasta 7 horas desde el inicio. Cada hora extra o fracción cuesta $5.000, un precio fijo que no lleva el ajuste anual. |
| ¿El precio cambia si la fiesta es el año que viene? | Sí. Cada 1º de enero se aplica un ajuste del 15% sobre lo que falte, acumulado año a año, si el evento es en un año posterior al de la firma. |
| ¿Cómo pago? | En cuotas libres: como mínimo $10.000 en cada período de tres meses contado desde la firma; al primer tercio del plazo tiene que estar pago el 30%, a la mitad el 50%, y el total 30 días antes de la fiesta. Podés adelantar cuando quieras. |
| ¿Qué pasa si me atraso con un pago? | No hay recargo automático. Antes de cualquier medida te avisamos y tenés 5 días para ponerte al día; si no, el contrato se puede dar por terminado y se aplica la cláusula penal. |
| ¿Puedo cambiar la fecha? | Sí, pidiéndolo con 30 días de anticipación y según disponibilidad. Cada cambio tiene un costo del 10% del presupuesto, salvo que sea por un caso de fuerza mayor. |
| ¿Y si cancelo? | La cancelación tiene una penalidad del 30% del presupuesto vigente. Lo que ya pagaste se descuenta de eso, y si pagaste de más se te devuelve la diferencia dentro de los 30 días. |
| ¿Puedo cambiar la cantidad de invitados? | Hasta 15 días antes: podés bajar hasta un 10% o subir hasta un 20% (según disponibilidad, y el aumento se paga antes). Si querés bajar más del 10%, lo que pase de ese 10% se toma como cancelación parcial (30% sobre esa parte). Después de ese día, la cantidad queda fija. |
| ¿Cuándo entrego la lista de invitados? | Como máximo 7 días antes, con todos los que van (incluidos niños y adolescentes) y el menú de cada uno. |
| ¿Hacen menú sin gluten o para alergias? | Sí, avisando en la reunión de organización o hasta 15 días antes; se presupuesta aparte. La cocina no tiene un sector exclusivo, así que no se puede asegurar que no haya trazas. |
| ¿Quién decide los detalles de la fiesta? | Vos, en las reuniones de organización. Lo que se define ahí queda por escrito. Sólo la persona que firmó puede pedir cambios, salvo que autorice a otra por escrito. |
| ¿Puedo llevar fotógrafo, show o maquilladora por mi cuenta? | Sí, avisando antes. Su comida y bebida no están incluidas salvo que se agreguen al presupuesto. |
| ¿Me puedo llevar lo que sobra? | Sí, la comida, tortas, postres y bebidas que aportaste o que se facturaron aparte. No lo de la barra libre ni los materiales de trabajo. |
| ¿Quién cuida a los niños? | Sus padres o los adultos responsables; el equipo no cumple funciones de cuidado. |
| ¿Usan las fotos de mi fiesta? | Sólo si lo autorizás en el contrato; si no, no cambia nada del precio ni del servicio. Para mostrar a otros menores se pide permiso a sus padres. |
| ¿Y AGADU? | Corre por cuenta del cliente, salvo que esté incluido en el presupuesto. |
| ¿Los precios incluyen impuestos? | Sí: todo está en pesos uruguayos e incluye los impuestos que correspondan, salvo que el presupuesto diga otra cosa. |
| ¿Y si AK no puede cumplir con algo? | Si por causa de AK no se presta un servicio contratado y pagado, y no se acuerda un reemplazo o una fecha nueva, se devuelve lo pagado por ese servicio dentro de los 30 días. |
| ¿Qué pasa si hay un imprevisto grave? | Si es un caso de fuerza mayor (desastre, orden de la autoridad, fallecimiento o enfermedad grave documentada), se acuerda una fecha nueva sin el costo del 10%, manteniendo el contrato (con el ajuste anual si pasa de año); si no se puede, se liquida lo hecho y los gastos ya comprometidos, y se devuelve el saldo dentro de los 30 días. |

**Dónde se usa:**

- en el asistente del cliente (bloque 1);
- en el vendedor virtual de la web (`chatWithVirtualAssistant`, mismo archivo ~l.37), con la regla
  de no prometer;
- en el portal del cliente, como sección "Preguntas frecuentes" con acordeón.

**No toques** las preguntas frecuentes de la portada (`FAQSection`): son otra cosa y ya andan.

**La prueba** (`src/__tests__/las-preguntas-del-contrato-llegan.test.ts`): el portal muestra
"¿Y si cancelo?", y la instrucción de los dos asistentes contiene esa pregunta.

## Bloque 3 — La web lista para asistentes de afuera (Muse de Meta, y el de Google cuando salga)

Esos asistentes entran a la web como una persona y completan formularios. Que no se traben:

1. Todo botón y campo del simulador de presupuesto y del formulario de contacto tiene un nombre
   que se lee (`aria-label` o `<label>` asociado); ningún botón es sólo un ícono sin nombre.
2. Datos del negocio legibles por máquina en la portada (`LocalBusinessJsonLd`, que ya existe en
   `src/components/seo/`): nombre, ciudad Salto, teléfono de WhatsApp, zona que atiende y servicios.
   **Sin precios ni promesas.**
3. `public/llms.txt`: una página corta en texto que diga quién es AK, qué servicios da, que atiende
   en Salto, y dónde se pide presupuesto (`/simulador-de-presupuesto`) y cómo se contacta.
   **Sin precios ni promesas.**

**La prueba** (`tests/e2e/la-web-se-deja-usar-por-asistentes.spec.ts`): con
`getByRole`/`getByLabel`, sin clases ni posiciones, completar el simulador hasta ver el total; y
`/llms.txt` responde 200 y menciona "Salto".

## Bloque 4 — El secretario del equipo hace más cosas del día a día ("tipo Muse")

El asistente interno ya hace 8 cosas (`src/app/actions/multiagent.ts` ~l.115-270: crear y completar
tareas, sumar invitados, anotar incidentes y prospectos, borrador de presupuesto, preparar WhatsApp
y recordatorios). Sumale estas, **todas con confirmación del equipo antes de hacer**:

| Acción nueva | Qué hace | Con qué (ya existe) |
|---|---|---|
| `agendar_reunion` | Pone una reunión en la agenda de Google | `upsertGoogleCalendarEvent`, `src/lib/google-workspace.ts` ~l.598 |
| `ver_mi_semana` | Resume fiestas, reuniones, cobros por vencer y tareas de los próximos 7 días | lectura, sin escribir |
| `preparar_mail` | Deja un mail listo en la bandeja de salida; **lo manda una persona** | `saveScheduledMessage` con `manual_click` |
| `buscar_en_la_web` | Busca en internet (precios de proveedores, ideas de decoración) y resume con las direcciones | `googleSearchRetrieval`, como el blog (orden 96, bloque 6) |
| `cuanto_me_deben` | Lista quién debe qué y desde cuándo | lectura de presupuestos y cuotas, sin tocar nada |

- Cada acción que escribe muestra antes "Voy a hacer esto: … ¿Confirmo?" y **sólo actúa con el sí**.
- **Nunca** manda mensajes, cobra, marca pagos ni acepta presupuestos (reglas de `CLAUDE.md`).
- `buscar_en_la_web` usa como máximo 20 búsquedas por día entre todo el equipo, para quedar
  adentro de lo gratis.

**La prueba** (`src/__tests__/el-secretario-hace-lo-del-dia.test.ts`): cada acción nueva, sin el
"sí", no escribe; con el "sí", escribe lo esperado (evento en agenda simulada, mensaje en bandeja
con `manual_click`); `cuanto_me_deben` no escribe nunca.

## Bloque 5 — El contrato de la app pasa a ser el revisado del 30/09/2026

**Qué pasa hoy.** El contrato que arma la app sigue siendo el viejo (mínimo $5.000 cada 3 meses,
+30% de invitados, "LA CLIENTE"). Vive en tres lugares:

- `defaultContractTemplate` y `DEFAULT_CONTRACT_TEMPLATES` en `src/app/actions/settings.ts` ~l.24-145;
- `defaultContractSettings.clauses` en `src/types/settings.ts` ~l.190 (lo usa `getContractSettings` ~l.491);
- `CONTRACT_TEMPLATE` en `src/lib/contract-template.ts`, que llena `buildContractFromSettings`
  (lo usa `src/app/(app)/presupuestos/[id]/recibo-contrato/page.tsx`).

**El texto nuevo, tal cual:** `docs/contratos/contrato-base-2026-09-30.txt` (17 cláusulas, dice
"EL/LA CLIENTE"). No se reescribe ni se "mejora": se copia.

**Qué hacer:**

1. Reemplazá las cláusulas por omisión y la plantilla por omisión con ese texto, una cláusula por
   cada "CLÁUSULA N". Mantené los nombres de campo que ya usa `fillContractTemplate`; sumá los nuevos.
2. Las fechas se calculan solas en `fillContractTemplate`, en días de Uruguay (`hoyEnUruguay`):
   `{{HITO_30}}` = firma + un tercio del plazo hasta el evento; `{{HITO_50}}` = la mitad;
   `{{FECHA_SALDO_TOTAL}}` = evento − 30 días; `{{MONTO_SENA}}` sale de la seña del presupuesto.
   Formato "d de mes de aaaa".
3. **No se pisa lo que editó el dueño.** Si lo guardado en `contract-template.json` /
   `contract-settings.json` es igual al viejo por omisión, pasa solo al nuevo. Si lo cambió, en
   Ajustes → Contratos → Cláusulas aparece arriba "Hay un contrato revisado (30/09/2026). Usarlo" y
   se cambia **sólo con ese toque**, guardando con la función de guardado que ya existe.
4. Los contratos ya firmados no se tocan: sólo cambia lo que se arma de acá en adelante.

**La prueba** (`src/__tests__/el-contrato-de-la-app-es-el-revisado.test.ts`): el contrato armado
para un presupuesto de prueba contiene "$10.000" y "EL/LA CLIENTE", **no** contiene "$5.000 cada"
ni "30%" de aumento de invitados, no deja ningún `{{` sin llenar, y con firma 01/01 y evento 31/12
da `HITO_50` en julio y saldo total el 1 de diciembre; con cláusulas editadas por el dueño, leer
los ajustes **no** las reemplaza.

```comprobar
usa: AsistenteDelCliente en src/app/portal-cliente/[id]/page.tsx
prueba: src/__tests__/el-asistente-del-cliente-pide-su-sesion.test.ts
archivo: src/data/preguntas-frecuentes-contrato.ts
usa: PREGUNTAS_FRECUENTES_DEL_CONTRATO en src/app/actions/asistente-virtual.ts
prueba: src/__tests__/las-preguntas-del-contrato-llegan.test.ts
archivo: public/llms.txt
prueba: tests/e2e/la-web-se-deja-usar-por-asistentes.spec.ts
usa: agendar_reunion en src/app/actions/multiagent.ts
usa: cuanto_me_deben en src/app/actions/multiagent.ts
prueba: src/__tests__/el-secretario-hace-lo-del-dia.test.ts
archivo: docs/contratos/contrato-base-2026-09-30.txt
usa: HITO_50 en src/lib/contract-template.ts
usa: EL/LA CLIENTE en src/types/settings.ts
prueba: src/__tests__/el-contrato-de-la-app-es-el-revisado.test.ts
```
