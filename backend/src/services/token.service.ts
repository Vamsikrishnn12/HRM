import { randomUUID } from 'crypto';
import { TokenRepository } from '../repositories/token.repository';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  AccessTokenPayload,
} from '../utils/jwt';
import { ApiError } from '../utils/apiError';

export class TokenService {
  private tokenRepo: TokenRepository;

  constructor() {
    this.tokenRepo = new TokenRepository();
  }

  /**
   * Generate access + refresh tokens, persist refresh token in DB.
   */
  async generateTokenPair(user: { id: string; email: string; role: string }) {
    const accessPayload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokenId = randomUUID();
    const accessToken = generateAccessToken(accessPayload);
    const refreshToken = generateRefreshToken({ userId: user.id, tokenId });

    // Persist refresh token – expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.tokenRepo.create({
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Rotate refresh token: verify + revoke old, issue new pair.
   */
  async rotateRefreshToken(oldRefreshToken: string) {
    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'AUTH_REFRESH_INVALID');
    }

    const storedToken = await this.tokenRepo.findById(payload.tokenId);

    if (!storedToken || storedToken.isRevoked) {
      // Possible token reuse attack – revoke all tokens for this user
      await this.tokenRepo.revokeAllUserTokens(payload.userId);
      throw ApiError.unauthorized('Refresh token has been revoked', 'AUTH_REFRESH_REVOKED');
    }

    if (storedToken.token !== oldRefreshToken) {
      throw ApiError.unauthorized('Invalid refresh token', 'AUTH_REFRESH_INVALID');
    }

    // Revoke the old token
    await this.tokenRepo.revokeToken(storedToken.id);

    // Generate new pair
    const user = storedToken.user;
    return this.generateTokenPair({ id: user.id, email: user.email, role: user.role });
  }

  /**
   * Revoke a specific refresh token (logout).
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      // Token may be expired, still try to revoke by value
      return;
    }

    const storedToken = await this.tokenRepo.findById(payload.tokenId);
    if (storedToken && !storedToken.isRevoked) {
      await this.tokenRepo.revokeToken(storedToken.id);
    }
  }

  /**
   * Revoke all refresh tokens for a user.
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepo.revokeAllUserTokens(userId);
  }
}
