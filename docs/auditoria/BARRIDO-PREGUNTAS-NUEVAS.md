# Barrido de Preguntas Nuevas — Informe para Claude (Septiembre 2026)

Este documento registra los hallazgos encontrados durante el barrido mecánico y manual de la aplicación aplicando las quince preguntas de `docs/ANTES-DE-ENTREGAR.md` (específicamente preguntas 10 a 16).

Siguiendo las instrucciones de la **Orden 67**, los hallazgos en áreas de **plata, cobros, presupuestos, comida/menús, permisos y quién ve qué** NO han sido modificados por Gemini y quedan registrados aquí para su resolución por parte de Claude.

---

## 1. Plata, Cobros, Costos y Rentabilidad

### Hallazgo 1.1: `src/app/(app)/presupuestos/[id]/recibo-contrato/page.tsx:215` y `:238`
- **Forma:** *La fecha suelta convertida por el navegador (Pregunta 13: hora de Uruguay).*
- **Código:**
  ```tsx
  new Date(fechaStr).toLocaleDateString(...)
  ```
- **Qué pasaría:** En los recibos y contratos de presupuestos, al convertir fechas en formato `YYYY-MM-DD` mediante `new Date()` sin fijar zona horaria ni usar los componentes locales, el desfase de 3 horas de Uruguay respecto a UTC hace que el contrato o recibo de pago se imprima con fecha del día anterior a la noche.

### Hallazgo 1.2: `src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page.tsx:73`
- **Forma:** *El cartel de éxito sin esperar el resultado (Pregunta 10/12).*
- **Código:** Llamada a `navigator.clipboard.writeText` sin `await` ni manejo de error.
- **Qué pasaría:** Al exportar o compartir el reporte financiero y de rentabilidad, la pantalla anuncia éxito y el enlace no fue copiado si el navegador bloqueó el portapapeles, dejando al operador sin feedback real.

### Hallazgo 1.3: `src/app/(app)/empresa/activos-fijos/reporte/page.tsx:62`
- **Forma:** *El cartel de éxito sin esperar el resultado.*
- **Código:** `navigator.clipboard.writeText` sin `await` ni `try/catch`.
- **Qué pasaría:** El reporte de valoración de activos fijos de la empresa no se copia si falla el portapapeles y el cartel dice que sí.

### Hallazgo 1.4: `src/app/(app)/empresa/insumos/reporte/page.tsx:65`
- **Forma:** *El cartel de éxito sin esperar el resultado.*
- **Código:** `navigator.clipboard.writeText` sin `await` ni captura de error.
- **Qué pasaría:** En el reporte de inventario e insumos valorizados, el operador cree haber copiado los datos al portapapeles para el informe contable pero el portapapeles no los recibió.

---

## 2. Comida, Menús, Alergias y Catering

### Hallazgo 2.1: `src/app/(app)/empresa/menus/reporte/page.tsx:66`
- **Forma:** *El cartel de éxito sin esperar el resultado.*
- **Código:** `navigator.clipboard.writeText` sin validación.
- **Qué pasaría:** En la exportación del reporte de menús gastronómicos y costos por plato, se anuncia copiado al portapapeles sin verificar si se pudo escribir.

### Hallazgo 2.2: `src/app/(app)/fiestas/nueva/alergias/page.tsx:118`
- **Forma:** *El cartel de éxito sin esperar el resultado.*
- **Código:** Compartir lista de restricciones alimentarias y celíacos vía `navigator.clipboard.writeText`.
- **Qué pasaría:** La lista crítica de comensales con alergias graves y celiaquía no se copia al portapapeles del chef o encargado de cocina, pese a que la interfaz muestra el aviso de éxito.

---

## 3. Permisos, Seguridad y Administración

### Hallazgo 3.1: `src/app/(app)/admin/page.tsx:345`
- **Forma:** *El cartel de éxito sin esperar el resultado.*
- **Código:** Copiado de credenciales o accesos administrativos con `navigator.clipboard.writeText` sin captura de fallo.
- **Qué pasaría:** El administrador intenta copiar un enlace o token de acceso y asume que está en el portapapeles; si el portapapeles falla por permisos del navegador, se pierde la referencia.

### Hallazgo 3.2: `src/app/(app)/customers/reporte/page.tsx:63`
- **Forma:** *El cartel de éxito sin esperar el resultado.*
- **Código:** Copiado de enlaces con datos confidenciales de clientes en reportes comerciales.
- **Qué pasaría:** Falsa confirmación de copiado de datos de clientes.

### Hallazgo 3.3: `src/app/(app)/fiestas/nueva/gestion-documental/cambio-fecha/page.tsx:168`
- **Forma:** *El cartel de éxito sin esperar el resultado.*
- **Código:** Enlace de confirmación de cambio de fecha contractual del evento copiado sin validación de resultado.
- **Qué pasaría:** El documento legal de adenda de cambio de fecha no se copia al portapapeles pero se le notifica al usuario que sí.

---

## 4. Estado de las Áreas Propias (Gemini)

- **Entretenimiento y Pantallas Públicas:**
  - `src/app/(app)/fiestas/nueva/entretenimiento/page.tsx:2219, 2230`: Enlaces de operador e invitado corregidos con feedback veraz y fallback manual si el portapapeles falla.
  - `src/app/(app)/fiestas/nueva/decoracion/pdf/page.tsx:68`: Botón de compartir corregido con soporte de fallback si `navigator.share` o portapapeles fallan.
  - `src/app/(app)/fiestas/nueva/carga-operativa/pdf/page.tsx:151`: `navigator.share` protegido con `await` y fallback a WhatsApp directo.
  - `src/app/evento/accesos/[fiestaId]/page.tsx:173`: Limpieza de escáner QR documentada con motivo (`no pasa nada si falla`).
  - `src/app/evento/galeria/[fiestaId]/page.tsx`: Autoplay de video y carga opcional de caras documentados con motivo explícito.
  - `src/lib/entretenimiento/tira-fotocabina.ts`: Detección de `roundRect` en canvas actualizada sin apagar el revisor de tipos (`'roundRect' in ctx`).
  - `src/lib/automatico/parte-manana.ts:109`: Formateo de fecha de evento alineado con `formatearFechaEvento` para evitar desfasaje UTC.
