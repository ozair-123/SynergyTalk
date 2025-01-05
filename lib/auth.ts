import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

export async function hashPassword(password: string) {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await compare(password, hashedPassword);
}

export function generateToken(userId: string) {
  return sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '1d' });
}

export function verifyToken(token: string) {
  try {
    return verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch {
    return null;
  }
}