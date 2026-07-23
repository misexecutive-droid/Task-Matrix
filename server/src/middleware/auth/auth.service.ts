// Node's built-in crypto module - used here for generating random tokens and hashing them.
import crypto from 'node:crypto';
// jsonwebtoken: library for creating and verifying signed JWTs (JSON Web Tokens).
import jwt, { type SignOptions } from 'jsonwebtoken';
// Centralized environment config (secrets, expiry settings, etc).
import { env } from '../../config/env.js';
// The Mongoose User model/document type - represents a user stored in MongoDB.
import { User, type UserDoc } from '../../models/User.js';
// The Mongoose model for storing refresh tokens (hashed) in the database.
import { RefreshToken } from '../../models/RefreshToken.js';
// Same hashed-token pattern, but for one-time password-reset links instead of long-lived sessions.
import { PasswordResetToken } from '../../models/PasswordResetToken.js';
// Custom error class used to throw clean, typed HTTP errors (e.g. 401 Unauthorized).
import { AppError } from '../../utils/AppError.js';
// Sends the actual reset-link email (real SMTP if configured, an Ethereal test inbox otherwise).
import { sendMail } from '../../config/mailer.js';
// TypeScript type describing the shape of a validated login request body.
import type { LoginInput, RegisterInput, ResetPasswordInput } from './auth.validation.js';

// Creates a brand new refresh token for a given user, stores its HASH (not the raw value) in the
// DB, and returns the raw token so it can be sent to the client as a cookie.
// Why hash it? If someone ever reads the database (breach, leaked backup, etc.), they'd only see
// hashes, not usable tokens - the same reason passwords are hashed instead of stored in plain text.
const issueRefreshToken = async (userId: string): Promise<string> => {
  // Generate 32 random bytes and represent them as a hex string - this is the actual secret
  // that will be sent to the browser and stored in the cookie.
  const rawToken = crypto.randomBytes(32).toString('hex');
  // Hash the raw token with SHA-256 before saving it - this is what actually goes into the database.
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Save a record in the RefreshToken collection linking this hashed token to the user,
  // along with an expiry date so old tokens naturally become invalid.
  await RefreshToken.create({
    userId,
    tokenHash,
    // Refresh tokens are long-lived (here: 7 days) compared to short-lived access tokens.
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

  });

  // Return the RAW (unhashed) token - this is the only moment it exists outside the DB;
  // we never store or log the raw value again after this.
  return rawToken;
};

// Small helper to hash any raw token the same way it was hashed when it was issued, so we can
// look it up in the database by comparing hashes instead of raw values.
const hashToken = (raw: string): string => {
  return crypto.createHash('sha256').update(raw).digest('hex');
};

// Creates a short-lived JWT "access token" that identifies the user on each API request.
// Unlike the refresh token, this is NOT stored in the database - its validity is verified purely
// by checking its cryptographic signature (see auth.ts's `authenticate` middleware).
const signAccessToken = (user: UserDoc) =>
  jwt.sign({
    // "sub" (subject) is the standard JWT field for "who is this token about" - the user's Mongo ID.
    sub: user._id.toString(),
    // Include the user's role so downstream middleware (requireRole) can do access control
    // without needing another database lookup.
    role: user.role,
    // Optional extra context embedded in the token, useful for scoping requests to a department...
    departmentId : user.departmentId?.toString(),
    // ...or a specific store, if the user belongs to one.
    storeId : user.storeId?.toString(),


  }, env.JWT_ACCESS_SECRET, {
    // How long this access token stays valid before the client must use the refresh token to get a new one.
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']
  });

// Strips out any sensitive/internal fields (like the password hash) before sending user data back
// to the client - we only expose what the frontend actually needs.
const publicUser = (user: UserDoc) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
  firstName: user.firstName,
});

