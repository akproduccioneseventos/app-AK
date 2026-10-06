# Auditoría 73: retest de 1260 y continuación

6/10/2026. Fuente main `368988bb64e823d31c9d5c4b2fb9adc114b207ef`.
Rama documental `codex/auditoria-73-20261006`, creada desde ese main.
#1259 y #1260 fusionadas; consulta de propuestas abiertas: ninguna al iniciar.
No código de app modificado, build ni fusión ejecutados por Codex.

## Área: plata/permisos · Commit: 368988bb64e823d31c9d5c4b2fb9adc114b207ef

**Hallazgo nuevo: CAMPO73-RACE, P1.** Guardado genérico de fiesta comprueba
plata sobre una lectura anterior; un cobro intercalado antes del guardado se
pisa. Cuatro variantes reproducidas: operador/cliente, entero/parcial.
`saveFiesta` y `updateFiestaPartial`, `fiesta.actions.ts` 270-331. Consumidor
de configuración verificado hasta la pantalla: orden 124, bloque A.

Pruebas del arreglo anterior: **2 suites / 21 casos pasan**, ejecutadas con
acciones reales y almacenamiento/perfiles ficticios. Incluyen rechazo de
cambio explícito del operador/cliente, preservación de cobros del guardado
entero, cambios legítimos, compras simultáneas y presupuesto nuevo sin cobros.
CAMPO01/02 directos y COMPRA01: **corrección presente y prueba focal aprobada**,
no aceptación HTTP o despliegue verificado. No duplicar sus órdenes.

La sonda nueva ejecuta también `syncToFirestore` real. Sólo se simulan lecturas,
sesiones y el documento Firestore con semántica `merge:true`; no usa Firebase,
credenciales, datos reales ni la acción de cobro. Asserts verdes aquí significan
que el defecto se reprodujo. Control: omitir el plan en el parcial conserva el
cobro concurrente; cambio explícito sin permiso se rechaza sin escribir.

## Área: web · Commit de fuente: 368988bb64e823d31c9d5c4b2fb9adc114b207ef

**Hallazgo nuevo: GAL73, P2.** Click real del menú Galería HD abre
`https://galeria.akproducciones.uy/me`, tarjeta de contacto sin imágenes.
`LandingNav.tsx:63`, consumidor `src/app/page.tsx:705`. Evidencia de navegador
público y captura adjunta; SHA del despliegue no confirmado. La fuente del
enlace coincide con la última tanda. No se cambió el sitio externo ni se
enviaron formularios/mensajes. Decisión de destino consultada y pendiente.

## Pendientes que NO son hallazgos nuevos

- RED03 de 122: el guardado de la galería de videos no cambió en #1260; sigue
  pendiente. No ejecutar una segunda orden del mismo arreglo.
- Los cuatro casos de 123 siguen pendientes. Comparación `7c96e114..368988bb`:
  acciones de barra y plantillas de salón sin cambios; MiniQuiosco sólo muestra
  `result.error`. No cambia el token, la autorización del reintento, los botones
  de preparando ni la escala. No repetir sondas por ese cambio de texto.
- Se recuperaron en esta rama los documentos/evidencias 72 ya entregados en
  `b6ab4992`, sin rehacerlos. La evidencia 71 permanece en main.
- Revisión económica delegada del nuevo video/tótem: sin otro fallo demostrado
  en lectura de acciones/consumidores. No prueba permisos reales, cámara,
  concurrencia de Firebase, reproducción ni entrega. No marcar esa área limpia.

## Evidencias y límites

Resultados originales comprimidos y hashes en `73-resultados/manifest.json`.
Sonda `73-guardado-concurrente-probe.cjs`; orden única nueva 124.
El resultado general previo de 603 suites / 3490 corresponde a `e52c078`,
no se transfiere como resultado nuevo. Las 32 de 72 corresponden a `7c96e114`.
Claude informó puerta completa verde en #1260 sobre `7dfba1da3`; **dato aportado
por Claude en la PR**, no ejecución independiente ni logs revisados por Codex.

Siguen pendientes servidor aislado estable/114, recorridos privados completos,
proveedores externos autorizados, conciliación de 19 importados contra
originales, catálogo real y pruebas físicas. Un pendiente de evidencia no es
un defecto nuevo. No certificado "sin errores", ninguna área integral aprobada
por esta revisión acotada. Claude compila, dueño fusiona.
