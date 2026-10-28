# Orden254 - Incorporar biblioteca visual AK de86 decoraciones

28/10/2026. Solicitud del dueno: elementos para moduloDecoracion.
Gemini implementa;Claude valida seguridad/compila/fusiona. Codex NO appedit/merge.
Antes de tocar contrastar HEAD de tanda activa: fuente examinada76855a1d(PR1371),
base0abe9199. NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS.
No mezclar arreglos de foto253 con nueva importacion sin conservar sus pruebas.

## Material comprobado y limites
Carpeta LOCAL C:/Users/Usuario/Downloads/AK_DECORACIONES_TODO_CORREGIDO.
00_INSTRUCCIONES/catalogo.json,86IDs/86rutas/14categorias;86PNG con alfa y
pixeles transparentes,19.548.856bytes,0faltantes/0dimensionesincorrectas/
0duplicadosbinarios. Evidencia756 conSHA256delcatalogo.
Usar SOLO01_IMPORTAR_APP ycatalogo, NO02_HISTORIAL_NO_IMPORTAR.
03_VISTAS_PREVIAS es referencia, no elemento para colocar.
Material AUN NO SUBIDO alrepo ni importado porCodex. No afirmar disponibilidad
en un entorno que no accede aDownloads; entregar assets por canal delrepo aprobado
junto con implementacion antes de darlo por integrado. No rutasC:en el clienteweb.

PNGson2D con fondo transparente, NO GLB/GLTF ni malla3D. Pixeles NOson metros.
README advierte recreaciones/simplificaciones y carteles personalizadosde muestra.
No crear medidasfisicas/stock/precios/fidelidad a objetos reales ni cotizarlos.
No alterar comida/catalogodecatering por las imagenes de tortas.

## Reusar editor existente, no crear otro
- DecoElementLibrary.tsx:LibraryElement ya tiene isCustom/imageDataUri.
- decoracion/page.tsx:handleAddLibraryElement ya preserva imagen personalizada.
- types/fiesta.ts:ElementoDecorativo tiene imagen,posicion,escala,rotacion,capas.
- DecoCanvas.tsx ypreviewdeLibrary vacian src salvo startsWith(data:image/).
  Por eso copiarPNG apublic yponer URL NO funciona hoy. Adaptar ambas fronteras
  usando fuente local/assetIDpermitido, conservando dataURIlegado. No aceptar
  cualquierURLexterna/javascript/SVG remoto por quitar el filtro.
- Revisar VistaDecorativaEditor/exportPNG para resolver el MISMOasset y conservar
  transparencia/persistencia. Si alguna vista no lo admite, declararlo.

## Criterios de entrega
1. Biblioteca86elementos agrupados/buscables por categoria y nombre, IDs estables
   con namespace para no pisar existentes. Reimportar NO duplica.
2. Al elegir se ve el OBJETO correcto, se coloca/mueve/escala/rota/cambia capa,
   y tras guardar/recargar sigue el mismoasset ytransformacion.
3. Preservar elementos SVG ypersonalizados de fiestas existentes. No migracion
   masiva de datos ni escritura en19presupuestos originales.
4. Assets servidos porapp/almacenamiento aprobado, no86base64 completos en cada
   documento de fiesta ni cargarlos todos al entrar. Busqueda/previewsligeros/
   carga diferida, manejar missingimage sinplaceholderengañoso.
5. No convertir esto en3Dreal con promesa falsa. Si se propone panel2D en escena3D,
   identificarlo como representacion plana; geometria fisica requiere otraentrega.
6. PNGfinal exportado incluye transparencias/objetos correctos sin CORSbloqueado.
   ProbarPCyPixel7 conletraA/arco/sillon/torta, nombres/categorias/recarga.
7. No publicar carteles con nombres de muestra como personalizacion real.
8. Registrar YA/ESTADO, fuenteSHA/pruebas/limites, unaentregaconassets+codigo.
   Tests siguientes PROPUESTOS/PENDIENTES; Codex no los ejecuto por existirorden.

```comprobar
archivo: src/components/decoracion/DecoElementLibrary.tsx
usa: DecoElementLibrary en src/app/(app)/fiestas/nueva/decoracion/page.tsx
archivo: src/components/decoracion/DecoCanvas.tsx
usa: DecoCanvas en src/app/(app)/fiestas/nueva/decoracion/page.tsx
archivo: src/components/decoracion/VistaDecorativaEditor.tsx
usa: VistaDecorativaEditor en src/app/(app)/fiestas/nueva/decoracion/page.tsx
prueba: src/__tests__/biblioteca-ak-decoraciones-importacion.test.ts
prueba: tests/e2e/biblioteca-ak-decoracion-persistencia.spec.ts
```

