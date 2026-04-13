# Backup y Restauración — AK Producciones

## Cómo funciona

El sistema de backup exporta e importa datos desde/hacia **Firestore** (en producción) o archivos locales (en desarrollo).

### Descargar respaldo (Export)

1. Ir a **Configuración → Backup** (`/settings/backup`)
2. Click en **"Descargar respaldo"**
3. Se descarga un archivo `.zip` con todos los datos:
   - Presupuestos, clientes, servicios, fiestas
   - Facturas, empleados, proveedores
   - CRM (leads, stages, meetings)
   - Configuraciones (app, empresa, WhatsApp, contratos)
   - Feature flags, galería, menús, cupones

El ZIP incluye un archivo `_metadata.json` con:
```json
{
  "exportedAt": "2026-04-13T16:00:00.000Z",
  "source": "firestore",
  "version": "1.0",
  "app": "AK Producciones"
}
```

### Restaurar respaldo (Import)

1. Ir a **Configuración → Backup** (`/settings/backup`)
2. Click en **"Restaurar respaldo"**
3. Seleccionar el archivo `.zip` descargado previamente

**⚠️ ADVERTENCIA:** La restauración **reemplaza** los datos actuales en cada colección importada.

El sistema:
- Parsea los JSONs del ZIP
- Escribe cada colección vía `writeData` (que en producción escribe a Firestore)
- Valida que solo se importen colecciones conocidas (ignora archivos desconocidos)
- Devuelve un resumen: "Se restauraron X presupuestos, Y clientes, Z servicios"

### Seguridad

- Solo se importan colecciones conocidas y pre-aprobadas
- Archivos desconocidos en el ZIP son ignorados con un warning en los logs
- El sistema no acepta archivos que no sean `.zip`

### Logs

Las operaciones de backup/restore se registran en los logs del servidor:
```
[AK] [Backup] Export completed: 21 collections exported at 2026-04-13T16:00:00.000Z
[AK] [Backup] Restore completed at 2026-04-13T16:30:00.000Z: 50 presupuestos, 30 customers, ...
```

### En caso de error

Si la restauración falla parcialmente:
1. Se devuelve un resumen indicando qué colecciones se restauraron y cuáles fallaron
2. Los errores se registran en los logs
3. Las colecciones ya restauradas quedan con los datos del backup

### API

- **GET** `/api/backup/download` — descarga ZIP con todos los datos
- **POST** `/api/backup/upload` — restaura datos desde ZIP (`multipart/form-data`, campo `backupFile`)
