# Integración WhatsApp — AK Producciones

## Resumen

AK Producciones integra automatización de WhatsApp para enviar mensajes automáticos en puntos clave del flujo de negocio.

## Configuración

### Acceso
- **Configuración → WhatsApp** (`/settings` → sección WhatsApp)

### Opciones
- **Activar/desactivar** automatización global
- **Templates** de mensajes personalizables
- **Reglas de automatización** con triggers específicos

## Triggers automáticos

### Triggers disponibles

| Trigger | Cuándo se dispara | Template por defecto |
|---------|-------------------|---------------------|
| `presupuesto_generado` | Al crear un presupuesto nuevo | Budget share template |
| `presupuesto_enviado` | Al aprobar/enviar un presupuesto | Budget share template |
| `contrato_firmado` | Al firmar un contrato digital | Contract share template |
| `pago_vencido` | Cuando un pago pasa la fecha de vencimiento | Payment reminder template |
| `pago_por_vencer` | Antes de que un pago venza | Payment reminder template |
| `fiesta_creada` | Al crear un evento/fiesta | Welcome template |
| `cliente_nuevo` | Al registrar un cliente nuevo | Welcome template |
| `lead_estado_cambiado` | Al cambiar estado de un lead en CRM | Welcome template |
| `simulador_completado` | Cuando un prospecto completa el simulador | Budget share template |
| `manual` | Enviado manualmente por el operador | Custom template |

### Variables de template

Los templates soportan estas variables:
- `{{NOMBRE}}` — Nombre del cliente/prospecto
- `{{FECHA}}` — Fecha relevante
- `{{HORA}}` — Hora del evento
- `{{FECHA_EVENTO}}` — Fecha del evento
- `{{SALDO}}` — Saldo pendiente
- `{{LINK}}` — Link al presupuesto/contrato
- `{{SALON}}` — Nombre del salón

### Comportamiento

- Los triggers son **fire-and-forget**: no bloquean el flujo principal
- Si WhatsApp está desactivado, los triggers no hacen nada
- Si un trigger falla, se loguea un warning pero la operación principal no se ve afectada
- Los mensajes se programan como `ScheduledMessage` con el delay configurado en la regla

### Código

```typescript
// Ejemplo de trigger fire-and-forget en una server action:
triggerWhatsAppAutomation('cliente_nuevo', {
  targetId: clienteId,
  targetName: clienteNombre,
  targetType: 'cliente',
  targetPhone: clientePhone,
  nombre: clienteNombre,
}).catch(err =>
  logger.warn('[WhatsApp] Automation trigger failed:', err.message)
);
```

## Archivos clave

- `src/types/whatsapp-automation.ts` — Tipos (AutomationTrigger, WhatsAppAutomationRule, ScheduledMessage)
- `src/lib/whatsapp-automation-engine.ts` — Motor de automatización
- `src/app/actions/settings.ts` — Settings y templates de WhatsApp
- `src/app/actions/scheduled-messages.ts` — CRUD de mensajes programados
