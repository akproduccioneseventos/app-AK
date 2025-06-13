// app/page.tsx (o src/app/page.tsx si usás App Router)

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const AppLogo = () => (
  <div className="flex flex-col items-start group">
    <span className="text-lg font-bold">MiEmpresa</span>
    <span className="text-sm text-gray-500">Servicios</span>
  </div>
);

const SoloCliente = ({ children }: { children: React.ReactNode }) => {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  if (!montado) return null;

  return <>{children}</>;
};

const MostrarHora = () => {
  const [hora, setHora] = useState('');

  useEffect(() => {
    // Esto solo se ejecutará en el cliente, después de la hidratación
    setHora(new Date().toLocaleTimeString('es-ES'));
  }, []); // El array vacío asegura que se ejecute una vez al montar

  if (!hora) {
    return <span className="text-blue-600">Cargando hora...</span>;
  }

  return <span className="text-blue-600">Hora actual: {hora}</span>;
};

const Header = () => (
  <header className="bg-white shadow p-4">
    <div className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2"> {/* CORREGIDO: Link sin <a> interna y sin passHref */}
        <AppLogo />
      </Link>
      {/* Aquí podrías añadir más elementos al header si es necesario */}
    </div>
  </header>
);

export default function PaginaPrincipal() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Bienvenido a tu plataforma</h1>
        <p className="mb-4">Este es un contenido de ejemplo para la página principal.</p>
        <SoloCliente>
          <p className="mb-2">Este contenido solo se muestra en el cliente después de la hidratación.</p>
          <MostrarHora />
        </SoloCliente>
        <div className="mt-6">
          <Link href="/invoices" className="text-blue-500 hover:underline">
            Ir a Facturas
          </Link>
        </div>
         <div className="mt-4">
          <Link href="/presupuestos" className="text-blue-500 hover:underline">
            Ir a Presupuestos
          </Link>
        </div>
        <div className="mt-4">
          <Link href="/customers" className="text-blue-500 hover:underline">
            Ir a Clientes
          </Link>
        </div>
      </main>
    </div>
  );
}
