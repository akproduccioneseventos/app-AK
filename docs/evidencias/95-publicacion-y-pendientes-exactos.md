# Auditoria95 - Contraste de publicacion y cierre sin repetir pruebas

Area: entrega/publicacion (transversal) · Commit:
9a054620718673f00e10b52f0811cc1af729ba4e.
Hallazgos nuevos de producto: ninguno en ESTE contraste de metadatos;
no significa que toda la app sea correcta. Persisten los negativos93-94.
NO CONTRASTADO CON TANDA DE PROGRAMACION LOCAL NO SUBIDA.

## Lo comprobado ahora

- Main remoto sigue9a054620; unica PR abierta accesible1286 es QA/documentacion,
  head1e0fb757 al iniciar esta revision. No correccion nueva subida144-147.
- Health publico HTTP200 sigue declarando0af74652, compilado10/10/2026
  02:07:17Z. El contraste de git encuentra38rutas de producto diferentes.
- src/app/api/health/route.ts/GET devuelve NEXT_PUBLIC_AK_VERSION. Esa version
  se graba en scripts/build-next-with-memory.mjs/versionDelCodigo desde variables
  de build o git. **No es una lectura independiente de la revision de Hosting**:
  Claude debe contrastar fuente/log y revision; una variable stale puede mentir.
- GET anonimo de /api/asistente/voz-en-vivo devuelve307/login. No demuestra que
  exista o no la nueva ruta; no se hizo POST, no se pidio ficha ni microfono.
- GitHub deployments devuelve lista vacia. NO prueba ausencia de despliegue
  Firebase. No se inspeccionaron Actions rojos ni facturacion.
- docs/codex/areas.json tiene0areas limpias. Sin-revisar NO significa que no
  haya pruebas de partes del area: tampoco hay permiso para marcarla completa
  por juntar aprobaciones parciales. No se cambio el contador.

Raw95-publicacion.json y runner95-contrastar-publicacion.mjs preservan el
contraste reproducible. SOLO lecturas publicas/git/API GitHub; no secretos,
datos de clientes, envios, pagos, escritura de base ni publicacion.

## Que difiere del codigo declarado por Hosting

No se volvio a auditar ni a encargar lo siguiente:

| Criterio corregido en main | Commit de producto | Evidencia reutilizada |
| --- | --- | --- |
| Compra convierte unidades139 | 8a7e20f4 | integrado92 y Jest94 |
| Fotocabina conserva cuadro real140 | b748642c/b2434efe | fotografia/pixels/bytes94 |
| Album entrega formatos y no ZIP falso141 | 3942cc56 | PCmovil/reintento final94 |
| Recibos centavos/reemplazo/fecha142 | a1de41d8 | seis ejecuciones PCmovil94 |
| Credencial revocada y ubicacion143 | 8e789b6e | lector abierto/geo nativa94 |
| Voz en vivo, permisos y asistente nuevos | ade5450f/d01c8c0c/1330d33b/db96aa73 | unitarias94; voz widget FALLA146, no aceptar todo |

Si la version declarada refleja de verdad la revision publicada, esos cambios
NO estan en esa revision. Esta es una explicacion verificable de parte de la
diferencia entre ver arreglos en git y seguir viendo fallos en la web; no la
causa demostrada de TODOS los errores. Si la etiqueta no es fiable, resolver
el contraste de metadata antes de volver a programar cosas ya corregidas.

## Lista restante concreta: accion y quien la acepta

1. **144espejo /145Touchpix:** arreglar o aportar SHA corregido. Reusar sondas93
   de moderacion caida y contenido de la misma senal, no probar otro escenario
   y llamarlo cierre. Gemini; Claude moderacion/permisos y compilacion.
2. **146voz (dos fallos) /147QR:** contrastar tanda local y corregir consumidor.
   Repetir SOLO cancelacion/reintento y descargar PNGORIGINAL al lector real;
   el control con borde no es aceptacion. Gemini, Claude costos/permisos/build.
3. **3D:** no hay delta en piezas causales desde negativo88. No repetir error
   reconciler identico; cuando llegue entrega, probar canvas/pixels/movimiento,
   persistencia y cliente PCmovil. Foto de respaldo no es un 3D aceptado.
4. **Video de Vida lector final:** archivo/reemplazo/HTTPbytes aprobados92;
   falta recarga visual con URL publicable real en staging autorizado. No
   cambiar permisos ni exponer credenciales por limitacion de emulador.
5. **19originales:** export de SOLOLECTURA autorizado + documentos originales.
   Conciliar cliente/fecha/invitados/servicios/total/pagos/fiesta/estado, sin
   inventar importacion ni usar JSONlocal0 como ausencia. Claude revisa dinero.
6. **Integraciones:** cuentas autorizadas y entrega final observable de correo/
   recuperacion/Gmail, canales sociales/galeria, IA/voz y MercadoPago. Registrar
   permiso, peticion, resultado y consumidor. Probar en test cuando exista,
   acordar antes acciones reales/costos; health/mocks NO cierran esto.
7. **Release mismoSHA:** Claude contrasta metadata/fuente de Hosting; cuando
   la tanda este lista, build final UNA vez, deploy autorizado y comprobar SHA
   + recorridos afectados en esa revision. No fusionar PR1286 automaticamente
   ni publicar ahora codigo con negativos abiertos por apurar el contador.
8. **Ensayo fisico final:** hardware360/camara/espejo/impresora/totem/barra,
   voz/audio/GPS reales. Reservado por el dueno para DESPUES; no fingirlo con
   pistas nativas falsas de Chromium.

La lista sintetiza los huecos especificos conocidos, NO prueba que nunca haya
otro defecto ni inventa una auditoria de todos los botones/roles. No crear
otra tanda para las correcciones144-147 existentes; su informacion ya esta
en ordenes y se agrupa con QA en PR1286. Aceptaciones84/88-94 conservadas,
solo se reabren si cambia codigo causal/entorno relevante.

## Limite final

No ejecutar nuevamente143Jest/20positivas porque el SHA no cambio. No build,
emuladores, dependencias ni agentes nuevos para este contraste pequeno.
No nuevas ordenes de producto: falta validar/corregir las existentes.
No14areaslimpias, no0errores, no certificados basados en presencia de archivos.
