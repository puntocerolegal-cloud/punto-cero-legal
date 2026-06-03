/**
 * Cifrado Zero-Knowledge para documentos (Punto Cero Legal).
 *
 * La frase del abogado NUNCA sale del navegador. Derivamos una clave AES-GCM
 * con PBKDF2 (200k iteraciones) y ciframos el archivo localmente. El servidor
 * (y Google Drive) solo almacenan ciphertext + iv + salt (parámetros públicos).
 */

const enc = new TextEncoder();

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function b64ToBuf(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase, salt) {
  const baseKey = await window.crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Cifra un File y devuelve los campos listos para POST /documents/upload */
export async function encryptFile(file, passphrase) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plain = await file.arrayBuffer();
  const cipher = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  return {
    name: file.name,
    mime: file.type || 'application/octet-stream',
    size_bytes: file.size,
    ciphertext_b64: bufToB64(cipher),
    iv_b64: bufToB64(iv),
    salt_b64: bufToB64(salt),
  };
}

/** Descifra el payload de GET /documents/:id/content y devuelve un Blob */
export async function decryptToBlob(payload, passphrase) {
  const salt = b64ToBuf(payload.salt_b64);
  const iv = b64ToBuf(payload.iv_b64);
  const key = await deriveKey(passphrase, salt);
  const cipher = b64ToBuf(payload.ciphertext_b64);
  const plain = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new Blob([plain], { type: payload.mime || 'application/octet-stream' });
}
