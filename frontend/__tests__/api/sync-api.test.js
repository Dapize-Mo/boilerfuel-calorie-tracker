jest.mock('../../utils/db', () => ({
  query: jest.fn(),
}));

const { query } = require('../../utils/db');
const handler = require('../../pages/api/sync').default;

function createRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end(payload) {
      this.body = payload || this.body;
      return this;
    },
  };
  return res;
}

describe('/api/sync handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST create returns token', async () => {
    query.mockImplementation(async sql => {
      if (String(sql).includes('RETURNING token')) {
        return { rows: [{ token: 'ABCD23', revision: 1, updated_at: 1234 }] };
      }
      return { rows: [] };
    });

    const req = {
      method: 'POST',
      body: { action: 'create', encrypted_data: 'enc', updated_at: 1234 },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toHaveLength(6);
    expect(res.body.revision).toBe(1);
  });

  test('POST push rejects invalid token', async () => {
    query.mockResolvedValue({ rows: [] });

    const req = {
      method: 'POST',
      body: { action: 'push', token: 'bad token!!', encrypted_data: 'enc' },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Missing token or data/);
  });

  test('GET returns changed false when since is up to date', async () => {
    query.mockImplementation(async sql => {
      if (String(sql).includes('SELECT encrypted_data')) {
        return { rows: [{ encrypted_data: 'enc', updated_at: 1000, revision: 7 }] };
      }
      return { rows: [] };
    });

    const req = {
      method: 'GET',
      query: { token: 'ABCD23', since: '1000' },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.changed).toBe(false);
    expect(res.body.updated_at).toBe(1000);
  });

  test('GET returns changed false when since_revision is up to date', async () => {
    query.mockImplementation(async sql => {
      if (String(sql).includes('SELECT encrypted_data')) {
        return { rows: [{ encrypted_data: 'enc', updated_at: 1000, revision: 7 }] };
      }
      return { rows: [] };
    });

    const req = {
      method: 'GET',
      query: { token: 'ABCD23', since_revision: '7', since: '0' },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.changed).toBe(false);
    expect(res.body.revision).toBe(7);
  });

  test('GET returns 404 for unknown token', async () => {
    query.mockImplementation(async sql => {
      if (String(sql).includes('SELECT encrypted_data')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const req = {
      method: 'GET',
      query: { token: 'ABCD23', since: '0' },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
