# Para Codex: la PR #1128 no se puede fusionar

**Escrito:** 23 de agosto de 2026.

Tu PR #1128 no se puede fusionar, y el motivo no es el conflicto: la rama
`codex/auditoria-contable-lanzamiento` **NO COMPARTE HISTORIA** con `origin/main`.

**Comprobación:**
- `git merge origin/main` responde *"refusing to merge unrelated histories"*.
- `git merge-base origin/main <rama>` no devuelve nada.
- El segundo commit de la rama es el merge de la PR #583; main va por la #1128.

**Conclusión:** la rama salió de una copia vieja del proyecto, no de main.
Fusionarla borraría el trabajo de los últimos días. Y tus controles (2165 pruebas
en verde) se corrieron sobre una app que no es la actual.

## Qué hay en main que tu rama no tiene, y no se puede perder

- **El despertador**: tarea programada cada 15 minutos en `functions/src/index.ts`
  llamando a `/api/cron-despachador`, **más el paso de despliegue** en
  `.github/workflows/deploy.yml` que la publica. Sin ese paso queda escrita y no
  corre. **Tu PR toca los dos archivos: cuidado.**
- Las estaciones sin internet (IndexedDB, cola de subida, modo quiosco).
- Los cinco agentes autónomos y los avisos de errores humanos.
- La asistente con precios atados al catálogo.
- El arreglo del doble conteo en la rentabilidad por fiesta.
- El reloj del simulador (decisión de marketing del dueño, ver `CLAUDE.md`).

## Qué hacer

**1. Cerrá la PR #1128.** No intentes rebasar 2013 commits ni resolver el
conflicto: no hay nada roto en tu trabajo, está hecho sobre la base equivocada.

**2. Entregá primero LOS HALLAZGOS, no código.** Una lista, con:
- archivo:línea
- qué está mal
- qué ve el usuario en pantalla
- por qué importa para el negocio

Se verifican contra main de hoy y se descartan los que ya estén resueltos.

**3. Recién después, el arreglo, sobre la base correcta:**

```
git fetch origin main
git checkout -B fix/<nombre-descriptivo> origin/main
```

Y **UNA SOLA propuesta** con todo. Cada fusión dispara un despliegue y se paga.

## Reglas del proyecto (están en `CLAUDE.md`, leelas antes)

- **NO SE CAMBIA LO QUE YA FUNCIONA.** Una auditoría propone, no manda. Si algo
  anda y el dueño no lo pidió, no se toca: se anota en una línea y decide él.
- **No se tocan textos que ve el cliente** ni decisiones de marketing sin permiso.
- **El reloj del simulador NO SE SACA.**
- **El WhatsApp prepara mensajes; no los manda.**
- **Ningún precio se inventa**: salen del catálogo.
- Si tocás o agregás pantallas, corré `npm run mapa:generar` y anotá lo hecho en
  `docs/YA-RESUELTO.md`, en la misma propuesta.

## Sobre lo que reportaste como bloqueo

Los controles rojos de GitHub son **por facturación de la cuenta**, ya está
decidido: no se investigan. Lo que vale es la verificación local. El build largo y
el E2E que no arranca son **del entorno, no de la app**: en el contenedor de Claude
las 598 pruebas de navegador corren y pasan.
