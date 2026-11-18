const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let bits = 0; let value = 0; let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function decodeBase32(value: string): Uint8Array {
  let bits = 0; let buffer = 0; const bytes: number[] = [];
  for (const char of value.toUpperCase().replace(/=+$/, '').replace(/\s/g, '')) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) continue;
    buffer = (buffer << 5) | digit; bits += 5;
    if (bits >= 8) { bytes.push((buffer >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(bytes);
}

export function totpUri(secret: string, email: string): string {
  const label = encodeURIComponent(`SecureFlow:${email}`);
  const params = new URLSearchParams({ secret, issuer: 'SecureFlow', algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${label}?${params.toString()}`;
}

async function codeAtCounter(secret: string, counter: number): Promise<string> {
  const message = new Uint8Array(8);
  new DataView(message.buffer).setUint32(4, counter, false);
  const secretBytes = decodeBase32(secret);
  const key = await crypto.subtle.importKey('raw', secretBytes.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, message.buffer as ArrayBuffer));
  const offset = signature[signature.length - 1] & 0x0f;
  const binary = ((signature[offset] & 0x7f) << 24) | ((signature[offset + 1] & 0xff) << 16) | ((signature[offset + 2] & 0xff) << 8) | (signature[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

export async function matchingTotpCounter(secret: string, candidate: string, now = Date.now()): Promise<number | null> {
  if (!/^\d{6}$/.test(candidate)) return null;
  const currentCounter = Math.floor(now / 30_000);
  for (const window of [-1, 0, 1]) {
    const counter = currentCounter + window;
    if (await codeAtCounter(secret, counter) === candidate) return counter;
  }
  return null;
}

export async function verifyTotp(secret: string, candidate: string, now = Date.now()): Promise<boolean> {
  return (await matchingTotpCounter(secret, candidate, now)) !== null;
}

export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    const raw = Array.from(bytes, (byte) => ALPHABET[byte & 31]).join('');
    return `${raw.slice(0, 8)}-${raw.slice(8)}`;
  });
}
