# Deploy retry

Este archivo dispara una nueva PR limpia después de corregir errores de typecheck que bloquearon Firebase App Hosting.

Correcciones ya incluidas en main:

- `backup-readiness.ts`: reducer tipado para evitar `sum is possibly undefined`.
- `client-portal-summary.ts`: reducers tipados para evitar `sum is possibly null or undefined`.

No cambia lógica de la aplicación.
