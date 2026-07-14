import { AppDataSource } from '../config/database';
import { env } from '../config/env';
import { User, UserRole } from '../entities/User.entity';
import { hashPassword } from '../utils/password';

export const seedAdmin = async (): Promise<void> => {
  const userRepo = AppDataSource.getRepository(User);

  const existingAdmin = await userRepo.findOne({
    where: { email: env.ADMIN_EMAIL },
  });

  if (existingAdmin) {
    return;
  }

  const hashedPassword = await hashPassword(env.ADMIN_PASSWORD);

  const admin = userRepo.create({
    email: env.ADMIN_EMAIL,
    password: hashedPassword,
    firstName: env.ADMIN_FIRST_NAME,
    lastName: env.ADMIN_LAST_NAME,
    role: UserRole.ADMIN,
    isActive: true,
    officeLocationRequired: false,
  });

  await userRepo.save(admin);
};
