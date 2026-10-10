# Orden 137 - Una foto por recuadro y cierre real de carga

9/10/2026. Fuente ejecutada/contrastada:
main `1b61295ab977fd6f204ffdab0f190edbd0f0ed6b`.
Tanda abierta PR1277, HEAD documental131dbd30, sin arreglos de estos dos puntos.
Trabajo local de otras IA no subido: NO CONTRASTADO CON LA TANDA.
Contrastar entrega posterior antes de implementar; no duplicar orden69/VID03.
Codex audita/registra; Gemini reemplazo/consumidores; Claude permisos. Claude
compila el conjunto. Una sola entrega con estos dos puntos, sin fusion automatica.

## VID87-REEMPLAZO - P2, Gemini

Recorrido real `/video-vida/<fiestaId>`, sin cookie del equipo:
1. Subir PNG en recuadro1.
2. Reemplazarlo con JPG distinto en el MISMO recuadro.
3. La pantalla indica una foto; Storage conserva `01.png` Y `01.jpg`.

`87-video-vida-reemplazo.spec.ts` ejecuto las dos subidas reales y comprobo
bytes/MIME de cada objeto por SDK contra Storage demo. La asercion una-foto
falla con dos nombres. Resultado `87-video-vida-reemplazo-resultados.json`.
El consumidor `getLifeStoryVideoPhotos` lista ambos; las pantallas buscan el
primero que corresponde al numero, y el ZIP consume la lista. La consecuencia
de entregar ambos o reabrir una foto vieja es inferencia de esa cadena verificada:
NO se descargo ese ZIP ni se aprobo el reload de lista en esta sonda.

Causa exacta: `saveLifeStoryVideoPhoto` en
`src/app/actions/fiesta/video-vida.actions.ts` crea nombre numero+extension;
no representa el recuadro como un solo recuerdo vigente.

Corregir identidad del recuadro independiente del formato, conservando MIME y
bytes correctos, calidad y orden. No borrar primero la vieja: si falla la subida
o confirmacion, conservar la foto vigente y avisar. Resolver cambios concurrentes
en el MISMO recuadro sin perder otras fotos, fiesta ni datos de dinero. No dejar
una vieja como vigente tras confirmar la nueva. Usar mecanismos locales existentes,
no otra galeria/framework. Limpieza de duplicados historicos requiere criterio
explicito y aprobacion antes de borrar archivos reales; no aplicarla en produccion
como parte de la sonda. TOPE_DE_FOTOS sigue50, no aumenta costos ni limites.

Aceptacion pendiente tras arreglo: misma sonda pasa con UNA imagen vigente;
PNG->JPG y JPG->PNG, dos reemplazos simultaneos y otro recuadro intacto; corte
conserva la anterior. Cliente recarga y ve la ultima confirmada; equipo descarga
ZIP real con esa imagen una sola vez y bytes/MIME correctos. VID03 (faltantes,
ZIP no vacio, nombres y rutas permitidas) debe seguir pasando; no rehacerlo.

## VID87-CIERRE - P1, Claude

1. Cliente abre pagina con galleryEnabled=true, sin sesion del equipo.
2. El fixture propio se deshabilita en JSON y Firestore demo; lectura SDK
   confirma galleryEnabled=false.
3. Esa pantalla abierta sube una foto: aparece `01.png` en Storage real emulado.

Segundo caso de la misma sonda, resultado
`87-video-vida-revocacion-resultados.json`: se esperaba0, queda1.
El primer intento espero el fin del stream Next y agoto60s; NO usar ese timeout
como defecto. La reproduccion corregida observa escritura real o rechazo visible
y confirma objeto persistido en5.9s. Raw del intento anterior separado.

La pagina nueva verifica galleryEnabled al abrir, pero el servidor sube antes de
leer/verificar fiesta y no rechaza al estar deshabilitada. Comprobar existencia,
estado actual y numero permitido de ESA fiesta antes de guardar, en el servidor,
manteniendo la subida PUBLICA aprobada por el dueno; no exigir login del equipo
al cliente ni abrir permisos globales. Rechazo claro, sin objeto huerfano ni exito
falso. Proteger llamadas directas y pantalla antigua. No confiar solo en la UI.

Aceptacion pendiente: sonda pasa, falta de fiesta/deshabilitada rechaza sin escribir,
pagina abierta muestra aviso y recupera controles; fiesta habilitada sigue subiendo.
Otra fiesta y configuracion no cambian. Ensayo real autorizado solo DESPUES de
la aceptacion emulada, no tocar datos ni archivos de clientes para demostrarlo.

## Limites

No proveedor real ni ZIP integrado en esta prueba. Storage emulado; listados con
URLs firmadas requieren aceptacion aparte, no simular que la descarga paso.
Ruta `/evento/video-vida/<id>` es del equipo y pide login por decision registrada:
primer intento hacia esa ruta fue MI error de recorrido, no bug de acceso.
La ruta publica compartida por el editor es `/video-vida/<id>`, verificada.
No incluir seis pendientes IA de135 ni portal136 como si estos los arreglaran.

```comprobar
archivo: src/app/actions/fiesta/video-vida.actions.ts
usa: saveLifeStoryVideoPhoto en src/app/video-vida/[fiestaId]/page.tsx
prueba: docs/evidencias/87-video-vida-reemplazo.spec.ts
archivo: src/app/actions/fiesta/video-vida.actions.ts
usa: getLifeStoryVideoPhotos en src/app/(app)/fiestas/nueva/video-vida/page.tsx
usa: getLifeStoryVideoPhotos en src/app/api/video-vida-photos/[fiestaId]/download/route.ts
prueba: src/__tests__/video-vida-descarga-avisa-lo-que-falta.test.ts
prueba: src/__tests__/video-vida-cierre-y-reemplazo.test.ts
```
