# Auditoria 81 - mural, captura y entrega con persistencia comprobada

Area: estaciones / invitado. Commit del build y servidor:
`497ee725cb4d8cce6d1c97422fd674cbbe86c051`, 9/10/2026. Puerto 3300,
datos ficticios, Firebase demo, emuladores Firestore 8085 / Storage 9195.
Main nuevo `1b57abbec5162402cc30269cc276398707b28d55` NO cambia los consumidores
social-gallery, fotocabina, muro-en-vivo ni data-service. No se recompilo ese main;
se conserva el resultado sobre el SHA original, sin anunciar otra version publicada.

## Resultado positivo concreto

- Fotocabina, prueba existente `tests/e2e/81-captura-reconexion-entrega.spec.ts`:
  captura real del boton con camara falsa, cola IndexedDB al perder conexion, guardado
  al reconectar, segundo reintento no duplica y una publicacion en mural. Movil paso
  en primera corrida; desktop paso al repetir sola (7.6 s). Sin equipo fisico.
- Mosaico: posts aprobados sembrados en la coleccion real del emulador, cuatro visibles
  en grande, mas de cuatro en chica tras cambiar configuracion y recargar.
- Rotacion: cambia efectivamente el autor mostrado dentro de 6.5 s con intervalo de 3 s.
  No basta que cualquier texto del muro sea no vacio: se compara contra el autor inicial.
- Invitado: selecciona imagen bitmap con detalle, pulsa Publicar, ve confirmacion,
  se persiste una fila y se descarga la URL del archivo del emulador: HTTP exitoso y
  cuerpo mayor a 100 bytes. No es solo una foto de interfaz ni un mock de subida.

Tres pruebas reforzadas en desktop y movil: **6 aprobadas, 35.2 s**.
`81-mural-emulador.spec.ts` se copio SOLO a `tests/e2e/` de la copia descartable.
Resultado: `81-e2e-mural-validado.json`. Captura de desktop + primera subida/mosaico:
`81-e2e-retest-desktop.json`, 3 aprobadas, 23.4 s.
Pantallas: `81-mosaico-*.png`, `81-rotacion-*.png`, `81-subida-*.png`.

## Fallos originales y por que no se cuentan como defectos demostrados de la app

`81-e2e-original.json`: 4 aprobadas, 5 fallidas, 3 omitidas. Se conserva, no se borra
para presentar todo verde. Los omitidos son configuracion de pantalla gigante en movil.

- Captura desktop: `net::ERR_NETWORK_IO_SUSPENDED` al navegar a social tras haber
  verificado ya guardado unico. Repetida sola paso el flujo entero; primera falla de
  navegador no se presenta como fallo de negocio ni se oculta.
- Rotacion antigua: timeout al cerrar contexto. Ademas su asercion solo miraba texto
  no vacio, nunca comparaba autores. La prueba nueva SI observa cambio.
- Mosaico antiguo: cero articulos porque sembraba metadata JSON, pero con emulador
  disponible `getSocialPosts` lee la coleccion `social_gallery_posts`. No demostrar
  fallo de la app sembrando en el lugar equivocado. Semilla nueva usa esa coleccion.
- Subida antigua: PNG de 1 pixel cae en la regla de calidad, y regex solo acepta
  "publicada/Se subio", no "Momento enviado/publicado" ni rechazo de calidad.
  Se uso imagen detallada y se exigio ACK + fila + bytes. No se desactivo esa regla.

## Reproduccion de las pruebas reforzadas

Levantar el entorno existente con el adaptador Windows SOLO si necesita junction:

```powershell
node --import ./docs/evidencias/81-windows-aislado.mjs scripts/entorno-de-pruebas.mjs
```

Copiar `81-mural-emulador.spec.ts` a `tests/e2e/` de la carpeta temporal impresa y ejecutar
`81-correr-e2e-aislado.mjs` con esa carpeta y el nombre de la prueba. El runner verifica
carpeta temporal, descarta credenciales heredadas, fuerza proyecto demo y puertos locales.
Las pruebas verifican proyecto y emulador antes de escribir. No copiar a produccion.

## Limites

No certifica todos los entretenimientos, toda la moderacion, filtros IA reales, impresora,
plataforma 360 fisica ni entrega externa por WhatsApp/correo. Camara simulada y almacenamiento
local emulado. No hubo mensajes externos ni cobros. No se marca toda el area limpia.
Portal del invitado y acceso al muro tambien se observaron manualmente; en esa vista no
se mostraron controles administrativos. Eso no sustituye una prueba integral de permisos.
