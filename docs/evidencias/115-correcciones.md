# Codex115 - Respaldo, estados operativos y logo original

ARCHIVO HISTORICO. PR1288 ya integrada; no subirle cambios.
No acredita la fuente116 sobre main nuevo. Ver116-correcciones.md.

Fuente congelada: `81be9ac00485bc0ece0fb6db07bf7b5f4aa96669`.
PR1288, rama `codex/auditoria-97-ia-contexto-20261011`. No fusionar.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.
Estado de la fuente81: PASS, alcance de esta tanda solamente.
707suites4285tests;34criterios nativos;build/tipos/lint/acentos2806 PASS.
La entrega sobre main actualizado sigue pendiente; ver115-aceptacion.json.

## Correcciones implementadas

- El respaldo incluye el libro de ajustes de costos y conserva los IDs legacy.
  Al restaurar insumos antiguos sin libro, elimina los recibos posteriores.
  El ajuste completado solicita backup interno sin exponer una accion RPC nueva.
- Una lectura rechazada por Firestore no se certifica mediante una copia vieja.
  La descarga ZIP rechaza los respaldos incompletos; la pantalla puede conservar
  datos de respaldo sin afirmar que sean actuales.
- El ultimo proveedor y la ultima plantilla personalizada no reaparecen tras
  eliminarlos. Las plantillas incorporadas rechazan el borrado sin falso exito.
  Un insumo sin proveedor ya no bloquea eliminar otro proveedor por comparar
  dos valores undefined; las asociaciones verdaderas siguen protegidas.
- Torre de control, preparacion, comercial, post-fiesta, automatizaciones,
  conexiones y redes muestran fallos visibles y permiten reintentar.
- La cuenta Google retirada no habilita sincronizacion ni cuenta como conectada.
  Los empleados con errores permanecen visibles sin aumentar el total conectado.
- Los avisos silenciados o duplicados no suman como notificaciones creadas.
- Sharp0.35.5 elimina los avisos asociados a esa dependencia, sin actualizar
  Next ni instalar herramientas como dependencias de produccion.
- El logo anterior estaba truncado:9528bytes con IDAT incompleto y sin IEND.
  El dueno entrego `E:/Logo (Logotipo).png`; se copio exactamente a
  `public/logo_ak_producciones.png`, sin redibujar ni alterar la identidad.
  SHA256:`7f6249ff1cc7fa347dfd737f975bfd36e58ac4c2f2f57c7e472144e252220166`.
  El original decodifica500x500 y el generador real del presupuesto incorpora
  la imagen al PDF. El transporte se simula en Jest; jsPDF y PNG son reales.

## Defectos reproducidos durante la validacion

La primera corrida nativa sobre9af39cd9 dio31PASS y3NOT_ACCEPTED:
dos respuestas del optimizador devolvian el PNG roto sin redimensionar;
la eliminacion del proveedor en celular chocaba con un insumo no asociado.
Ambas causas se corrigieron; los criterios originales siguen exigidos.
No se aumento el tiempo de espera ni se convirtieron esos fallos en aprobaciones.

Los errores iniciales de preparacion del harness (nombre de accion ambiguo,
mezcla CommonJS/await) se separan de defectos de app en115-harness-incidentes.json.
Las pruebas del logo requirieron cargar jsPDF Node antes de simular window y
usar la proyeccion anual real en el fixture; no se cambio la app para ese fixture.
Sobre81, una primera respuesta PC conservaba la imagen vieja en cache; las
peticiones posteriores, incluida la misma URL sin cambio, devolvieron256webp.
La primera corrida33PASS/1fallo se conserva; la repeticion completa dio34PASS
sin bajar umbrales, borrar cache ni cambiar codigo. Ver115-cache-tras-logo-original.

## Main actualizado durante la prueba

PR1288 se integro como791f0a7a; main ahora4c5ef2f9. Claude conserva centavos
en los costos y agrego permisos/fechas; se deben preservar. Algunos arreglos
de paneles/Google/plantillas ya estan en ese main, no se volveran a implementar.
Estas pruebas sobre81 no acreditan el main nuevo. No enviar el checkout viejo
como una reversion global: adaptar SOLO los deltas aun ausentes a una rama nueva.

## Limites

Windows y emulador ficticio, sin credenciales ni cuentas reales. El build anterior
no valida esta fuente. Ninguna prueba equivale a verificar Hosting/Linux, OAuth,
pagos/correos reales, los19presupuestos manuales originales o equipos fisicos.
El respaldo no es una instantanea global atomica de todas las colecciones.
El audit de dependencias mantiene24avisos unicos ajenos a Sharp; no0vulnerabilidades.
Orden152, otras variantes de Storage/export155 y cobertura109 no se cierran aqui.
No declarar toda la app terminada o sin errores.
