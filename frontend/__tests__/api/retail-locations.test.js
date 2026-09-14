jest.mock('../../utils/db', () => ({
  query: jest.fn(),
  ensureSchema: jest.fn(),
}));

const { query, ensureSchema } = require('../../utils/db');
const handler = require('../../pages/api/retail-locations').default;

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(key, value) { this.headers[key] = value; },
    json(payload) { this.body = payload; return this; },
  };
}

describe('/api/retail-locations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes the retail schema before querying live locations', async () => {
    const rows = [{ id: 'demo', name: 'Demo Cafe', is_open: true }];
    ensureSchema.mockResolvedValue();
    query.mockResolvedValue({ rows });
    const res = createRes();

    await handler({ method: 'GET' }, res);

    expect(ensureSchema).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(rows);
  });
});
