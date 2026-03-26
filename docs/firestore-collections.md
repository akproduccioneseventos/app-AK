# Estructura de Colecciones en Firestore

## Proyecto: presupuestador-ak-producciones

### Colecciones Principales

---

#### 1. `clientes`
Datos de clientes registrados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del cliente |
| `name` | string | Nombre completo |
| `phone` | string | Teléfono de contacto |
| `email` | string | Correo electrónico |
| `estadoCliente` | string | "Actual" / "Potencial" / "Inactivo" |
| `direccion` | string | Dirección |
| `notas` | string | Notas adicionales |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última modificación |

---

#### 2. `eventos` (fiestas)
Eventos con todos sus detalles de planificación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del evento |
| `configuracion` | map | Datos generales (fecha, lugar, cliente, tipo) |
| `configuracion.fechaEvento` | string | Fecha ISO del evento |
| `configuracion.clienteNombre` | string | Nombre del cliente |
| `configuracion.tipoEvento` | string | Tipo de evento |
| `configuracion.salonFiestas` | string | Salón/Lugar |
| `configuracion.invitados` | number | Cantidad de invitados |
| `personalAsignado` | array | Personal asignado al evento |
| `gestionCostos` | map | Gestión de costos y rentabilidad |
| `gestionCostos.costosItems` | array | Lista de costos estimados |
| `pagosProveedores` | array | Pagos realizados a proveedores |
| `tareas` | array | Lista de tareas del evento |
| `cargaOperativa` | map | Carga operativa del evento |
| `catering` | map | Detalles de catering/menú |
| `itinerario` | array | Itinerario del evento |
| `documentos` | map | Documentos asociados |
| `estado` | string | Estado del evento |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última modificación |

---

#### 3. `presupuestos`
Presupuestos generados para clientes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del presupuesto |
| `clienteNombre` | string | Nombre del cliente |
| `eventoTipo` | string | Tipo de evento |
| `eventoFecha` | string | Fecha ISO del evento |
| `invitadosCantidad` | number | Total invitados |
| `invitadosAdultos` | number | Invitados adultos |
| `invitadosNinos` | number | Invitados niños |
| `invitadosAdolescentes` | number | Invitados adolescentes |
| `salonFiestas` | string | Salón/Lugar |
| `protagonista1Nombre` | string | Nombre del protagonista |
| `itemsPresupuestados` | array | Ítems del presupuesto |
| `costoTotalEstimado` | number | Subtotal antes de descuento |
| `totalConDescuento` | number | Total con descuento aplicado |
| `estado` | string | "Borrador" / "Enviado" / "Aceptado" / "Rechazado" / "Facturado" |
| `invoiceId` | string | ID de factura vinculada |
| `leadId` | string | ID del lead CRM vinculado |
| `notas` | string | Notas adicionales |
| `timestamp` | string | Fecha de creación |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última modificación |

---

#### 4. `empleados`
Personal y roles.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del empleado |
| `nombre` | string | Nombre completo |
| `documento` | string | CI/Documento |
| `telefono` | string | Teléfono |
| `email` | string | Correo electrónico |
| `rolId` | string | ID del rol asignado |
| `rolNombre` | string | Nombre del rol |
| `salarioBase` | number | Salario base |
| `estado` | string | "Activo" / "Inactivo" |
| `fechaIngreso` | string | Fecha de ingreso |
| `notas` | string | Notas adicionales |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última modificación |

---

#### 5. `proveedores`
Proveedores registrados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del proveedor |
| `nombre` | string | Nombre/Razón social |
| `rubro` | string | Rubro/Categoría |
| `telefono` | string | Teléfono |
| `email` | string | Correo electrónico |
| `direccion` | string | Dirección |
| `notas` | string | Notas adicionales |
| `calificacion` | number | Calificación (1-5) |
| `estado` | string | "Activo" / "Inactivo" |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última modificación |

---

#### 6. `servicios`
Catálogo de servicios ofrecidos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del servicio |
| `nombre` | string | Nombre del servicio |
| `categoria` | string | Categoría del servicio |
| `descripcion` | string | Descripción |
| `precioBase` | number | Precio base |
| `precioVariable` | boolean | Si el precio varía |
| `unidad` | string | Unidad (por persona, por hora, fijo) |
| `esRegalo` | boolean | Si es un regalo/cortesía |
| `activo` | boolean | Si está activo |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última modificación |

---

#### 7. `prospectos` (CRM Pipeline)
Leads/prospectos del sistema CRM.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del prospecto |
| `nombre` | string | Nombre del contacto |
| `telefono` | string | Teléfono |
| `email` | string | Correo electrónico |
| `tipoEvento` | string | Tipo de evento de interés |
| `fechaEvento` | string | Fecha estimada del evento |
| `presupuestoEstimado` | number | Presupuesto estimado |
| `etapa` | string | Etapa del pipeline |
| `origen` | string | Canal de origen |
| `presupuestoId` | string | ID de presupuesto vinculado |
| `notas` | string | Notas de seguimiento |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última modificación |

---

#### 8. `facturas` (invoices)
Facturas generadas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único |
| `invoiceNumber` | string | Número de factura |
| `customer` | map | Datos del cliente |
| `issueDate` | string | Fecha de emisión |
| `dueDate` | string | Fecha de vencimiento |
| `items` | array | Ítems facturados |
| `totalAmount` | number | Monto total |
| `status` | string | "Draft" / "Sent" / "Paid" / "Overdue" |
| `payments` | array | Pagos recibidos |
| `currency` | string | Moneda (UYU) |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última modificación |

---

#### 9. `roles`
Roles del personal.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único |
| `nombre` | string | Nombre del rol |
| `salarioBase` | number | Salario base |
| `porcentajeAportesPatronales` | number | % aportes patronales |
| `descripcion` | string | Descripción |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última modificación |

---

#### 10. `configuracion`
Configuración general del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Tipo de config (ej: "company-info") |
| `data` | map | Datos de configuración |
| `updatedAt` | timestamp | Última modificación |

---

### Reglas de Seguridad Recomendadas (Firestore Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer/escribir
    match /{collection}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Índices Compuestos Sugeridos

1. `presupuestos`: (estado ASC, eventoFecha ASC)
2. `eventos`: (configuracion.fechaEvento ASC, estado ASC)
3. `prospectos`: (etapa ASC, createdAt DESC)
4. `facturas`: (status ASC, dueDate ASC)
