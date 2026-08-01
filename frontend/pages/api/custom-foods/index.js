// Custom foods CRUD backed by Postgres (see custom_foods table in utils/db.js).
// Auth: NextAuth session cookie (sent automatically on same-origin requests).

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { query, ensureSchema } from '../../../utils/db';
import { csrfCheck } from '../../../utils/csrf';

export function validateCustomFood(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return { error: 'Food name is required' };
  if (name.length > 255) return { error: 'Food name must be 255 characters or fewer' };

  const calories = Number(body.calories);
  if (!Number.isInteger(calories) || calories < 0) {
    return { error: 'Valid calories value is required (0 or more)' };
  }

  const rawMacros = body.macros && typeof body.macros === 'object' ? body.macros : {};
  const macros = {};
  for (const key of ['protein', 'carbs', 'fats']) {
    const val = Math.trunc(Number(rawMacros[key]));
    macros[key] = Number.isFinite(val) && val > 0 ? val : 0;
  }

  let serving_size = null;
  if (body.serving_size != null && body.serving_size !== '') {
    if (typeof body.serving_size !== 'string') return { error: 'Serving size must be text' };
    serving_size = body.serving_size.trim().slice(0, 100) || null;
  }

  let notes = null;
  if (body.notes != null && body.notes !== '') {
    if (typeof body.notes !== 'string') return { error: 'Notes must be text' };
    notes = body.notes.trim() || null;
  }

  return { food: { name, calories, macros, serving_size, notes } };
}

const RETURNING = 'id, name, calories, macros, serving_size, notes, created_at, updated_at';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Sign in required' });
  }
  if (!csrfCheck(req, res)) return;

  const userEmail = session.user.email.toLowerCase();

  try {
    await ensureSchema();

    if (req.method === 'GET') {
      const result = await query(
        `SELECT ${RETURNING} FROM custom_foods WHERE user_email = $1 ORDER BY created_at DESC`,
        [userEmail]
      );
      return res.status(200).json({ custom_foods: result.rows });
    }

    if (req.method === 'POST') {
      const { error, food } = validateCustomFood(req.body);
      if (error) return res.status(400).json({ error });

      const result = await query(
        `INSERT INTO custom_foods (user_email, user_sub, name, calories, macros, serving_size, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${RETURNING}`,
        [
          userEmail,
          session.user.id || null,
          food.name,
          food.calories,
          JSON.stringify(food.macros),
          food.serving_size,
          food.notes,
        ]
      );
      return res.status(201).json({ custom_food: result.rows[0] });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('[custom-foods] API error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
