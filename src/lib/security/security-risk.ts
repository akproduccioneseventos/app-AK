export type SecurityRiskInput = {
  signedSessionCookie?: boolean;
  sharedPasswordEnabled?: boolean;
  hardcodedPasswordFallback?: boolean;
  publicPortalKeysPredictable?: boolean;
  sensitiveApiChecksAuth?: boolean;
  auditLogEnabled?: boolean;
};

export type SecurityRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type SecurityRiskResult = {
  score: number;
  level: SecurityRiskLevel;
  issues: string[];
  nextActions: string[];
};

export function evaluateSecurityRisk(input: SecurityRiskInput): SecurityRiskResult {
  const issues: string[] = [];
  const nextActions: string[] = [];
  let score = 0;

  if (!input.signedSessionCookie) {
    score += 30;
    issues.push('La sesion no esta firmada.');
    nextActions.push('Firmar la cookie de sesion o migrar a auth real.');
  }

  if (input.sharedPasswordEnabled) {
    score += 20;
    issues.push('La app usa contrasena compartida.');
    nextActions.push('Separar usuarios, roles y permisos.');
  }

  if (input.hardcodedPasswordFallback) {
    score += 25;
    issues.push('Existe fallback de contrasena en codigo.');
    nextActions.push('Eliminar fallback y exigir secreto configurado.');
  }

  if (input.publicPortalKeysPredictable) {
    score += 15;
    issues.push('Hay links de portal faciles de adivinar.');
    nextActions.push('Rotar links y generar claves largas.');
  }

  if (!input.sensitiveApiChecksAuth) {
    score += 25;
    issues.push('APIs sensibles no revalidan permisos.');
    nextActions.push('Agregar requireAuth en APIs sensibles.');
  }

  if (!input.auditLogEnabled) {
    score += 10;
    issues.push('Falta registro de acciones sensibles.');
    nextActions.push('Registrar descargas, restauraciones, pagos y cambios criticos.');
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const level: SecurityRiskLevel =
    finalScore >= 75 ? 'critical' :
    finalScore >= 50 ? 'high' :
    finalScore >= 25 ? 'medium' :
    'low';

  return {
    score: finalScore,
    level,
    issues: issues.length > 0 ? issues : ['No se detectaron riesgos fuertes con esta configuracion.'],
    nextActions,
  };
}