// The main authentication service - all the actual "business logic" for login/refresh/logout lives
// here, separate from the HTTP-handling code in auth.controller.ts.
export const authService = {
  // Handles a brand new signup. Every self-registered account starts as a plain "USER" (never
  // ADMIN/MANAGER/AGENT) with no department/store — those are only ever set by an admin later
  // via the /users management endpoints, not chosen by the person signing themselves up.
  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) throw AppError.conflict('Email already registered');

    const user = new User({ email, firstName: input.firstName, lastName: input.lastName });
    // Same virtual-setter pattern as login/user.service.ts's create() — assigning `.password`
    // triggers the model's pre('validate') hook to hash it before saving.
    (user as any).password = input.password;
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = await issueRefreshToken(user._id.toString());
    return { accessToken, refreshToken, user: publicUser(user) };
  },

  // Handles a login attempt: check credentials, and if valid, issue a fresh pair of tokens.
  async login(input: LoginInput) {
    // The schema lowercases/trims email on SAVE only (see User.ts), never on a query filter -
    // so this lookup has to normalize the same way, or a merely differently-cased/padded email
    // (which is how the account is actually stored) silently fails to match.
    const email = input.email.trim().toLowerCase();
    // `.select('+passwordHash')` is needed because the User model excludes passwordHash from
    // queries by default (for safety) - we explicitly opt back in here since we need it to
    // verify the password.
    const user = await User.findOne({ email }).select('+passwordHash');
    // If no user was found, OR the account has been deactivated, reject with a generic message.
    // Using the same "Invalid credentials" message for "no such user" and "wrong password" stops
    // attackers from being able to tell whether a given email is registered (user enumeration).
    if (!user || !user.isActive) throw AppError.unauthorized('Invalid credentials');

    // Compare the submitted plain-text password against the stored bcrypt hash
    // (comparePassword is presumably a method on the User schema that wraps bcrypt.compare).
    const valid = await user.comparePassword(input.password);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    // Credentials check out - issue a new short-lived access token...
    const accessToken = signAccessToken(user);
    // ...and a new long-lived refresh token (stored hashed in the DB).
    const refreshToken = await issueRefreshToken(user._id.toString());
    // Return everything the controller needs to build its response.
    return { accessToken, refreshToken, user: publicUser(user) };
  },

  // Handles refreshing an access token using a previously issued refresh token (read from a cookie).
  async refresh(rawToken: string | undefined) {
    // No token at all means the client isn't logged in (or the cookie expired/was cleared).
    if (!rawToken) throw AppError.unauthorized('Missing refresh token');

    // Hash the incoming raw token the same way we did when it was created, so we can find it in
    // the DB (we never store raw tokens, so we can't look them up directly).
    const tokenHash = hashToken(rawToken);
    const stored = await RefreshToken.findOne({ tokenHash });
    // Reject if: the token doesn't exist, it was already revoked (e.g. from a previous
    // refresh/logout), or it has simply expired based on its stored expiry date.
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    // Look up the user this token belongs to, and make sure their account is still active.
    const user = await User.findById(stored.userId);
    if (!user || !user.isActive) throw AppError.unauthorized('Invalid refresh token');

    // Revoke (invalidate) the OLD refresh token now that it's being used - this is "refresh token
    // rotation": each refresh token can only be used once, which limits the damage if a token were
    // ever stolen (the thief and the real user can't both keep using the same one indefinitely).
    stored.revokedAt = new Date();
    await stored.save();

    // Issue a brand new access token...
    const accessToken = signAccessToken(user);
    // ...and a brand new refresh token to replace the one we just revoked.
    const newRefreshToken = await issueRefreshToken(user._id.toString());
    return { accessToken, refreshToken: newRefreshToken, user: publicUser(user) };
  },

  // Handles logging a user out by revoking their refresh token so it can never be used again.
  async logout(rawToken: string | undefined) {
    // If there's no token to begin with, there's nothing to revoke - just quietly succeed.
    if (!rawToken) return;
    // Find the matching token by its hash and mark it revoked (soft-delete style, keeps a record around).
    await RefreshToken.updateOne({ tokenHash: hashToken(rawToken) }, { revokedAt: new Date() });
  },

  // Handles a "forgot password" request: if the email belongs to a real, active account, generate
  // a one-time reset token and email a reset link. Always resolves successfully either way (never
  // reveals whether the email exists) - the controller responds the same generic message regardless,
  // which is what actually protects against user enumeration; this just makes sure there's nothing
  // to leak even if that changed later.
  async forgotPassword(rawEmail: string) {
    const user = await User.findOne({ email: rawEmail.trim().toLowerCase(), isActive: true });
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      // Reset links are short-lived (1 hour) - much shorter than a refresh token, since this one
      // grants the ability to take over the account entirely if it leaked (e.g. via a shared inbox).
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetLink = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
    // Always logged server-side regardless of whether the email actually sends (dev convenience,
    // and a fallback if SMTP is ever misconfigured) - see config/mailer.ts for the send itself.
    console.log(`[auth] Password reset requested for ${user.email}`);
    console.log(`[auth] Reset link: ${resetLink}`);

    await sendMail({
      to: user.email,
      subject: 'Reset your Task Matrix password',
      html: `<p>Someone requested a password reset for your Task Matrix account.</p>
             <p><a href="${resetLink}">Click here to reset your password</a> (expires in 1 hour).</p>
             <p>If you didn't request this, you can safely ignore this email.</p>`,
    });
  },

  // Handles the actual password reset once the user clicks the emailed link and submits a new password.
  async resetPassword(input: ResetPasswordInput) {
    const tokenHash = hashToken(input.token);
    const stored = await PasswordResetToken.findOne({ tokenHash });
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired reset link');
    }

    const user = await User.findById(stored.userId);
    if (!user || !user.isActive) throw AppError.badRequest('Invalid or expired reset link');

    // Same virtual-setter pattern used everywhere else a password gets set (login/register/create) -
    // assigning `.password` triggers the pre('validate') hook to hash it before saving.
    (user as any).password = input.password;
    await user.save();

    // One-time use: mark this token spent so the same link can't be replayed.
    stored.usedAt = new Date();
    await stored.save();

    // Revoke every other active session too - if someone else had a stolen refresh token, this
    // password reset is exactly the moment to kick them out.
    await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
  },
};