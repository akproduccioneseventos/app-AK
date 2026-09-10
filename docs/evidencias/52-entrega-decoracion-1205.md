# Decoracion: descarga y entrega al cliente

Codex, 2026-09-09. PR1205, SHA `1b65b7c585c26fe14ac4f8c8d7bc7738e408dcac`.
HEAD confirmado; Graphify y YA-RESUELTO consultados. Se reutilizan las 19 pruebas
del contraste anterior, sin repetirlas. No hay cambios de app, build ni merge.

## Evidencia adicional

Sonda `52-sondas-entrega-decoracion.cjs`: **5 FAIL y 1 PASS**, salida1 por assertions.
Callbacks/proyecciones reales extraidos por AST; estado, captura, descarga y servidor
simulados. Sin errores del instrumental, red, IA paga o datos reales. No es E2E/GPU.
DECO-09/10/11 completan pendientes existentes de orden52; no cinco modulos nuevos.

| Caso | Resultado y consecuencia |
| --- | --- |
| DECO-09 FAIL | handleExportPng solo avisa; cero descargas. El organizador no obtiene el PNG prometido |
| DECO-10 FAIL | handleCapture3D anuncia guardado en portal despues de success:false |
| DECO-11 FAIL | Editor cambia paletaColores a #123456; propuesta muestra colorPalette anterior #222222 |
| DECO-12 FAIL | mapFiestaToClientPortal elimina salonPreview3dUrl; vista activa tampoco lo consume |
| DECO-13 FAIL | Notas presentadas como del equipo llegan al cliente en proyeccion y vista |
| PRESERVE PASS | Costo interno del fixture sigue excluido de esa proyeccion |

Ubicaciones en el SHA indicado:
- `src/app/(app)/fiestas/nueva/decoracion/page.tsx`: handleColorChange:292,
  handleExportPng:668; campo generalNotesDecoracion:1262 dice notas para el equipo.
- `src/app/(app)/fiestas/nueva/invitados/layout/page.tsx`: handleCapture3D:516-526.
- `src/app/portal/[fiestaId]/decoracion/page.tsx`: palette:143 lee colorPalette.
- `src/lib/client-portal/public-fiesta.ts`: proyeccion de decoracion.
- `src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx`: imprime nota:1403,
  no consume salonPreview3dUrl. Es la vista activa, no PublicPortalView antiguo.

La captura SI aparece en `src/app/portal-cliente/[id]/page.tsx:1162`; eso no prueba
que llegue a `/portal/c/[accessKey]`. No arreglar el portal antiguo para dar por
arreglado el actual. Falta comprobar ambos recorridos con sesion autorizada.

## Correcciones dentro de la misma orden52

**Gemini:** descarga real del diseno sin controles; propagar fallo de captura y
autoguardado, conservar trabajo y permitir reintento; paleta compatible en editor,
propuesta, escena e IA. La escena actual YA prioriza paletaColores: conservarlo.
No migrar masivamente colores de fiestas historicas ni duplicar sistemas de diseno.

**Claude:** confirmar con el dueno si el campo de notas es interno o publico: la
interfaz y la publicacion hoy se contradicen. Separar nota interna de descripcion
aprobada para cliente; no copiar notas historicas automaticamente a texto publico.
Filtrar en servidor, no solo ocultar en pantalla. Mantener costos fuera.

**Ambos:** entregar captura al portal activo solo si esta guardada, autorizada para
esa fiesta y destinada al cliente. Claude controla proyeccion/permisos; Gemini la
presenta. No exponer el objeto entero de decoracion para recuperar un campo ni
publicar todos los borradores. Consultar al dueno antes de cambiar aprobaciones.

## Aceptacion pendiente en navegador

1. PNG abre completo y sin controles; probar fotos remotas y fallo de exportacion.
2. Guardado fallido no anuncia enviado; reintento persiste y sobrevive recarga.
3. Paleta manual, preset y historica coherentes en editor y ambos portales.
4. Cliente ve su captura publicada; otro evento no; borrador no se publica.
5. Nota interna ausente de respuesta/HTML; descripcion publica aprobada si.
6. PC/movil y fotos reales, sin cortes ni promesas falsas. GPU pendiente.

No se certifica privacidad completa, Firebase, UX ni despliegue. Los cuatro FAIL
del contraste previo siguen vigentes en este SHA. No son nueve modulos distintos.

```powershell
node docs/evidencias/52-sondas-entrega-decoracion.cjs C:/Users/Usuario/Desktop/app/app-AK/node_modules/typescript C:/Users/Usuario/Documents/Codex/ak-contraste-1205-1b65b7c
```
