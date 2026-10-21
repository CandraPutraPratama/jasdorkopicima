import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAdminSession,
  validateAdminSession,
  invalidateAdminSession,
  resetAdminSessionStore,
  setSessionKVBindingForTests,
  ADMIN_SESSION_TTL_MS,
  type RevocationStore,
} from '../src/lib/admin-session.ts';

const PASSWORD = 'SuperSecretAdminPassword123';

/** Store denylist palsu untuk test (meniru tabel Supabase). */
class FakeRevocationStore implements RevocationStore {
  store = new Map<string, number>();
  failOnRead = false;
  failOnWrite = false;

  async isRevoked(tokenHash: string): Promise<boolean> {
    if (this.failOnRead) throw new Error('store read unavailable');
    return this.store.has(tokenHash);
  }

  async revoke(tokenHash: string, expiresAtMs: number): Promise<void> {
    if (this.failOnWrite) throw new Error('store write unavailable');
    this.store.set(tokenHash, expiresAtMs);
  }

  async delete(tokenHash: string): Promise<void> {
    this.store.delete(tokenHash);
  }
}

describe('Step B - Admin session store (stateless HMAC tokens)', () => {
  let originalPassword: string | undefined;
  let originalSecret: string | undefined;

  beforeEach(() => {
    resetAdminSessionStore();
    setSessionKVBindingForTests(null);
    originalPassword = process.env.ADMIN_PASSWORD;
    originalSecret = process.env.ADMIN_SESSION_SECRET;
    process.env.ADMIN_PASSWORD = PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
  });

  function restoreEnv() {
    if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = originalPassword;
    if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = originalSecret;
    setSessionKVBindingForTests(undefined);
    resetAdminSessionStore();
  }

  describe('createAdminSession', () => {
    it('returns a three-part token with a 64 hex signature', async () => {
      try {
        const session = await createAdminSession();
        assert.match(session.token, /^v1\.[0-9a-z]+\.[0-9a-f]{16}\.[0-9a-f]{64}$/);
      } finally {
        restoreEnv();
      }
    });

    it('never embeds the admin password in the token', async () => {
      try {
        const session = await createAdminSession();
        assert.equal(session.token.includes(PASSWORD), false);
        assert.equal(JSON.stringify(session).includes(PASSWORD), false);
      } finally {
        restoreEnv();
      }
    });

    it('generates a different token for every session', async () => {
      try {
        const tokens = new Set<string>();
        for (let i = 0; i < 20; i++) {
          tokens.add((await createAdminSession()).token);
        }
        assert.equal(tokens.size, 20);
      } finally {
        restoreEnv();
      }
    });

    it('sets an expiry one TTL ahead of now', async () => {
      try {
        const now = 1_700_000_000_000;
        const session = await createAdminSession({ now });
        assert.equal(session.expiresAt, now + ADMIN_SESSION_TTL_MS);
      } finally {
        restoreEnv();
      }
    });

    it('throws when no signing secret is available (fail-closed)', async () => {
      try {
        delete process.env.ADMIN_PASSWORD;
        delete process.env.ADMIN_SESSION_SECRET;
        await assert.rejects(() => createAdminSession());
      } finally {
        restoreEnv();
      }
    });
  });

  describe('validateAdminSession', () => {
    it('accepts a freshly created token', async () => {
      try {
        const now = Date.now();
        const session = await createAdminSession({ now });
        assert.equal(await validateAdminSession(session.token, { now }), true);
      } finally {
        restoreEnv();
      }
    });

    it('rejects an unknown token', async () => {
      try {
        await createAdminSession();
        assert.equal(await validateAdminSession('v1.abc.' + 'a'.repeat(64)), false);
      } finally {
        restoreEnv();
      }
    });

    it('rejects empty, null and undefined tokens', async () => {
      try {
        assert.equal(await validateAdminSession(''), false);
        assert.equal(await validateAdminSession(null), false);
        assert.equal(await validateAdminSession(undefined), false);
      } finally {
        restoreEnv();
      }
    });

    it('rejects a token with a tampered signature', async () => {
      try {
        const session = await createAdminSession();
        const parts = session.token.split('.');
        const tampered = `${parts[0]}.${parts[1]}.${'f'.repeat(64)}`;
        assert.equal(await validateAdminSession(tampered), false);
      } finally {
        restoreEnv();
      }
    });

    it('rejects a token with a tampered expiry', async () => {
      try {
        const session = await createAdminSession();
        const parts = session.token.split('.');
        // Perpanjang masa berlaku tanpa tanda tangan baru.
        const tampered = `${parts[0]}.zzzzzzzzzzzz.${parts[2]}`;
        assert.equal(await validateAdminSession(tampered), false);
      } finally {
        restoreEnv();
      }
    });

    it('rejects a token that has expired', async () => {
      try {
        const now = 1_700_000_000_000;
        const session = await createAdminSession({ now });
        assert.equal(
          await validateAdminSession(session.token, { now: now + ADMIN_SESSION_TTL_MS + 1 }),
          false
        );
      } finally {
        restoreEnv();
      }
    });

    it('still accepts a token one millisecond before expiry', async () => {
      try {
        const now = 1_700_000_000_000;
        const session = await createAdminSession({ now });
        assert.equal(
          await validateAdminSession(session.token, { now: now + ADMIN_SESSION_TTL_MS - 1 }),
          true
        );
      } finally {
        restoreEnv();
      }
    });

    it('validates identically without any shared state (simulating another isolate)', async () => {
      try {
        const session = await createAdminSession();
        // Buang seluruh state in-memory: meniru isolate lain yang tidak pernah
        // melihat proses pembuatan sesi ini.
        resetAdminSessionStore();
        assert.equal(await validateAdminSession(session.token), true);
      } finally {
        restoreEnv();
      }
    });
  });

  describe('signing secret', () => {
    it('accepts a token signed with ADMIN_SESSION_SECRET when it is set', async () => {
      try {
        process.env.ADMIN_SESSION_SECRET = 'a-very-long-session-secret-value';
        const session = await createAdminSession();
        assert.equal(await validateAdminSession(session.token), true);
      } finally {
        restoreEnv();
      }
    });

    it('rejects tokens signed with a different secret', async () => {
      try {
        process.env.ADMIN_SESSION_SECRET = 'secret-one-long-enough';
        const session = await createAdminSession();

        process.env.ADMIN_SESSION_SECRET = 'secret-two-long-enough';
        assert.equal(await validateAdminSession(session.token), false);
      } finally {
        restoreEnv();
      }
    });
  });

  describe('invalidateAdminSession (logout)', () => {
    it('revokes a token using the in-memory denylist', async () => {
      try {
        const session = await createAdminSession();
        assert.equal(await validateAdminSession(session.token), true);

        await invalidateAdminSession(session.token);
        assert.equal(await validateAdminSession(session.token), false);
      } finally {
        restoreEnv();
      }
    });

    it('does not affect other sessions', async () => {
      try {
        const a = await createAdminSession();
        const b = await createAdminSession();
        await invalidateAdminSession(a.token);
        assert.equal(await validateAdminSession(b.token), true);
      } finally {
        restoreEnv();
      }
    });

    it('is safe to call for unknown tokens', async () => {
      try {
        await assert.doesNotReject(() => invalidateAdminSession('garbage'));
      } finally {
        restoreEnv();
      }
    });

    it('writes the revocation to KV when a binding is available', async () => {
      try {
        const kv = new FakeRevocationStore();
        setSessionKVBindingForTests(kv);

        const session = await createAdminSession();
        await invalidateAdminSession(session.token);

        assert.equal(kv.store.size, 1, 'expected a denylist entry in KV');
        assert.equal(await validateAdminSession(session.token), false);
      } finally {
        restoreEnv();
      }
    });

    it('stores a SHA-256 hash of the token, never the raw token', async () => {
      try {
        const store = new FakeRevocationStore();
        setSessionKVBindingForTests(store);

        const session = await createAdminSession();
        await invalidateAdminSession(session.token);

        const key = [...store.store.keys()][0];
        // Hash SHA-256 penuh: 64 karakter hex.
        assert.match(key, /^[0-9a-f]{64}$/);
        assert.equal(key.includes(session.token), false);
      } finally {
        restoreEnv();
      }
    });

    it('still revokes locally when the persistent store is unavailable', async () => {
      try {
        const store = new FakeRevocationStore();
        store.failOnWrite = true;
        setSessionKVBindingForTests(store);

        const session = await createAdminSession();
        await invalidateAdminSession(session.token);

        // Jaring pengaman: tetap dicabut di memori isolate ini.
        assert.equal(await validateAdminSession(session.token), false);
      } finally {
        restoreEnv();
      }
    });

    it('keeps accepting valid tokens when the denylist read fails', async () => {
      try {
        const store = new FakeRevocationStore();
        store.failOnRead = true;
        setSessionKVBindingForTests(store);

        const session = await createAdminSession();
        // Signature sah; kegagalan baca denylist tidak boleh mengunci admin keluar.
        assert.equal(await validateAdminSession(session.token), true);
      } finally {
        restoreEnv();
      }
    });
  });

  describe('store hygiene', () => {
    it('resetAdminSessionStore clears the denylist', async () => {
      try {
        const session = await createAdminSession();
        await invalidateAdminSession(session.token);
        assert.equal(await validateAdminSession(session.token), false);

        resetAdminSessionStore();
        assert.equal(await validateAdminSession(session.token), true);
      } finally {
        restoreEnv();
      }
    });
  });
});
