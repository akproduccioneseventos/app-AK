# Orden 136 - El cliente no ve sus entregas oficiales

Para Claude (contrato de datos y privacidad); Gemini no rehace la pantalla.
Codex revisa/registra; Claude compila. No fusionar automaticamente.

Area: portal cliente. Commit: `1b61295ab977fd6f204ffdab0f190edbd0f0ed6b`.
Tanda abierta contrastada: PR 1277 documental, HEAD `db355db3`, sin arreglo de
estos consumidores. Main incorporado a la rama de evidencia, no producto nuevo.
Si aparece una entrega posterior, contrastarla ANTES de volver a programar.

**PORTAL86-ENTREGA (P1):** un servicio con nombre, estado Entregado completo y
linkEntrega existe en la fiesta, pero el cliente ve "Aun no hay servicios de
fotografia o filmacion oficiales registrados". No puede abrir la entrega.

Reproduccion: `docs/evidencias/86-entrega-portal.spec.ts`, copia aislada de main,
cookie y clave de portal reales firmadas con secreto ficticio, sin sesion del
equipo. La pagina acepta el evento y muestra sus notas generales. Falla al
buscar "Album oficial A86". Captura/raw/contexto en `86-plan-portal-*`.
El enlace apunta a un PDF ficticio local creado por la sonda; nunca se uso un
archivo real de un cliente. NO se llego al clic/descarga: no afirmar PDF aceptado.

Cadena exacta:
- `initializePortalSession` y `getFiestaForPortalSession` en
  `src/app/actions/fiesta/portal.actions.ts` aceptan la sesion y usan el mapper.
- `mapFiestaToClientPortal` en `src/lib/client-portal/public-fiesta.ts:144`
  deja de fotografiaYFilmacion SOLO notasGenerales; descarta servicios.
- `FotosVideoPortalPage` en `src/app/portal-cliente/[id]/fotos-video/page.tsx`
  lee `fiesta.fotografiaYFilmacion?.servicios ?? []` y, al recibir vacio,
  muestra el mensaje de que no hay servicios. La UI ya tiene el enlace de entrega.
- `ServicioFotografia` existe en `src/types/fiesta.ts`: id, nombre, estado,
  fechaEntregaEstimada, linkEntrega, notas. No hace falta inventar otro contrato.

Corregir el mapper con una lista explicita de campos aptos para el cliente;
conservar restricciones de otras areas, otra fiesta, costos, sueldos, claves y
notas internas. No devolver la fiesta entera ni usar sesion del equipo para
hacer aprobar el portal. Validar el enlace conforme a la politica existente.

Aceptacion: con el mismo fixture, nombre/estado/enlace visibles, clic real
recupera PDF200/MIME/bytes correctos, recarga conserva la entrega, otra clave no
ve datos y el resultado no modifica la fiesta. Agregar prueba del mapper y del
consumidor; la sonda actual debe pasar sin modificarla para esconder el defecto.
Que no haya servicio realmente debe seguir mostrando el vacio honesto.

```comprobar
archivo: src/lib/client-portal/public-fiesta.ts
usa: mapFiestaToClientPortal en src/app/actions/fiesta/portal.actions.ts
archivo: src/app/portal-cliente/[id]/fotos-video/page.tsx
usa: getFiestaForPortalSession en src/app/portal-cliente/[id]/fotos-video/page.tsx
prueba: docs/evidencias/86-entrega-portal.spec.ts
```
