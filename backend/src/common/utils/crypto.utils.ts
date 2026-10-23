import { hash as argon2Hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'crypto';

const ARGON2ID = 2; // Algorithm.Argon2id

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, { algorithm: ARGON2ID });
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(hash, password);
  } catch {
    return false;
  }
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
