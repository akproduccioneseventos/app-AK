export type OfflineUploadDecision = 'duplicate' | 'permanent' | 'retryable';

const DUPLICATE_UPLOAD_ERROR = /ya fue subida|duplicad|already exists/i;
const PERMANENT_UPLOAD_ERROR = /no existe|invalido|inválido|bloqueado|no habilitado|límite alcanzado|limite alcanzado|inapropiado|moderaci/i;

/**
 * Decide si una captura debe reintentarse. Una autorización vencida es recuperable:
 * la estación puede abrirse otra vez con una credencial nueva sin perder la foto.
 */
export function classifyOfflineUploadError(errorMessage: string): OfflineUploadDecision {
  if (DUPLICATE_UPLOAD_ERROR.test(errorMessage)) return 'duplicate';
  if (PERMANENT_UPLOAD_ERROR.test(errorMessage)) return 'permanent';
  return 'retryable';
}
