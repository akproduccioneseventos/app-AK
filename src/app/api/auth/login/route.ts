import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Configuración del servidor
const APP_PASSWORD = process.env.APP_PASSWORD ?? '';
const AUTH_SECRET = process.env.AUTH_SECRET ?? '';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: 'Falta la contraseña' }, { status: 400 });
    }
    if (password !== APP_PASSWORD) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }
    // Generar JWT (expira en 1 día)
    const token = jwt.sign({ role: 'admin' }, AUTH_SECRET, { expiresIn: '1d' });
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 día
    });
    return response;
  } catch (e) {
    console.error('Error en login:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
