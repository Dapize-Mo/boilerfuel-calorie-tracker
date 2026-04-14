/**
 * Integration test for the complete sync flow between two devices
 */
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

describe('Complete sync flow between two devices', () => {
  let database = {}; // In-memory store
  
  beforeEach(() => {
    jest.clearAllMocks();
    database = {}; // Reset between tests
  });

  test('Device A creates sync pair, Device B joins and receives data', async () => {
    // Mock the database operations
    query.mockImplementation(async (sql, params) => {
      const sqlStr = String(sql);
      
      // Handle CREATE TABLE (no-op)
      if (sqlStr.includes('CREATE TABLE')) {
        return { rows: [] };
      }
      
      // Handle INSERT for create action
      if (sqlStr.includes('INSERT INTO sync_data') && sqlStr.includes('RETURNING token')) {
        const token = params[0];
        const data = params[1];
        // The API handler uses the client's value for create but returns it server-side
        // For realistic testing, we'll use a simulated server timestamp
        const ts = params[2] || Date.now();
        database[token] = { encrypted_data: data, updated_at: ts };
        return { rows: [{ token }] };
      }
      
      // Handle UPDATE for push action
      if (sqlStr.includes('ON CONFLICT (token)') && sqlStr.includes('DO UPDATE')) {
        const token = params[0];
        const data = params[1];
        // The API handler uses Date.now() server-side, not the client's value
        // For testing, use the current timestamp to simulate server behavior
        const ts = Date.now();
        database[token] = { encrypted_data: data, updated_at: ts };
        return { rows: [] };
      }
      
      // Handle SELECT for pull
      if (sqlStr.includes('SELECT encrypted_data')) {
        const token = params[0];
        const row = database[token];
        if (!row) return { rows: [] };
        return { rows: [row] };
      }
      
      return { rows: [] };
    });

    // Step 1: Device A creates sync pair
    const createReq = {
      method: 'POST',
      body: {
        action: 'create',
        encrypted_data: 'device-a-initial-data',
        updated_at: Date.now(),
      },
    };
    const createResponse = createRes();
    await handler(createReq, createResponse);
    
    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.body.ok).toBe(true);
    expect(createResponse.body.token).toBeDefined();
    const syncToken = createResponse.body.token;
    const serverTsAfterCreate = createResponse.body.updated_at;

    // Small delay to ensure different timestamps
    await new Promise(r => setTimeout(r, 10));

    // Step 2: Device A pulls after creation (should get no changes)
    const pullAfterCreateReq = {
      method: 'GET',
      query: { token: syncToken, since: String(serverTsAfterCreate) },
    };
    const pullAfterCreateResponse = createRes();
    await handler(pullAfterCreateReq, pullAfterCreateResponse);
    
    expect(pullAfterCreateResponse.statusCode).toBe(200);
    expect(pullAfterCreateResponse.body.changed).toBe(false); // No changes, as expected

    // Step 3: Device A pushes new data (simulating adding a meal)
    const pushReq = {
      method: 'POST',
      body: {
        action: 'push',
        token: syncToken,
        encrypted_data: 'device-a-with-meal-data',
        updated_at: Date.now(),
      },
    };
    const pushResponse = createRes();
    await handler(pushReq, pushResponse);
    
    expect(pushResponse.statusCode).toBe(200);
    expect(pushResponse.body.ok).toBe(true);
    const serverTsAfterPush = pushResponse.body.updated_at;

    // Another small delay
    await new Promise(r => setTimeout(r, 10));

    // Step 4: Device B pulls from the same token (simulating joining)
    const deviceBPullReq = {
      method: 'GET',
      query: { token: syncToken, since: '0' }, // Full pull
    };
    const deviceBPullResponse = createRes();
    await handler(deviceBPullReq, deviceBPullResponse);
    
    expect(deviceBPullResponse.statusCode).toBe(200);
    expect(deviceBPullResponse.body.changed).toBe(true);
    expect(deviceBPullResponse.body.encrypted_data).toBe('device-a-with-meal-data');
    expect(deviceBPullResponse.body.updated_at).toBe(serverTsAfterPush);

    // Step 5: Device B pushes its merged data back
    const deviceBPushReq = {
      method: 'POST',
      body: {
        action: 'push',
        token: syncToken,
        encrypted_data: 'device-b-merged-data-with-own-changes',
        updated_at: Date.now(),
      },
    };
    const deviceBPushResponse = createRes();
    await handler(deviceBPushReq, deviceBPushResponse);
    
    expect(deviceBPushResponse.statusCode).toBe(200);
    expect(deviceBPushResponse.body.ok).toBe(true);
    const serverTsAfterDeviceBPush = deviceBPushResponse.body.updated_at;

    // We should have gotten a new timestamp from Device B's push
    expect(serverTsAfterDeviceBPush).toBeGreaterThan(serverTsAfterPush);

    // Step 6: Device A pulls again (should see Device B's changes)
    const deviceAPullAfterBPushReq = {
      method: 'GET',
      query: { token: syncToken, since: String(serverTsAfterPush) },
    };
    const deviceAPullAfterBPushResponse = createRes();
    await handler(deviceAPullAfterBPushReq, deviceAPullAfterBPushResponse);
    
    expect(deviceAPullAfterBPushResponse.statusCode).toBe(200);
    expect(deviceAPullAfterBPushResponse.body.changed).toBe(true);
    expect(deviceAPullAfterBPushResponse.body.encrypted_data).toBe('device-b-merged-data-with-own-changes');
  });

  test('Timestamp comparison handles edge cases correctly', async () => {
    query.mockImplementation(async (sql, params) => {
      const sqlStr = String(sql);
      if (sqlStr.includes('CREATE TABLE')) return { rows: [] };
      if (sqlStr.includes('INSERT INTO sync_data') && sqlStr.includes('RETURNING token')) {
        const token = params[0];
        const data = params[1];
        const ts = params[2];
        database[token] = { encrypted_data: data, updated_at: ts };
        return { rows: [{ token }] };
      }
      if (sqlStr.includes('SELECT encrypted_data')) {
        const token = params[0];
        const row = database[token];
        if (!row) return { rows: [] };
        return { rows: [row] };
      }
      return { rows: [] };
    });

    // Create sync pair with a specific timestamp
    const createReq = {
      method: 'POST',
      body: { action: 'create', encrypted_data: 'data', updated_at: 5000 },
    };
    const createResponse = createRes();
    await handler(createReq, createResponse);
    const token = createResponse.body.token;

    // Pull with since = updated_at (no changes expected)
    const pullExactMatchReq = {
      method: 'GET',
      query: { token, since: String(createResponse.body.updated_at) },
    };
    const pullExactMatchResponse = createRes();
    await handler(pullExactMatchReq, pullExactMatchResponse);
    expect(pullExactMatchResponse.body.changed).toBe(false);

    // Pull with since > updated_at (no changes expected)
    const pullBehindReq = {
      method: 'GET',
      query: { token, since: String(createResponse.body.updated_at + 1000) },
    };
    const pullBehindResponse = createRes();
    await handler(pullBehindReq, pullBehindResponse);
    expect(pullBehindResponse.body.changed).toBe(false);

    // Pull with since < updated_at (changes expected)
    const pullAheadReq = {
      method: 'GET',
      query: { token, since: String(createResponse.body.updated_at - 1000) },
    };
    const pullAheadResponse = createRes();
    await handler(pullAheadReq, pullAheadResponse);
    expect(pullAheadResponse.body.changed).toBe(true);
  });
});
