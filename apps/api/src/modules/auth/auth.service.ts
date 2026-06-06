import { eq, and, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users, refreshTokens } from "@gymflow/db";
import type { JwtPayload } from "@gymflow/shared";
import type { Database } from "@gymflow/db";
import { signAccessToken } from "../../utils/jwt.js";
import { generateRefreshToken, hashToken } from "../../utils/token.js";
import { AppError } from "../../utils/app-error.js";
import { env } from "../../config/env.js";

const GENERIC_LOGIN_ERROR = "Invalid email or password";

function parseExpiry(expr: string): Date {
  const match = expr.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expr}`);
  const num = parseInt(match[1]!, 10);
  const unit = match[2]!;
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]!;
  return new Date(Date.now() + num * ms);
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  gymId: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

async function createTokenPair(
  db: Database,
  user: { id: string; gymId: string; email: string; role: string }
): Promise<TokenPair> {
  const jwtPayload: JwtPayload = {
    userId: user.id,
    gymId: user.gymId,
    role: user.role,
    email: user.email,
  };

  const accessToken = signAccessToken(jwtPayload);
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };
}

export async function login(
  db: Database,
  email: string,
  password: string
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.isActive, true)))
    .limit(1);

  if (!user) {
    throw AppError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  const tokens = await createTokenPair(db, user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      gymId: user.gymId,
      phone: user.phone,
      isActive: user.isActive,
      lastLoginAt: new Date(),
      createdAt: user.createdAt,
    },
    tokens,
  };
}

export async function refresh(
  db: Database,
  rawRefreshToken: string
): Promise<TokenPair> {
  const tokenHash = hashToken(rawRefreshToken);

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.id, stored.id));
    }
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.id, stored.id));

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, stored.userId), eq(users.isActive, true)))
    .limit(1);

  if (!user) {
    throw AppError.unauthorized("User account is deactivated");
  }

  return createTokenPair(db, user);
}

export async function logout(
  db: Database,
  rawRefreshToken: string
): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function logoutAll(
  db: Database,
  userId: string
): Promise<{ revokedCount: number }> {
  const deleted = await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.userId, userId))
    .returning({ id: refreshTokens.id });

  return { revokedCount: deleted.length };
}

export async function changePassword(
  db: Database,
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw AppError.notFound("User");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized("Current password is incorrect");
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.userId, userId));
}

export async function getMe(
  db: Database,
  userId: string
): Promise<AuthUser> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      gymId: users.gymId,
      phone: users.phone,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw AppError.notFound("User");
  }

  return user;
}

export async function cleanupExpiredTokens(db: Database): Promise<number> {
  const deleted = await db
    .delete(refreshTokens)
    .where(lt(refreshTokens.expiresAt, new Date()))
    .returning({ id: refreshTokens.id });

  return deleted.length;
}
