# 54 - El portal del cliente: itinerario con visibilidad y redacción personalizada

**9 de septiembre de 2026.**

## Qué pasaba

En el itinerario de la fiesta, el equipo necesitaba coordinar momentos operativos internos (revisiones técnicas de sonido, armado de cables, tiempos de prueba de cocina) que no deben exponerse a los clientes e invitados. Al mismo tiempo, el equipo necesita poder redactar una explicación cálida y comprensible para el cliente, sin exponer las notas técnicas del operador o coordinador.

## Lo que se resolvió

1. **Interruptor de visibilidad para el cliente (`Switch`)**:
   En cada momento del itinerario del organizador (`src/app/(app)/fiestas/nueva/itinerario/page.tsx`), se agregó un interruptor directo tanto en la tarjeta de cada momento como en el modal de edición para alternar `visibleParaCliente`. Los momentos ocultos muestran un indicador visual claro ("Oculto cliente") y se guardan automáticamente.

2. **Texto redactado especialmente para el cliente (`descripcionCliente`)**:
   En el modal de edición de cada momento, se habilitó un campo de texto independiente para redactar el mensaje que leerá la familia, separado de la descripción técnica interna reservada para el equipo organizador.

3. **Filtrado estricto en el portal del cliente**:
   En `src/app/portal-cliente/[id]/page.tsx` y `src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx`:
   - Se filtran todos los momentos donde `visibleParaCliente === false`.
   - Se prioriza `descripcionCliente` sobre la descripción interna al mostrar la información.
   - Si no hay momentos visibles, el cronograma no se muestra o indica adecuadamente su estado.

4. **Persistencia atómica**:
   `updatePrograma` en `src/app/actions/fiesta/itinerario.actions.ts` actualiza exclusivamente la clave `programa` mediante `updateFiestaPartial`, evitando pisar datos concurrentes de otros módulos de la fiesta.

```comprobar
usa: visibleParaCliente en src/app/(app)/fiestas/nueva/itinerario/page.tsx
usa: descripcionCliente en src/app/(app)/fiestas/nueva/itinerario/page.tsx
usa: visibleParaCliente en src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx
prueba: src/__tests__/itinerario-portal-cliente.test.ts
```
