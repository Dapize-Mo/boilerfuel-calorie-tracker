// Sync stress test against production sync endpoint.
// Scenario: 3 devices, each seeds 5 days of meals, then performs 10 follow-up
// sync rounds where each device adds new data and all devices must converge.

import { webcrypto } from 'crypto';
const subtle = webcrypto.subtle;
const getRandomValues = (arr) => webcrypto.getRandomValues(arr);

const BASE_URL = 'https://boiler-calorie-tracker-v3.vercel.app/api/sync';

// ── Crypto helpers (mirrors frontend/utils/sync.js) ──

async function deriveKey(secret) {
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('boilerfuel-sync'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(data, secret) {
  const key = await deriveKey(secret);
  const enc = new TextEncoder();
  const iv = getRandomValues(new Uint8Array(12));
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return Buffer.from(combined).toString('base64');
}

async function decrypt(base64, secret) {
  const key = await deriveKey(secret);
  const combined = Buffer.from(base64, 'base64');
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function generateSecret() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const arr = new Uint8Array(16);
  getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

const FOODS = [
  { id: 'f1', name: 'Grilled Chicken', calories: 350, macros: { protein: 45, carbs: 0, fats: 12 }, dining_court: 'Hillenbrand', station: 'Grill', meal_time: 'lunch' },
  { id: 'f2', name: 'Brown Rice', calories: 200, macros: { protein: 4, carbs: 42, fats: 2 }, dining_court: 'Earhart', station: 'Sides', meal_time: 'lunch' },
  { id: 'f3', name: 'Scrambled Eggs', calories: 180, macros: { protein: 14, carbs: 2, fats: 12 }, dining_court: 'Ford', station: 'Breakfast', meal_time: 'breakfast' },
  { id: 'f4', name: 'Oatmeal', calories: 150, macros: { protein: 5, carbs: 27, fats: 3 }, dining_court: 'Wiley', station: 'Hot Bar', meal_time: 'breakfast' },
  { id: 'f5', name: 'Caesar Salad', calories: 220, macros: { protein: 6, carbs: 18, fats: 14 }, dining_court: 'Hillenbrand', station: 'Salad Bar', meal_time: 'dinner' },
  { id: 'f6', name: 'Turkey Sandwich', calories: 310, macros: { protein: 24, carbs: 31, fats: 9 }, dining_court: 'Windsor', station: 'Deli', meal_time: 'lunch' },
  { id: 'f7', name: 'Greek Yogurt', calories: 120, macros: { protein: 15, carbs: 8, fats: 2 }, dining_court: 'Ford', station: 'Breakfast', meal_time: 'breakfast' },
  { id: 'f8', name: 'Pasta Bowl', calories: 520, macros: { protein: 18, carbs: 76, fats: 14 }, dining_court: 'Earhart', station: 'Italian', meal_time: 'dinner' },
  { id: 'f9', name: 'Protein Shake', calories: 240, macros: { protein: 30, carbs: 19, fats: 4 }, dining_court: 'Hillenbrand', station: 'Beverages', meal_time: 'snack' },
  { id: 'f10', name: 'Fruit Cup', calories: 95, macros: { protein: 1, carbs: 24, fats: 0 }, dining_court: 'Wiley', station: 'Fresh', meal_time: 'snack' },
];

let mealCounter = 1;

function makeMeal(food, label) {
  return {
    id: food.id,
    name: `${food.name} (${label})`,
    calories: food.calories,
    macros: food.macros,
    dining_court: food.dining_court,
    station: food.station,
    meal_time: food.meal_time,
    servings: 1,
    addedAt: Date.now() + mealCounter++,
  };
}

function dayKey(daysAgo) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function get5DayWindow() {
  return [4, 3, 2, 1, 0].map(dayKey);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function mealIdentity(day, meal) {
  return `${day}|${meal.addedAt}|${meal.name}|${meal.calories}`;
}

function mergeMeals(localMeals, remoteMeals) {
  const result = deepClone(localMeals || {});
  const seen = new Set();

  for (const [day, meals] of Object.entries(result)) {
    for (const meal of meals || []) seen.add(mealIdentity(day, meal));
  }

  for (const [day, meals] of Object.entries(remoteMeals || {})) {
    if (!result[day]) result[day] = [];
    for (const meal of meals || []) {
      const id = mealIdentity(day, meal);
      if (!seen.has(id)) {
        result[day].push(meal);
        seen.add(id);
      }
    }
  }

  return result;
}

function flattenIdentities(mealsByDay) {
  const ids = [];
  for (const day of Object.keys(mealsByDay || {}).sort()) {
    for (const meal of mealsByDay[day] || []) {
      ids.push(mealIdentity(day, meal));
    }
  }
  return ids.sort();
}

// ── API helpers ──

async function apiPost(body) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function apiGet(token, sinceRevision = 0) {
  const url = `${BASE_URL}?token=${encodeURIComponent(token)}&since_revision=${sinceRevision}&since=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function apiDelete(token) {
  const res = await fetch(BASE_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

// ── Main test ──

async function pullIntoDevice(device, token, secret) {
  const pullRes = await apiGet(token, device.revision);
  if (pullRes.changed && pullRes.encrypted_data) {
    const serverData = await decrypt(pullRes.encrypted_data, secret);
    device.meals = mergeMeals(device.meals, serverData.boilerfuel_meals || {});
  }
  if (Number.isFinite(Number(pullRes.revision))) {
    device.revision = Number(pullRes.revision);
  }
  return pullRes;
}

async function pushFromDevice(device, token, secret) {
  const payload = { boilerfuel_meals: device.meals };
  const encrypted = await encrypt(payload, secret);
  const pushRes = await apiPost({ action: 'push', token, encrypted_data: encrypted, updated_at: Date.now() });
  device.revision = Number(pushRes.revision) || device.revision;
  return pushRes;
}

function seedMealsForDevice(deviceName, days, offset) {
  const meals = {};
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const food = FOODS[(offset + i) % FOODS.length];
    meals[day] = [makeMeal(food, `${deviceName}-seed-${day}`)];
  }
  return meals;
}

function addFollowupMeal(device, days, roundIdx, deviceIdx) {
  const day = days[(roundIdx + deviceIdx) % days.length];
  const food = FOODS[(roundIdx * 3 + deviceIdx) % FOODS.length];
  if (!device.meals[day]) device.meals[day] = [];
  device.meals[day].push(makeMeal(food, `${device.name}-r${roundIdx + 1}-${day}`));
}

function countMeals(mealsByDay) {
  return Object.values(mealsByDay || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
}

function allDevicesConverged(devices) {
  const baseline = JSON.stringify(flattenIdentities(devices[0].meals));
  return devices.every(d => JSON.stringify(flattenIdentities(d.meals)) === baseline);
}

async function runSyncTest() {
  console.log('=== BoilerFuel Sync Stress Test (Vercel) ===\n');

  const secret = generateSecret();
  const days = get5DayWindow();
  const devices = [
    { name: 'A', revision: 0, meals: seedMealsForDevice('A', days, 0) },
    { name: 'B', revision: 0, meals: seedMealsForDevice('B', days, 2) },
    { name: 'C', revision: 0, meals: seedMealsForDevice('C', days, 4) },
  ];

  // Device A creates the pair with its seed data.
  const initialEncrypted = await encrypt({ boilerfuel_meals: devices[0].meals }, secret);
  const createRes = await apiPost({ action: 'create', encrypted_data: initialEncrypted, updated_at: Date.now() });
  const token = createRes.token;
  devices[0].revision = Number(createRes.revision) || 1;

  console.log(`Token: ${token}`);
  console.log(`Secret: ${secret}`);
  console.log(`Days under test: ${days.join(', ')}`);
  console.log('Initial seeding: 5 days on each of 3 devices\n');

  // Device B and C join, merge existing server data, then push their own + merged data.
  for (let i = 1; i < devices.length; i++) {
    const d = devices[i];
    await pullIntoDevice(d, token, secret);
    await pushFromDevice(d, token, secret);
    await pullIntoDevice(devices[0], token, secret);
  }

  // Ensure every device has converged after initial seed.
  for (const d of devices) await pullIntoDevice(d, token, secret);
  const initialConverged = allDevicesConverged(devices);
  const initialCount = countMeals(devices[0].meals);
  console.log(`Initial convergence: ${initialConverged ? 'PASS' : 'FAIL'} (meal count per device: ${initialCount})\n`);

  let allPassed = initialConverged;
  const expectedInitialMeals = 15;
  if (initialCount !== expectedInitialMeals) {
    console.log(`Expected ${expectedInitialMeals} meals after initial sync but found ${initialCount}`);
    allPassed = false;
  }

  // 10 follow-up rounds; each round each device adds one new meal and syncs.
  for (let round = 0; round < 10; round++) {
    console.log(`--- Follow-up Round ${round + 1}/10 ---`);

    for (let i = 0; i < devices.length; i++) {
      const d = devices[i];
      addFollowupMeal(d, days, round, i);
      await pullIntoDevice(d, token, secret);
      await pushFromDevice(d, token, secret);
      console.log(`  Device ${d.name}: added + pushed (revision ${d.revision})`);
    }

    // Pull latest server state into all devices.
    for (const d of devices) {
      await pullIntoDevice(d, token, secret);
    }

    const converged = allDevicesConverged(devices);
    const count = countMeals(devices[0].meals);
    const expectedCount = expectedInitialMeals + (round + 1) * devices.length;
    const roundPass = converged && count === expectedCount;

    console.log(`  Expected meals/device: ${expectedCount}`);
    console.log(`  Actual meals/device: ${count}`);
    console.log(`  Convergence: ${converged ? 'YES' : 'NO'}`);
    console.log(`  Round result: ${roundPass ? 'PASS' : 'FAIL'}\n`);

    if (!roundPass) allPassed = false;
  }

  await apiDelete(token);
  console.log('Sync pair deleted.\n');
  console.log(`=== FINAL RESULT: ${allPassed ? 'PASS' : 'FAIL'} ===`);
}

runSyncTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
