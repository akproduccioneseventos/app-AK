# Asistente AK — Arquitectura y Documentación

## Descripción General

El Asistente AK es un copiloto inteligente integrado en la aplicación de AK Producciones Eventos. Funciona como un widget de chat flotante que permite a los usuarios interactuar en lenguaje natural para ejecutar acciones reales en la app: crear presupuestos, registrar clientes, agendar eventos, y más.

### Stack Técnico

- **Modelo de IA:** Google Gemini 2.5 Flash (vía Google Genkit)
- **Backend:** Next.js Server Actions (`src/app/actions/assistant.ts`)
- **Flujo de IA:** Genkit Flow (`src/ai/flows/assistant-flow.ts`)
- **Widget UI:** React (`src/components/assistant/ak-assistant-widget.tsx`)

---

## Flujo de Datos

```
Usuario (texto/voz/imagen)
    ↓
AKAssistantWidget (React)
    ↓ sendAssistantMessage()
Server Action (assistant.ts)
    ↓ 1. Carga contexto del negocio (KPIs, presupuestos, clientes, servicios)
    ↓ 2. Llama a chatWithAssistant() con mensaje + contexto + historial
Genkit Flow (assistant-flow.ts)
    ↓ Envía a Gemini con system prompt + contexto
    ↓ Recibe: { response, action: { type, data } }
Server Action (assistant.ts)
    ↓ 3. Ejecuta la acción si la IA la pidió
    ↓ 4. Reemplaza la respuesta con resultado verificado
    ↓ Retorna: { success, response, action: { type, data, result } }
AKAssistantWidget
    ↓ Muestra respuesta + toast de confirmación/error
Usuario
```

---

## Tipos de Acción Soportados

| Tipo de Acción | Descripción | Datos Esperados |
|---|---|---|
| `create_customer` | Crear un nuevo cliente | `{ name, phone, partyDate, partyType, guestCount }` |
| `create_budget` | Crear un presupuesto | `{ clienteNombre, eventoTipo, eventoFecha, invitados, servicios[] }` |
| `import_budget_from_image` | Importar presupuesto desde imagen/PDF | `{ clienteNombre, eventoTipo, servicios[], ... }` |
| `register_payment` | Registrar un pago/seña | `{ clienteNombre, monto, metodoPago, presupuestoId }` |
| `create_invoice` | Crear una factura | `{ clienteNombre, items[], notas, currency }` |
| `update_service_price` | Actualizar precio de servicio | `{ servicioNombre, nuevoPrecio }` |
| `create_employee` | Registrar un empleado | `{ nombre, cedula, fechaNacimiento }` |
| `create_supplier` | Registrar un proveedor | `{ nombreEmpresa, nombre, servicioPrincipal }` |
| `create_lead` | Registrar un prospecto en CRM | `{ name, phone, email, partyType }` |
| `create_event` | Crear un evento/fiesta | `{ clienteNombre, eventoTipo, eventoFecha, invitados }` |
| `update_event` | Actualizar un evento existente | `{ fiestaId, clienteNombre, camposAActualizar }` |
| `generate_contract` | Generar/guardar datos de contrato | `{ fiestaId, clienteNombre, senia, saldo }` |
| `check_availability` | Consultar disponibilidad de fecha | `{ fecha }` (YYYY-MM-DD) |
| `generate_social_post` | Generar post para redes sociales | `{ platform, content, eventoTipo }` |
| `generate_whatsapp_message` | Generar mensaje de WhatsApp | `{ tipo, content, clienteNombre }` |
| `generate_promo` | Generar texto de promoción | `{ content, descuento, vigencia }` |
| `navigate` | Navegar a una sección de la app | `{ href }` |
| `show_manual` | Mostrar instrucciones de uso | — |
| `query_data` | Consultar datos del negocio | `{ queryType, filtros }` |
| `none` | Sin acción (solo respuesta conversacional) | — |

---

## Estrategia de Manejo de Errores

### Errores de la API de Gemini (403 / permisos)

Cuando Gemini devuelve un error de permisos (403, API key inválida, acceso denegado):

- **Al usuario:** `"No pude procesar tu mensaje en este momento. Intentá de nuevo en unos minutos."`
- **Al servidor:** `logger.error('[Asistente AK] Error en sendAssistantMessage:', errorMessage)`
- **Nunca se expone:** URLs de APIs, claves, tokens, endpoints, ni detalles técnicos

### Errores de cuota/rate-limit (429)

- **Al usuario:** `"El asistente está temporalmente saturado. Intentá de nuevo en unos minutos."`
- **Al servidor:** Log completo del error

### Errores de modelo no disponible (404)

