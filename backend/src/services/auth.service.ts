import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { LocationService } from './location.service';
import { comparePassword } from '../utils/password';
import { ApiError } from '../utils/apiError';

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
    const user = await this.userRepo.findByEmail(email);
  
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
    }

    // 2. Compare password
    const isPasswordValid = await comparePassword(password, user.password);
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
