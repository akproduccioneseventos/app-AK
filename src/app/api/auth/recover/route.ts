import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const recoveryEmail = process.env.RECOVERY_EMAIL ?? '';
    if (!recoveryEmail) {
      return NextResponse.json({ error: 'Correo de recuperación no configurado' }, { status: 500 });
    }
    console.log(`Simulando envío de email de recuperación a ${recoveryEmail}`);
    return NextResponse.json({ success: true, message: 'Se ha enviado un email de recuperación' });
  } catch (e) {
    console.error('Error en recuperación:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
