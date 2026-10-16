# Guía de Publicación y Empaquetado para Google Play Store (TWA)

Esta guía documenta la configuración lista para empaquetar y publicar la experiencia pública de **AK Producciones (Portal del Cliente e Invitados)** en Google Play Store sin duplicar el backend ni sobrecargar la app.

---

## 1. Arquitectura de la Solución (Trusted Web Activity - TWA)

La aplicación utiliza la arquitectura estándar de Google recomendada para Next.js y Firebase: **TWA (Trusted Web Activity)**.
- **Rutas públicas enlazadas**: `/portal` y `/evento/*` (Muro, DJ, Barra, Fotos, Mi Mesa, Galería).
- **Aislamiento de seguridad**: Las rutas administrativas (`/admin`, `/contabilidad`, `/empresa`) continúan protegidas por sesión de Firebase y no se exponen al invitado.
- **Peso de descarga**: Menos de 3.5 MB en el teléfono del usuario.
- **Iconografía**: Se utilizan los assets de alta resolución configurados en `/public/manifest.json`:
  - `public/icons/icon-192x192.png`
  - `public/icons/icon-512x512.png`
  - `public/icons/ak-icon.svg`

---

## 2. Configuración de Digital Asset Links (Google Play)

Para que la app de Google Play abra a pantalla completa sin barra de navegación del navegador (modo nativo), se debe verificar la titularidad del dominio en el servidor mediante el archivo:
`https://[tu-dominio]/.well-known/assetlinks.json`

Contenido requerido con la huella digital (SHA-256) de la clave de firma de Google Play Console:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "uy.akproducciones.eventos",
      "sha256_cert_fingerprints": [
        "PEGAR_AQUI_LA_HUELLA_SHA256_DE_GOOGLE_PLAY_CONSOLE"
      ]
    }
  }
]
```

---

## 3. Generación del paquete `.aab` (Android App Bundle)

Se puede utilizar la herramienta oficial de Google `@bubblewrap/cli`:

```bash
# 1. Instalar la herramienta oficial
npm install -g @bubblewrap/cli

# 2. Inicializar el proyecto Android desde el manifest.json
bubblewrap init --manifest=https://[tu-dominio]/manifest.json

# 3. Compilar el archivo .aab listo para subir
bubblewrap build
```

El archivo generado `app-release-bundle.aab` se sube directamente en la sección **Producción** de **Google Play Console**.

---

## 4. Instalación en PC (Windows / Mac)

Los clientes y operadores pueden instalar la aplicación en PC en un solo clic:
1. Al abrir la web en **Google Chrome** o **Microsoft Edge**, el botón **"Instalar App"** aparece en el encabezado.
2. También pueden hacer clic en el ícono de instalación en la barra de direcciones del navegador.
3. La app se ancla al menú de inicio y a la barra de tareas de Windows como un programa independiente.