- **Al usuario:** `"El modelo de IA no está disponible en este momento. Intentá de nuevo en unos minutos."`
- **Al servidor:** Log completo del error

### Datos faltantes (data = undefined/null)

Cada tipo de acción tiene un handler específico que se activa cuando la IA retorna el tipo de acción pero sin datos. Ejemplo:

- `create_budget` sin data → `"No se pudieron extraer los datos del presupuesto. Proporcioná nombre del cliente, tipo de evento y servicios, o crealo manualmente desde /presupuestos/nuevo."`
- `create_customer` sin data → `"Falta información del cliente. Proporcioná al menos el nombre, o ingresalo manualmente desde /customers/new."`

Cada handler incluye una ruta manual de escape para el usuario.

### Presupuestos vacíos (import_budget_from_image)

El flujo de importación de presupuestos sigue una secuencia estricta de 3 pasos:

1. **Paso 1 — Extracción:** La IA analiza la imagen/PDF y extrae datos del `result.action.data`
2. **Paso 2 — Validación:** Se filtran servicios con `nombreServicio` no vacío (≠ "Servicio") y `precioUnitario > 0`
3. **Paso 3 — Creación condicional:**
   - Si NO hay servicios válidos → **NO se crea presupuesto, NO se crea cliente, NO se crea fiesta**
   - Si hay servicios pero faltan datos del cliente → se crea presupuesto como `estado: 'Borrador'` con `clienteNombre: 'Cliente importado (revisar)'` y notas `'Importado automáticamente — revisar datos'`
   - Si hay servicios y datos del cliente → se crea presupuesto, cliente y fiesta normalmente

**Reglas de borradores:**
- Si el presupuesto queda como borrador incompleto, **NO se crea fiesta automáticamente**
- El mensaje al usuario indica claramente que es un borrador y enlaza a la página de edición
- **NUNCA** se dice "importación exitosa" si hay datos faltantes

Si los servicios extraídos son menos que los detectados originalmente, el mensaje indica que algunos servicios no pudieron importarse y sugiere revisión manual.

### Acciones no reconocidas

Cualquier action type no manejado (que no sea `none`, `navigate`, `show_manual`, `query_data`) recibe un catch-all:

- `"No pude ejecutar esa acción automáticamente. Podés hacerlo manualmente desde la sección correspondiente."`
- Se registra un warning en el log del servidor

---

## Reglas del System Prompt

### Reglas estrictas de respuesta (System Prompt)

Estas reglas están inyectadas en el system prompt de la IA:

1. **NUNCA** decir "ya inicié la acción", "estoy esperando confirmación del sistema", "te aviso cuando termine" — están **PROHIBIDAS**
2. Si se devuelve una acción, el sistema la ejecutará y **REEMPLAZARÁ** la respuesta con el resultado real
3. Si no se pueden extraer datos suficientes de un archivo, **NO devolver la acción** — responder directamente qué se pudo y qué no se pudo leer
4. **NUNCA** inventar que algo fue creado o procesado sin confirmación del sistema

### Reglas de honestidad

1. **NUNCA** afirmar éxito sin verificación real del backend
2. Para acciones de backend, usar frases de intención ("Voy a crear...", "Procesando...")
3. El sistema reemplaza la respuesta de la IA con el resultado verificado real
4. Si la acción falla, decirlo directamente
5. Si la acción no existe, indicarlo claramente

### Frases prohibidas (cuando no hay confirmación real)

- "Ya te lo creé"
- "Ya quedó listo"
- "Ya está completo"
- "Te lo cargué"
- "Estoy esperando confirmación"
- "Te aviso cuando termine"

### Phrasing neutral obligatorio

- "Voy a crear..."
- "Estoy registrando..."
- "Procesando..."
- "Lo voy a guardar ahora..."

### Manejo de errores técnicos

Si el servicio de IA tiene problemas (permisos, cuota, etc.):
- **Decir:** "No pude procesar tu mensaje en este momento. Intentá de nuevo en unos minutos."
- **NUNCA** mencionar: APIs, tokens, endpoints, claves, ni detalles técnicos

---

## Archivos Clave

| Archivo | Responsabilidad |
|---|---|
| `src/app/actions/assistant.ts` | Server Action principal — routing de acciones, ejecución, manejo de errores |
| `src/ai/flows/assistant-flow.ts` | Definición del flujo Genkit, system prompt, esquemas de entrada/salida |
| `src/ai/genkit.ts` | Configuración de Genkit con Google AI |
| `src/components/assistant/ak-assistant-widget.tsx` | Widget de chat React con soporte de voz (entrada/salida) |
| `src/lib/logger.ts` | Logger centralizado con prefijo `[AK]` |
| `src/__tests__/assistant-actions.test.ts` | Tests unitarios del handler de acciones |
