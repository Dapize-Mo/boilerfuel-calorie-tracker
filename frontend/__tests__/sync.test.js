/**
 * Tests for the /api/sync Next.js API route.
 *
 * The pg Pool is fully mocked so no real database is required.
 * Each test controls query results via mockQueryResults / mockQueryError.
 */

'use strict';

// ── In-memory store that mimics the sync_data table ─────────────────────────
// Variable must be prefixed with "mock" to be accessible inside jest.mock() factory.
let mockStore = {}; // token -> { encrypted_data, updated_at }

// Mock for `../../utils/db` used by the sync route
jest.mock('../utils/db', () => ({
  query: jest.fn(async (sql, params) => {
    const normalized = sql.replace(/\s+/g, ' ').trim();

    // CREATE TABLE — no-op
    if (/^CREATE TABLE/i.test(normalized)) {
      return { rows: [] };
    }

    // INSERT INTO sync_data (token, ...)
    if (/^INSERT INTO sync_data/i.test(normalized)) {
      const [token, encryptedData, updatedAt] = params;

      if (/ON CONFLICT.*DO UPDATE/i.test(normalized)) {
        // UPSERT
        mockStore[token] = { encrypted_data: encryptedData, updated_at: updatedAt };
      } else {
        // Plain insert (create action)
        mockStore[token] = { encrypted_data: encryptedData, updated_at: updatedAt };
      }
      return { rows: [] };
    }

    // SELECT encrypted_data, updated_at FROM sync_data WHERE token = $1
    if (/^SELECT encrypted_data, updated_at FROM sync_data/i.test(normalized)) {
      const [token] = params;
      const row = mockStore[token];
      return { rows: row ? [row] : [] };
    }

    // DELETE FROM sync_data WHERE token = $1
    if (/^DELETE FROM sync_data/i.test(normalized)) {
      const [token] = params;
      delete mockStore[token];
      return { rows: [] };
    }

    return { rows: [] };
  }),
}));

// ── Import the handler AFTER mocks are defined ───────────────────────────────
const handler = require('../pages/api/sync').default;

// ── Minimal req/res helpers ──────────────────────────────────────────────────
function makeReq(method, { body = null, query = {} } = {}) {
  return { method, body, query };
}

function makeRes() {
  const res = {
    _status: 200,
    _json: null,
    _headers: {},
    status(code) { this._status = code; return this; },
    json(data) { this._json = data; return this; },
    setHeader(k, v) { this._headers[k] = v; return this; },
    end() { return this; },
  };
  return res;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
beforeEach(() => {
  mockStore = {}; // reset in-memory store before each test
});

// ── POST create ──────────────────────────────────────────────────────────────

describe('POST /api/sync — action: create', () => {
  test('creates a new sync token and returns it', async () => {
    const req = makeReq('POST', {
      body: { action: 'create', encrypted_data: 'abc123', updated_at: 1000 },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.ok).toBe(true);
    expect(typeof res._json.token).toBe('string');
    expect(res._json.token).toHaveLength(6);
  });

  test('generated token contains only allowed characters', async () => {
    const req = makeReq('POST', {
      body: { action: 'create', encrypted_data: 'blob', updated_at: 1000 },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res._json.token).toMatch(/^[A-Z2-9]{6}$/);
  });
});

// ── POST push ────────────────────────────────────────────────────────────────

describe('POST /api/sync — action: push', () => {
  test('pushes data and returns ok with server updated_at', async () => {
    // Seed a row first
    mockStore['ABCD12'] = { encrypted_data: 'old', updated_at: 500 };

    const req = makeReq('POST', {
      body: { action: 'push', token: 'ABCD12', encrypted_data: 'new-blob' },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res._json.ok).toBe(true);
    expect(typeof res._json.updated_at).toBe('number');
  });

  test('normalizes token to uppercase', async () => {
    mockStore['ABCD12'] = { encrypted_data: 'x', updated_at: 500 };

    const req = makeReq('POST', {
      body: { action: 'push', token: 'abcd12', encrypted_data: 'blob' },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res._json.ok).toBe(true);
  });

  test('returns 400 when token is missing', async () => {
    const req = makeReq('POST', {
      body: { action: 'push', encrypted_data: 'blob' },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.error).toBeDefined();
  });

  test('returns 400 when encrypted_data is missing', async () => {
    const req = makeReq('POST', {
      body: { action: 'push', token: 'ABCD12' },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(400);
  });

  test('returns 400 for unknown action', async () => {
    const req = makeReq('POST', {
      body: { action: 'unknown' },
    });
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(400);
  });
});

// ── GET pull ─────────────────────────────────────────────────────────────────

describe('GET /api/sync', () => {
  test('returns changed:true with encrypted_data when data is newer than since', async () => {
    mockStore['AAAA11'] = { encrypted_data: 'payload', updated_at: 2000 };

    const req = makeReq('GET', { query: { token: 'AAAA11', since: '1000' } });
    const res = makeRes();
    await handler(req, res);

    expect(res._json.ok).toBe(true);
    expect(res._json.changed).toBe(true);
    expect(res._json.encrypted_data).toBe('payload');
    expect(res._json.updated_at).toBe(2000);
  });

  test('returns changed:false with updated_at when data is not newer than since', async () => {
    mockStore['BBBB22'] = { encrypted_data: 'payload', updated_at: 1000 };

    const req = makeReq('GET', { query: { token: 'BBBB22', since: '1000' } });
    const res = makeRes();
    await handler(req, res);

    expect(res._json.ok).toBe(true);
    expect(res._json.changed).toBe(false);
    // updated_at must be returned even for unchanged responses (stale-timestamp fix)
    expect(res._json.updated_at).toBe(1000);
  });

  test('returns 404 for unknown token', async () => {
    const req = makeReq('GET', { query: { token: 'ZZZZZZ' } });
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(404);
    expect(res._json.error).toMatch(/not found/i);
  });

  test('returns 400 when token is missing', async () => {
    const req = makeReq('GET', { query: {} });
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(400);
  });

  test('returns full data when since is not provided', async () => {
    mockStore['CCCC33'] = { encrypted_data: 'full', updated_at: 5000 };

    const req = makeReq('GET', { query: { token: 'CCCC33' } });
    const res = makeRes();
    await handler(req, res);

    expect(res._json.changed).toBe(true);
    expect(res._json.encrypted_data).toBe('full');
  });
});

// ── DELETE unpair ─────────────────────────────────────────────────────────────

describe('DELETE /api/sync', () => {
  test('removes the token and returns ok', async () => {
    mockStore['DDDD44'] = { encrypted_data: 'data', updated_at: 3000 };

    const req = makeReq('DELETE', { body: { token: 'DDDD44' } });
    const res = makeRes();
    await handler(req, res);

    expect(res._json.ok).toBe(true);
    expect(mockStore['DDDD44']).toBeUndefined();
  });

  test('succeeds even when token does not exist', async () => {
    const req = makeReq('DELETE', { body: { token: 'ZZZZZZ' } });
    const res = makeRes();
    await handler(req, res);

    expect(res._json.ok).toBe(true);
  });
});

// ── Unsupported methods ────────────────────────────────────────────────────────

describe('Unsupported HTTP methods', () => {
  test('returns 405 for PATCH', async () => {
    const req = makeReq('PATCH', {});
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(405);
  });
});
