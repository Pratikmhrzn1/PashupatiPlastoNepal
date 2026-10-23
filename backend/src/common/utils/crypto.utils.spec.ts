import { hash } from '@node-rs/argon2';
import {
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from './crypto.utils.js';

describe('crypto.utils', () => {
  describe('hashPassword / verifyPassword', () => {
    it('hashes a password and verifies it against the original', async () => {
      const hash = await hashPassword('Sup3rSecret!');

      expect(hash).not.toBe('Sup3rSecret!');
      expect(hash.startsWith('$argon2id$')).toBe(true);
      await expect(verifyPassword(hash, 'Sup3rSecret!')).resolves.toBe(true);
    });

    it('rejects an incorrect password', async () => {
      const hash = await hashPassword('Sup3rSecret!');

      await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
    });

    it('produces a different hash each time (salted)', async () => {
      const [first, second] = await Promise.all([
        hashPassword('Sup3rSecret!'),
        hashPassword('Sup3rSecret!'),
      ]);

      expect(first).not.toBe(second);
    });

    it('returns false instead of throwing on a malformed hash', async () => {
      await expect(verifyPassword('not-a-valid-hash', 'anything')).resolves.toBe(
        false,
      );
    });
  });

  describe('generateToken', () => {
    it('returns a hex string of the requested byte length', () => {
      const token = generateToken(16);

      expect(token).toMatch(/^[0-9a-f]{32}$/);
    });

    it('returns a different value on each call', () => {
      expect(generateToken()).not.toBe(generateToken());
    });
  });

  describe('hashToken', () => {
    it('is deterministic', () => {
      expect(hashToken('abc')).toBe(hashToken('abc'));
    });

    it('differs for different inputs', () => {
      expect(hashToken('abc')).not.toBe(hashToken('abd'));
    });

    it('does not leak the raw token', () => {
      expect(hashToken('super-secret-token')).not.toContain('super-secret-token');
    });

    it('produces a sha256 hex digest', () => {
      expect(hashToken('abc')).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});

describe('argon2 configuration', () => {
  it('is installed and functional', () => {
    expect(typeof hash).toBe('function');
  });
});
