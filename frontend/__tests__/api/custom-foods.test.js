jest.mock('../../utils/db', () => ({
  query: jest.fn(),
  ensureSchema: jest.fn(),
}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../pages/api/auth/[...nextauth]', () => ({
  authOptions: {},
}));

const { query, ensureSchema } = require('../../utils/db');
const { getServerSession } = require('next-auth/next');
const listHandler = require('../../pages/api/custom-foods/index').default;
const itemHandler = require('../../pages/api/custom-foods/[id]').default;

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

const SESSION = { user: { email: 'Boiler@Purdue.edu', id: 'google-sub-1' } };

describe('/api/custom-foods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureSchema.mockResolvedValue();
  });

  test('rejects unauthenticated requests with 401', async () => {
    getServerSession.mockResolvedValue(null);

    const res = createRes();
    await listHandler({ method: 'GET', headers: {}, query: {} }, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Sign in required');
    expect(query).not.toHaveBeenCalled();
  });

  test('GET returns the user\'s foods as { custom_foods }', async () => {
    getServerSession.mockResolvedValue(SESSION);
    const rows = [{ id: 1, name: 'Protein Shake', calories: 220, macros: { protein: 30, carbs: 10, fats: 5 } }];
    query.mockResolvedValue({ rows });

    const res = createRes();
    await listHandler({ method: 'GET', headers: {}, query: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.custom_foods).toEqual(rows);
    // scoped to the lowercased session email
    expect(query.mock.calls[0][1]).toEqual(['boiler@purdue.edu']);
  });

  test('POST validates name and calories', async () => {
    getServerSession.mockResolvedValue(SESSION);

    let res = createRes();
    await listHandler({ method: 'POST', headers: {}, body: { name: '  ', calories: 100 } }, res);
    expect(res.statusCode).toBe(400);

    res = createRes();
    await listHandler({ method: 'POST', headers: {}, body: { name: 'Toast', calories: -5 } }, res);
    expect(res.statusCode).toBe(400);

    expect(query).not.toHaveBeenCalled();
  });

  test('POST inserts and returns 201 { custom_food }', async () => {
    getServerSession.mockResolvedValue(SESSION);
    const row = { id: 7, name: 'Overnight Oats', calories: 340, macros: { protein: 12, carbs: 55, fats: 8 } };
    query.mockResolvedValue({ rows: [row] });

    const res = createRes();
    await listHandler({
      method: 'POST',
      headers: {},
      body: {
        name: ' Overnight Oats ',
        calories: 340,
        macros: { protein: 12, carbs: 55, fats: 8, junk: 99 },
        serving_size: '1 jar',
        notes: null,
      },
    }, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.custom_food).toEqual(row);
    const params = query.mock.calls[0][1];
    expect(params[0]).toBe('boiler@purdue.edu');
    expect(params[2]).toBe('Overnight Oats'); // trimmed
    expect(JSON.parse(params[4])).toEqual({ protein: 12, carbs: 55, fats: 8 }); // junk key dropped
  });

  test('POST blocks cross-origin requests (CSRF)', async () => {
    getServerSession.mockResolvedValue(SESSION);

    const res = createRes();
    await listHandler({
      method: 'POST',
      headers: { origin: 'https://evil.example', host: 'boiler-calorie-tracker-v3.vercel.app' },
      body: { name: 'X', calories: 1 },
    }, res);

    expect(res.statusCode).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });

  test('PUT on a food the user does not own returns 404', async () => {
    getServerSession.mockResolvedValue(SESSION);
    query.mockResolvedValue({ rows: [] });

    const res = createRes();
    await itemHandler({
      method: 'PUT',
      headers: {},
      query: { id: '42' },
      body: { name: 'Not Mine', calories: 100, macros: {} },
    }, res);

    expect(res.statusCode).toBe(404);
  });

  test('DELETE removes an owned food', async () => {
    getServerSession.mockResolvedValue(SESSION);
    query.mockResolvedValue({ rows: [{ id: 42 }] });

    const res = createRes();
    await itemHandler({ method: 'DELETE', headers: {}, query: { id: '42' } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(query.mock.calls[0][1]).toEqual([42, 'boiler@purdue.edu']);
  });

  test('rejects a non-numeric id', async () => {
    getServerSession.mockResolvedValue(SESSION);

    const res = createRes();
    await itemHandler({ method: 'DELETE', headers: {}, query: { id: 'abc' } }, res);

    expect(res.statusCode).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});
