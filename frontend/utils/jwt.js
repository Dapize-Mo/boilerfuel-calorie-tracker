import { SignJWT, jwtVerify } from 'jose';

const alg = 'HS256';

function getSecret() {
  const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'change-me';
  return new TextEncoder().encode(secret);
}

export async function signAdminToken() {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 7; // 7 days
  return await new SignJWT({ is_admin: true })
    .setProtectedHeader({ alg })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(getSecret());
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: [alg],
  });
  return payload;
}

export function requireAdmin(req) {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) {
    const err = new Error('Missing token');
    err.status = 401;
    throw err;
  }
  return verifyToken(token).then((payload) => {
    if (!payload?.is_admin) {
      const err = new Error('Admin privileges required');
      err.status = 403;
      throw err;
    }
    return payload;
  });
}
