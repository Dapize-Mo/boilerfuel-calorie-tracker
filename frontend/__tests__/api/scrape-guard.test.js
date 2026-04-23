jest.mock('../../utils/db', () => ({
  assertDatabaseHasHeadroom: jest.fn(),
}));

const { assertDatabaseHasHeadroom } = require('../../utils/db');
const scrapeHandler = require('../../pages/api/admin/scrape').default;
const retailHandler = require('../../pages/api/admin/scrape-retail').default;

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

describe('scrape capacity guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('admin scrape route returns 503 when guard triggers', async () => {
    assertDatabaseHasHeadroom.mockRejectedValue({
      status: 503,
      code: 'DB_CAPACITY_GUARD_TRIGGERED',
      message: 'Scraping paused by DB guard',
      details: { shouldPauseScraping: true, usedPercent: 96.2, thresholdPercent: 95 },
    });

    const req = { method: 'POST', headers: {} };
    const res = createRes();

    await scrapeHandler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.error).toMatch(/paused/i);
    expect(res.body.code).toBe('DB_CAPACITY_GUARD_TRIGGERED');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('retail scrape route returns 503 when guard triggers', async () => {
    assertDatabaseHasHeadroom.mockRejectedValue({
      status: 503,
      code: 'DB_CAPACITY_GUARD_TRIGGERED',
      message: 'Scraping paused by DB guard',
      details: { shouldPauseScraping: true, usedPercent: 97.1, thresholdPercent: 95 },
    });

    const req = { method: 'POST', headers: {} };
    const res = createRes();

    await retailHandler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body.error).toMatch(/paused/i);
    expect(res.body.code).toBe('DB_CAPACITY_GUARD_TRIGGERED');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
