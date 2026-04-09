import { __testables, deriveKey, encrypt, decrypt } from '../../utils/sync';

describe('sync crypto and merge helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  test('deriveKey is deterministic for same secret', async () => {
    const keyA = await deriveKey('sync-secret-1');
    const keyB = await deriveKey('sync-secret-1');
    expect(String(keyA)).toBe(String(keyB));
  });

  test('encrypt/decrypt roundtrip preserves payload', async () => {
    const payload = {
      boilerfuel_meals: {
        '2026-04-09': [{ name: 'Soup', calories: 120, addedAt: 1001 }],
      },
      boilerfuel_water: { '2026-04-09': 4 },
    };
    const secret = 'my-secret';

    const encrypted = await encrypt(payload, secret);
    const decrypted = await decrypt(encrypted, secret);

    expect(decrypted).toEqual(payload);
  });

  test('mergeRemoteData unions meals using stable identity', () => {
    localStorage.setItem(
      'boilerfuel_meals',
      JSON.stringify({
        '2026-04-09': [
          { name: 'Soup', calories: 120, addedAt: 1001 },
          { name: 'Salad', calories: 200, addedAt: 2002 },
        ],
      })
    );

    __testables.mergeRemoteData({
      boilerfuel_meals: {
        '2026-04-09': [
          { name: 'Soup', calories: 120, addedAt: 1001 },
          { name: 'Pasta', calories: 450, addedAt: 3003 },
        ],
      },
    });

    const merged = JSON.parse(localStorage.getItem('boilerfuel_meals'));
    expect(merged['2026-04-09']).toHaveLength(3);
    expect(merged['2026-04-09'].map(m => m.name).sort()).toEqual(['Pasta', 'Salad', 'Soup']);
  });

  test('mergeRemoteData keeps max water by date', () => {
    localStorage.setItem('boilerfuel_water', JSON.stringify({ '2026-04-09': 3, '2026-04-08': 1 }));

    __testables.mergeRemoteData({
      boilerfuel_water: { '2026-04-09': 2, '2026-04-08': 5 },
    });

    const merged = JSON.parse(localStorage.getItem('boilerfuel_water'));
    expect(merged['2026-04-09']).toBe(3);
    expect(merged['2026-04-08']).toBe(5);
  });

  test('mergeRemoteData keeps local weight when both exist and fills gaps', () => {
    localStorage.setItem('boilerfuel_weight', JSON.stringify({ '2026-04-09': 180 }));

    __testables.mergeRemoteData({
      boilerfuel_weight: { '2026-04-09': 175, '2026-04-08': 182 },
    });

    const merged = JSON.parse(localStorage.getItem('boilerfuel_weight'));
    expect(merged['2026-04-09']).toBe(180);
    expect(merged['2026-04-08']).toBe(182);
  });

  test('normalizeToken trims and uppercases', () => {
    expect(__testables.normalizeToken('  ab12  ')).toBe('AB12');
  });
});
