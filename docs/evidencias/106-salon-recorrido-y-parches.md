# Codex106 - Salón: ayuda y recorrido real; dos parches compatibles

Base contrastada: PR1288 abierta, HEAD48829bfde9e419903944b60f8b4f26fe86dc1415.
Main99faf4eb, sin cambios desde la tanda105. No se fusiona ni se repite toda la auditoría.

## Fallos reproducidos antes de corregir
- App construida a33a54d91bf704f52fe11d1afbc956ebd8e819a5, mismo código de app en488.
- Navegador PC/celular: 4 pruebas fallan; 2 muestran la ayuda dentro del lienzo.
  La captura móvil105 ya mostraba el solapamiento con el dock de navegación.
- Las otras2 comprueban que Recorrer no mueve los píxeles de la escena.
  El estado enRecorridoCamara sólo alcanzaba el icono y el aviso; nunca OrbitControls.
- Las bibliotecas anteriores fallan las3 regresiones: headers de prototipo,
  nombres de archivo con CR/LF y offset indexado enorme. No se afirma explotación
  en una ruta de la app ni se ejecuta un bucle malicioso de millones de líneas.

## Corrección mínima, aún pendiente de aceptación final
- La ayuda existente pasa al flujo normal encima del lienzo; no tapa la cámara.
- Recorrer transmite autoRotate a SceneContent/OrbitControls; apagado por defecto.
  Pausar recorrido conserva el control manual. El aviso ya no promete pantalla completa.
- Sólo2 entradas del lock: @fastify/busboy3.2.0→3.2.2 y source-map-js1.2.1→1.2.2.
  Rangos existentes firebase-admin13.10.0(^3.0.0) y postcss8.5.26(^1.2.1).
  No force, cambios mayores, downgrades, dependencias nuevas ni nuevos permisos.
- Regresiones de bibliotecas reales y4 pruebas nuevas del navegador PC/celular.
  Se conserva105 como histórico válido para su SHA, no como prueba del nuevo código.

## Fuentes y alcance de seguridad
- [Busboy boundary](https://github.com/advisories/GHSA-xjh9-v7x6-24jw),
  [headers](https://github.com/advisories/GHSA-x8mw-p69m-v3mx),
  [CR/LF](https://github.com/advisories/GHSA-gxm5-99cw-xjw9).
- [Source maps](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
- Las versiones parchean4 avisos únicos. El retest cubre headers/CRLF/offsets,
  NO una explotación pública ni el caso boundary de252bytes. Audit posterior pendiente.
- Instalación/controles completos/navegador/grafo se registran al terminar,
  ligados al nuevo SHA. Sin datos reales, cuentas pagas ni pruebas físicas.
