import { BarraDeLaCasa } from '@/components/navegacion/barra-de-la-casa';

export default function PresenciaDigitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BarraDeLaCasa casaId="vender" />
      {children}
    </>
  );
}
