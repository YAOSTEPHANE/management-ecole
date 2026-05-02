import jwt, { type SignOptions } from 'jsonwebtoken';

function jwtSecret(): string {
  const s = (process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production').trim();
  return s.length > 0 ? s : 'dev-jwt-secret-change-in-production';
}

function expiresInOption(): SignOptions['expiresIn'] {
  const raw = (process.env.JWT_EXPIRES_IN ?? '7d').trim();
  return (raw.length > 0 ? raw : '7d') as SignOptions['expiresIn'];
}

export const generateToken = (userId: string, email: string, role: string): string => {
  const options: SignOptions = { expiresIn: expiresInOption() };
  return jwt.sign(
    {
      userId: String(userId),
      email: String(email),
      role: String(role),
    },
    jwtSecret(),
    options
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, jwtSecret());
};
