import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { User, type UserDoc } from '../../models/User.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import { AppError } from '../../utils/AppError.js';
import type { LoginInput } from './auth.validation.js';

const issueRefreshToken = async (userId: string): Promise<string> => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

  });

  return rawToken;
};

const hashToken = (raw: string): string => {
  return crypto.createHash('sha256').update(raw).digest('hex');
};

const signAccessToken = (user: UserDoc) =>
  jwt.sign({
    sub: user._id.toString(),
    role: user.role,
    departmentId : user.departmentId?.toString(),
    storeId : user.storeId?.toString(),
    

  }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']
  });

const publicUser = (user: UserDoc) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
  firstName: user.firstName,
});

export const authService = {
  async login(input: LoginInput) {
    const user = await User.findOne({ email: input.email }).select('+passwordHash');
    if (!user || !user.isActive) throw AppError.unauthorized('Invalid credentials');

    const valid = await user.comparePassword(input.password);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    const accessToken = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user._id.toString());
    return { accessToken, refreshToken, user: publicUser(user) };
  },

  async refresh(rawToken: string | undefined) {
    if (!rawToken) throw AppError.unauthorized('Missing refresh token');

    const tokenHash = hashToken(rawToken);
    const stored = await RefreshToken.findOne({ tokenHash });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    const user = await User.findById(stored.userId);
    if (!user || !user.isActive) throw AppError.unauthorized('Invalid refresh token');

    stored.revokedAt = new Date();
    await stored.save();

    const accessToken = signAccessToken(user);
    const newRefreshToken = await issueRefreshToken(user._id.toString());
    return { accessToken, refreshToken: newRefreshToken, user: publicUser(user) };
  },

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    await RefreshToken.updateOne({ tokenHash: hashToken(rawToken) }, { revokedAt: new Date() });
  }
};
