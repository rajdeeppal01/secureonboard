import crypto from 'crypto';

// Use a 32-byte key from environment or fallback to a hardcoded one for development only.
// In production, ENCRYPTION_KEY must be a 32-byte cryptographically secure string.
const ALGORITHM = 'aes-256-gcm';
const RAW_KEY = process.env.ENCRYPTION_KEY || 'secureonboard-default-dev-key-12';
const KEY = crypto.createHash('sha256').update(RAW_KEY).digest(); // Ensure exactly 32 bytes

/**
 * Encrypts a plain text string using AES-256-GCM.
 * Returns a string in the format: "ENCRYPTED:iv:authTag:ciphertext"
 */
export function encryptToken(text: string | null | undefined): string | null {
  if (!text) return null;
  if (text.startsWith('ENCRYPTED:')) return text; // Already encrypted

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `ENCRYPTED:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted string.
 * If the string does not match the encrypted format, it returns the raw string (for backward compatibility).
 */
export function decryptToken(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null;
  if (!encrypted.startsWith('ENCRYPTED:')) return encrypted; // Legacy plain text

  try {
    const parts = encrypted.split(':');
    if (parts.length !== 4) throw new Error('Invalid encryption format');

    const [_, ivHex, authTagHex, cipherText] = parts;
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    // If decryption fails (e.g. wrong key), it's safer to return null or throw.
    // Returning null ensures we don't accidentally leak ciphertext to the integration API.
    return null;
  }
}
