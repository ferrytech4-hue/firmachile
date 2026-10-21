/**
 * Utilidades para validación y formateo de RUT chileno (Rol Único Tributario)
 * Implementa el algoritmo oficial Módulo 11 según normativa del Registro Civil y SII de Chile.
 */

/**
 * Limpia un RUT eliminando puntos, guiones y espacios, dejando solo números y dígito verificador.
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Calcula el dígito verificador esperado para un cuerpo de RUT dado.
 */
export function calculateDv(rutBody: string | number): string {
  const cleanBody = String(rutBody).replace(/[^0-9]/g, '');
  if (!cleanBody) return '';

  let sum = 0;
  let multiplier = 2;

  for (let i = cleanBody.length - 1; i >= 0; i--) {
    sum += parseInt(cleanBody.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

/**
 * Valida si un RUT chileno es matemáticamente correcto mediante Módulo 11.
 */
export function validateRut(fullRut: string): boolean {
  if (!fullRut || typeof fullRut !== 'string') return false;

  const cleaned = cleanRut(fullRut);
  if (cleaned.length < 8 || cleaned.length > 9) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // Validar que el cuerpo sean solo dígitos
  if (!/^\d+$/.test(body)) return false;

  const expectedDv = calculateDv(body);
  return dv === expectedDv;
}

/**
 * Formatea un RUT al estándar chileno: 12.345.678-K
 */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // Formatear cuerpo con puntos
  let formattedBody = '';
  let count = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    formattedBody = body.charAt(i) + formattedBody;
    count++;
    if (count % 3 === 0 && i > 0) {
      formattedBody = '.' + formattedBody;
    }
  }

  return `${formattedBody}-${dv}`;
}
