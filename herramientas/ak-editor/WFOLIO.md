# Investigación y Arquitectura de Integración con Wfolio

**Documento técnico y de investigación para AK Editor (Orden 281)**
*Fecha: 11 de Noviembre de 2026*
*Entorno: Computadora de producción de AK Producciones*

---

## 1. Complemento / Plugin para Lightroom Classic

### Pregunta
¿Wfolio cuenta con un plugin o servicio de publicación oficial para Adobe Lightroom Classic (`.lrplugin`) que permita exportar y publicar fotos directamente en carpetas dentro de un álbum?

### Resultado de la investigación
- **Disponibilidad**: **NO existe complemento oficial de Lightroom para Wfolio.**
- **Detalle**: A diferencia de plataformas como Pixieset, Pic-Time o ShootProof (que distribuyen plugins en Adobe Exchange o SDKs de exportación), Wfolio opera exclusivamente como constructor web y sistema de galerías cliente ("Wfolio Disk", `https://wfolio.com/my/disk`).
- **Verificación**: Se revisó el catálogo de Adobe Creative Cloud Exchange, la documentación oficial de Wfolio (`https://wfolio.com` / `https://wfolio.ru`) y foros de la comunidad de fotógrafos. No hay servicio de publicación registrado ni instalador `.lrplugin`.
- **Conclusión**: No es posible delegar la subida a Lightroom de forma nativa a través de un servicio de publicación de Wfolio.

---

## 2. API Pública o para Desarrolladores

### Pregunta
¿Wfolio ofrece una API REST, GraphQL o portal para desarrolladores que permita autenticarse con token, crear álbumes, crear carpetas y subir fotografías mediante peticiones HTTP estándar?

### Resultado de la investigación
- **Disponibilidad**: **NO existe API pública documentada para desarrolladores.**
- **Detalle**: Wfolio no dispone de endpoint público tipo `api.wfolio.com`, documentación para desarrolladores, ni generación de claves API (API Keys / Personal Access Tokens) en el panel de usuario.
- **Arquitectura web**: El panel `https://wfolio.com/my/disk` es una Single Page Application (SPA) que interactúa con endpoints internos protegidos por cookies de sesión de navegador, tokens CSRF y cabeceras dinámicas de cliente.
- **Conclusión**: No existe una vía oficial basada en API pública documentada para integrar la subida directa sin emular una sesión de usuario.

---

## 3. Automatización mediante Navegador (Playwright en Python)

### Solución adoptada
Dado que no existe plugin de Lightroom ni API pública, el camino robusto, limpio y seguro es la **automatización de navegador con Playwright en Python** utilizando un perfil de sesión persistente.

