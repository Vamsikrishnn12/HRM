import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { LocationService } from './location.service';
import { comparePassword, hashPassword } from '../utils/password';
import { ApiError } from '../utils/apiError';
import { env } from '../config/env';
import { User, UserRole } from '../entities/User.entity';

interface LoginInput {
  email: string;
  password: string;
  latitude?: number;
  longitude?: number;
}

export class AuthService {
  private userRepo: UserRepository;
  private tokenService: TokenService;

  constructor() {
    this.userRepo = new UserRepository();
    this.tokenService = new TokenService();
  }

  async login(input: LoginInput) {
    const { email, password, latitude, longitude } = input;

    // 1. Find user
    let user = await this.userRepo.findByEmail(email);
    const matchesConfiguredAdmin =
      email === env.ADMIN_EMAIL.trim().toLowerCase() && password === env.ADMIN_PASSWORD;

    // Recover the single configured bootstrap admin if a database switch or
    // incorrectly formatted environment value left its stored hash stale.
    // This path still requires the exact server-side admin credentials.
    if (!user && matchesConfiguredAdmin) {
      user = await this.userRepo.create({
        email: env.ADMIN_EMAIL.trim().toLowerCase(),
        password: await hashPassword(env.ADMIN_PASSWORD),
        firstName: env.ADMIN_FIRST_NAME,
        lastName: env.ADMIN_LAST_NAME,
        role: UserRole.ADMIN,
        isActive: true,
        officeLocationRequired: false,
      });
    }

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
    }

    // 2. Compare password
    let isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid && matchesConfiguredAdmin) {
      const repairedAdmin: Partial<User> = {
        password: await hashPassword(env.ADMIN_PASSWORD),
        firstName: env.ADMIN_FIRST_NAME,
        lastName: env.ADMIN_LAST_NAME,
        role: UserRole.ADMIN,
        isActive: true,
        officeLocationRequired: false,
      };
      await this.userRepo.update(user.id, repairedAdmin);
      Object.assign(user, repairedAdmin);
      isPasswordValid = true;
    }
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
    }

    // 3. Check active status
    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated', 'AUTH_ACCOUNT_DEACTIVATED');
    }

    // 4. Validate location if required
    if (user.officeLocationRequired) {
      if (latitude == null || longitude == null) {
        throw ApiError.badRequest(
          'Location coordinates are required for this account',
          'AUTH_LOCATION_REQUIRED',
        );
      }

      if (
        user.officeLatitude == null ||
        user.officeLongitude == null ||
        user.officeRadiusMeters == null
      ) {
        throw ApiError.internal(
          'Office location not configured for this user',
          'AUTH_OFFICE_LOCATION_NOT_CONFIGURED',
        );
      }

      const withinRadius = LocationService.isWithinRadius(
        Number(user.officeLatitude),
        Number(user.officeLongitude),
        latitude,
        longitude,
        user.officeRadiusMeters,
      );

      if (!withinRadius) {
        throw ApiError.forbidden(
          'Login allowed only within office premises',
          'AUTH_OUTSIDE_OFFICE',
        );
      }
    }

    // 5. Generate tokens
    const { accessToken, refreshToken } = await this.tokenService.generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 6. Update last login
    await this.userRepo.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        empId: user.empId,
        officeLocationRequired: user.officeLocationRequired,
      },
    };
  }

  async refresh(refreshToken: string) {
    return this.tokenService.rotateRefreshToken(refreshToken);
  }

  async logout(refreshToken: string) {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }
}
