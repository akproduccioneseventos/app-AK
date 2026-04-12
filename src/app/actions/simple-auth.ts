'use server';

import { dbAdmin } from '@/lib/firebase/server';

const HARDCODED_PASSWORD = 'AKproducciones2024';

export async function verifyPassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Intentar leer contraseña de Firestore
    if (dbAdmin) {
      const doc = await dbAdmin.collection('app-settings').doc('auth').get();
      if (doc.exists) {
        const data = doc.data();
        if (data?.password) {
          return { 
            success: password === data.password 
          };
        }
      }
    }
    
    // Fallback a contraseña hardcodeada
    return { success: password === HARDCODED_PASSWORD };
  } catch (err) {
    console.error('[simple-auth] verifyPassword error:', err);
    // Si Firestore falla, usar fallback hardcodeado
    return { success: password === HARDCODED_PASSWORD };
  }
}

export async function changeAppPassword(
  currentPassword: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Primero verificar la contraseña actual
  const verify = await verifyPassword(currentPassword);
  if (!verify.success) {
    return { success: false, error: 'La contraseña actual es incorrecta.' };
  }
  
  if (newPassword.length < 4) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
  }
  
  try {
    if (!dbAdmin) {
      return { success: false, error: 'Base de datos no disponible.' };
    }
    
    await dbAdmin.collection('app-settings').doc('auth').set({
      password: newPassword,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    return { success: true };
  } catch (err) {
    console.error('[simple-auth] changeAppPassword error:', err);
    return { success: false, error: 'Error al cambiar la contraseña.' };
  }
}
