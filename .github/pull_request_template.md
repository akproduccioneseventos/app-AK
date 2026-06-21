## Descripción del Cambio
<!-- Describe detalladamente los cambios introducidos en esta Pull Request y por qué son necesarios. -->

## Tipo de Cambio
- [ ] Corrección de errores (bug fix)
- [ ] Nueva funcionalidad (feature)
- [ ] Refactorización / Optimización
- [ ] Actualización de documentación / Configuración

## Lista de Verificación (Checklist) antes de solicitar revisión
- [ ] Ejecuté `npm run typecheck` localmente y no hay errores de TypeScript.
- [ ] Ejecuté `npm run lint` y el formateo de código es correcto.
- [ ] Ejecuté `npm run graphify:update` si se añadieron nuevos archivos, componentes o dependencias importantes para mantener actualizado el grafo para las IA.
- [ ] Probé los cambios localmente en los Emuladores de Firebase (`npm run dev:local` / `npm run dev:firebase`).

## Impacto en Firebase
- [ ] Afecta reglas de Firestore / Seguridad.
- [ ] Modifica Cloud Functions (requiere despliegue de funciones).
- [ ] Modifica Hosting / Frontend.
- [ ] Requiere variables de entorno adicionales (`.env`).
