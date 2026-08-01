/**
 * Google Contacts (People API) Integration
 * 
 * Permite guardar leads comerciales automáticamente en la libreta de direcciones
 * de la cuenta de Google de la empresa.
 */

// Se define la interfaz para los datos de contacto
export interface GoogleContactData {
  nombre: string;
  telefono: string;
  email?: string;
  etiqueta?: string; // ej: "Lead de Web - 15 años"
}

export async function createGoogleContact(data: GoogleContactData): Promise<{ success: boolean; error?: string }> {
  try {
    // Para simplificar la demo, asume que recibimos el token de una Service Account 
    // a través de un proxy/función o usamos una API key si estuviera expuesta.
    // En producción requiere OAuth2 o Service Account JSON firmado (JWT).
    
    // Obtenemos el token desde el entorno (en un entorno real usaríamos google-auth-library)
    const accessToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.warn('[Google Contacts] No hay token configurado. Ignorando sincronización.');
      return { success: false, error: 'Sin credenciales' };
    }

    const payload = {
      names: [
        { givenName: data.nombre }
      ],
      phoneNumbers: [
        { value: data.telefono, type: 'mobile' }
      ],
      emailAddresses: data.email ? [
        { value: data.email, type: 'home' }
      ] : [],
      organizations: [
        { name: 'Lead AK Producciones', title: data.etiqueta || 'Web Lead' }
      ]
    };

    const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error('[Google Contacts] Error al crear contacto:', errorData);
      return { success: false, error: 'Fallo la API de Google' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Google Contacts] Error interno:', error);
    return { success: false, error: 'Excepción en el servidor' };
  }
}
