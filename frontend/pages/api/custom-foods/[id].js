// Single custom food: read, update, delete. Rows are scoped to the signed-in
// user's email, so one user can never touch another user's foods.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { query, ensureSchema } from '../../../utils/db';
import { csrfCheck } from '../../../utils/csrf';
import { validateCustomFood } from './index';

const RETURNING = 'id, name, calories, macros, serving_size, notes, created_at, updated_at';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Sign in required' });
  }
  if (!csrfCheck(req, res)) return;

  const userEmail = session.user.email.toLowerCase();
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid food id' });
  }

  try {
    await ensureSchema();

    if (req.method === 'GET') {
      const result = await query(
        `SELECT ${RETURNING} FROM custom_foods WHERE id = $1 AND user_email = $2`,
        [id, userEmail]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ custom_food: result.rows[0] });
    }

    if (req.method === 'PUT') {
      const { error, food } = validateCustomFood(req.body);
      if (error) return res.status(400).json({ error });

      const result = await query(
        `UPDATE custom_foods
         SET name = $1, calories = $2, macros = $3, serving_size = $4, notes = $5, updated_at = NOW()
         WHERE id = $6 AND user_email = $7
         RETURNING ${RETURNING}`,
        [food.name, food.calories, JSON.stringify(food.macros), food.serving_size, food.notes, id, userEmail]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ custom_food: result.rows[0] });
    }

    if (req.method === 'DELETE') {
      const result = await query(
        `DELETE FROM custom_foods WHERE id = $1 AND user_email = $2 RETURNING id`,
        [id, userEmail]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('[custom-foods/:id] API error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
