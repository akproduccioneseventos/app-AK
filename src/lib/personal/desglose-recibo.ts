import type { Rol } from '@/types/rol';

export interface SalaryBreakdown {
  base: number;
  vacacional: number;
  aguinaldo: number;
}


export const calculateSalaryBreakdown = (totalPayment: number, rol?: Rol): SalaryBreakdown => {
  const vacacionalPct = (rol?.porcentajeSalarioVacacional ?? 0) / 100;
  const aguinaldoPct = (rol?.porcentajeAguinaldo ?? 0) / 100;
  const divisor = 1 + vacacionalPct + aguinaldoPct;
  // Cada renglón se redondea al centésimo y el último se lleva la diferencia: las tres líneas
  // tienen que sumar el total que se imprime (un recibo de $1.000 sumaba $999,99).
  const aCentesimos = (n: number) => Math.round(n * 100) / 100;
  const sueldoBase = aCentesimos(divisor > 0 ? totalPayment / divisor : totalPayment);
  const salarioVacacional = aCentesimos(sueldoBase * vacacionalPct);
  const aguinaldo = aCentesimos(totalPayment - sueldoBase - salarioVacacional);
  return { base: sueldoBase, vacacional: salarioVacacional, aguinaldo };
};
