# Evidencia: Permiso de firma de archivos y limpieza de registros PRUEBA (Orden 318 Bloque 0)

- **Permiso `iam.serviceAccounts.signBlob` en App Hosting**: pendiente de ejecutar con sesión de Google Cloud (`gcloud auth login`) desde la computadora del dueño:
  ```bash
  gcloud iam service-accounts add-iam-policy-binding firebase-app-hosting-compute@presupuestador-ak-producciones.iam.gserviceaccount.com --member=serviceAccount:firebase-app-hosting-compute@presupuestador-ak-producciones.iam.gserviceaccount.com --role=roles/iam.serviceAccountTokenCreator --project=presupuestador-ak-producciones
  ```
- **Limpieza de registros `PRUEBA` en Firestore**: pendiente de conexión directa con credenciales de Firebase Admin en la PC del dueño para borrar únicamente los IDs/prospectos `PRUEBA` listados en la Orden 318 Bloque 0.
