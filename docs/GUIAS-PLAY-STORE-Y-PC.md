# Guía para Publicar en Google Play Store y Usar en PC / iPhone

Esta guía describe los pasos reales que hace una persona para publicar la app de **AK Producciones** en Google Play Store (mediante TWA - Trusted Web Activity) y cómo se instala en computadoras y teléfonos.

---

## 1. Cuenta de Desarrollador de Google Play (Paso Humano)

1. **Crear o ingresar a la cuenta**:
   - Entrá a [Google Play Console](https://play.google.com/console).
   - Iniciá sesión con la cuenta de Google de la empresa.
2. **Pagar la tarifa de registro**:
   - Google cobra **un único pago de aproximadamente 25 dólares** por única vez para habilitar la cuenta de desarrollador de por vida.
   - Se paga directamente en la consola con tarjeta de crédito o débito internacional.
3. **Completar los datos de identidad**:
   - Ingresá los datos comerciales de AK Producciones y verificá el número de teléfono y correo.

---

## 2. Generación y Subida del Paquete `.aab` (Android App Bundle)

La aplicación está lista para empaquetarse como TWA (Trusted Web Activity) con el identificador `uy.akproducciones.app`.

1. **Generar el paquete con Bubblewrap**:
   ```bash
   npm install -g @bubblewrap/cli
   bubblewrap init --manifest=https://akproducciones.uy/manifest.json
   bubblewrap build
   ```
2. **Obtener la huella SHA-256 de Google Play**:
   - En Google Play Console, andá a **Configuración** → **Firma de aplicaciones**.
   - Copiá el certificado de firma de la app (Huella digital del certificado SHA-256).
3. **Actualizar `public/.well-known/assetlinks.json`**:
   - Reemplazá el texto `REEMPLAZAR_HUELLA_PLAY` en `public/.well-known/assetlinks.json` por la huella SHA-256 copiada.
   - Esto habilita que la app abra a pantalla completa sin la barra del navegador.
4. **Subir a Producción**:
   - En Google Play Console, creá un lanzamiento en la sección **Producción**.
   - Subí el archivo `app-release-bundle.aab`.
   - Enviá a revisión.

---

## 3. Instalación en PC (Windows y Mac)

1. Abrí la web en Google Chrome o Microsoft Edge.
2. En el encabezado o en la barra de direcciones aparece el botón **Instalar AK Producciones**.
3. Al tocarlo, la aplicación se instala en el menú Inicio y la barra de tareas como una app de escritorio ligera e independiente.

---

## 4. Instalación en iPhone y iPad (Decisión del dueño: Sin tienda de Apple)

Apple no permite tiendas abiertas ni TWA y cobra 99 dólares anuales por cuenta de desarrollador.
Por decisión del dueño de AK Producciones, **no hay versión en Apple App Store**.

Los usuarios de iPhone y iPad instalan la app directamente desde Safari:
1. Abrí la web en Safari.
2. Tocá el botón de **Compartir** (el ícono del cuadrado con la flecha hacia arriba en la barra inferior).
3. Elegí la opción **"Agregar a inicio"** (ícono de suma).
4. El ícono de AK Producciones queda guardado en la pantalla principal del iPhone como una app nativa.
