/**
 * Utilidades criptográficas para FirmaDigital Chile
 * Calcula hashes SHA-256 reales y tokens criptográficos de evidencia (Ley 19.799).
 */

/**
 * Calcula el hash SHA-256 de una cadena de texto usando la Web Crypto API del navegador.
 */
export async function calculateSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Calcula el hash SHA-256 de un ArrayBuffer (ej: archivo PDF cargado)
 */
export async function calculateBufferSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Genera un identificador UUID v4 seguro
 */
export function generateUUID(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Genera un código de verificación alfanumérico amigable (ej: FD-CHL-9842-8711)
 */
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FD-CL-${p1}-${p2}`;
}

/**
 * Formatea una fecha ISO en formato chileno con zona horaria UTC y CLT (Santiago de Chile)
 */
export function formatChileanTimestamp(isoString: string): { clt: string; utc: string } {
  const date = new Date(isoString);
  const utc = date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const clt = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date) + ' (CLT Santiago)';

  return { clt, utc };
}
