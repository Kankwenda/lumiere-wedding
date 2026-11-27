const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const LENGTH = 10;

/**
 * Token d'invitation non prévisible : 10 caractères (~58 bits d'entropie),
 * tirage sans biais de modulo.
 */
export function generateGuestToken(): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = "";
  while (out.length < LENGTH) {
    const bytes = new Uint8Array(LENGTH);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < limit && out.length < LENGTH) out += ALPHABET[b % ALPHABET.length];
    }
  }
  return out;
}
