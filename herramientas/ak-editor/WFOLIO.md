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

## 4. Enlaces y Referencias
- Portal de Wfolio Disk: [https://wfolio.com/my/disk](https://wfolio.com/my/disk)
- Documentación de Playwright Python: [https://playwright.dev/python/](https://playwright.dev/python/)
- Guía de almacenamiento local de AK Editor: `herramientas/ak-editor/almacen.py`