### Especificaciones de Seguridad y Privacidad
1. **Directorio de sesión fuera del repositorio**:
   - La sesión del navegador (cookies, localStorage, indexedDB y tokens) se almacena en:
     `%USERPROFILE%\Documents\AK Editor\wfolio-sesion\` (ruta absoluta en Windows: `C:\Users\<Usuario>\Documents\AK Editor\wfolio-sesion\`).
   - Esta carpeta reside fuera del árbol de Git, evitando cualquier riesgo de filtración o commit accidental de credenciales.
2. **Cero almacenamiento de contraseñas**:
   - La contraseña del usuario **nunca** se almacena en archivos del repositorio, variables de entorno fijas ni scripts.
   - En el primer inicio o cuando la sesión caduca, el programa abre el navegador en modo interactivo (`headless=False`), el dueño inicia sesión por única vez con sus credenciales directamente en el portal de Wfolio, y Playwright almacena el contexto autenticado para futuras ejecuciones.
3. **Mecanismo de "Sigue donde quedó" (Checkpoint en SQLite)**:
   - Cada foto subida exitosamente a una carpeta se registra inmediatamente en la base de datos local SQLite (`wfolio_subidas`).
   - Si la conexión se interrumpe o el proceso se detiene en la foto 3 de 5, la siguiente ejecución lee la base de datos y salta las fotos ya marcadas como `subido`, intentando únicamente las pendientes o fallidas.
4. **Mensaje amigable ante cambios en Wfolio (Criollo)**:
   - Si Wfolio actualiza su diseño, cambia sus selectores DOM o solicita un desafío de seguridad que impida la automatización, el sistema no se cuelga ni arroja un error técnico incomprensible.
   - Se muestra inmediatamente el mensaje claro:
     > *"Wfolio cambió su página: subí esta vez a mano; las carpetas ya están armadas en tu computadora"*
   - Todas las fotos quedan ordenadas en sus subcarpetas locales dentro de `ruta_destino` (`Exterior`, `Previa y recepcion`, `Entrada y vals`, `Fiesta`, `Torta y velas`), listas para arrastrar y soltar manualmente al panel de Wfolio sin perder un segundo de trabajo.

---

## 4. Estructura del Proyecto, Diseño y Portada (Orden 329)

Cada álbum en Wfolio Disk funciona como un **proyecto** que contiene carpetas ordenadas. El plan ilimitado del dueño habilita las siguientes secciones y reglas operativas:

### Solapa "Diseño y portada"
En la solapa **Diseño y portada** del proyecto se configuran:
- **Plantillas**: selección del layout de la galería (grilla, mampostería, portada a pantalla completa). AK Editor guarda la elección única del dueño en **"Marca AK"** para reutilizarla en todas las fiestas.
- **Letra (Tipografía)**: fuente para título, subtítulo y nombres de carpetas.
- **Colores**: paleta de fondo, acentos y textos de la galería.
- **Foto de portada**: imagen principal del álbum (AK Editor elige la foto con mejor nota de calidad en `analizador.py`, prefiriendo la carpeta `Exterior`).
- **Título y subtítulo**: título con el nombre de la fiesta/agasajada y subtítulo con el tipo de celebración y fecha (ej.: `"Valentina · 15 años · 14/03/2027"`).
- **Espacio entre fotos** (vista computadora): chico, mediano o grande.

### Opciones por carpeta
Cada carpeta dentro del proyecto (fotógrafo + estaciones) admite configurar:
- **Carpeta oculta**: permite ocultar temporalmente una subcarpeta al público manteniendo su contenido en el proyecto.
- **Descarga permitida**: habilita o bloquea la descarga de archivos para quienes acceden con el enlace.
- **PIN / contraseña de descarga**: clave opcional de 4+ dígitos para autorizar la descarga de archivos originales o en alta resolución.
- **Orden y visibilidad**: nunca se crean carpetas vacías en el proyecto.

### Manejo de videos (MP4 / MOV H.264 hasta 500 MB)
- Wfolio reproduce dentro de la galería videos **MP4 o MOV codificados en H.264 (`libx264` + `aac`)** de hasta **500 MB**.
- Si un video supera los **500 MB**, Wfolio lo muestra únicamente como foto fija en lugar de reproducirlo; por eso `exportador_video.py` lo comprime automáticamente por debajo de 500 MB antes de subirlo.
- Si el plan o la página rechaza videos, los archivos de Plataforma 360 permanecen en la carpeta local y el resumen avisa: `"Wfolio no acepta video: los 360 quedaron en tu compu"`.

### Reconocimiento de caras (hasta 2000 fotos)
- Disponible en el plan ilimitado para imágenes **JPG y PNG**.
- El límite operativo de Wfolio es de **2000** fotos/archivos por proyecto (contando todas las carpetas).
- Si el proyecto tiene hasta **2000** archivos, AK Editor deja el reconocimiento de caras **activado** para que cada invitado encuentre sus fotos buscando su rostro.
- Si supera **2000** archivos, se deja **apagado** y el resumen informa: `"Más de 2000 fotos: Wfolio no busca caras en este álbum"`.

### Decisiones del dueño (qué NO se activa)
- **Selección de fotos por el cliente**: **NO se activa** ("el cliente no elige nada").
- **Venta de fotos / tienda**: **NO se activa**.
- **Privacidad**: el álbum se mantiene **privado** y el enlace lo envía el dueño manualmente desde el Centro de la fiesta.

---

## 5. Enlaces y Referencias
- Portal de Wfolio Disk: [https://wfolio.com/my/disk](https://wfolio.com/my/disk)
- Documentación oficial: [https://docs.wfolio.pro](https://docs.wfolio.pro)
- Documentación de Playwright Python: [https://playwright.dev/python/](https://playwright.dev/python/)
- Guía de almacenamiento local de AK Editor: `herramientas/ak-editor/almacen.py`
