import { AppDataSource } from '../config/database';
import { env } from '../config/env';
import { User, UserRole } from '../entities/User.entity';
import { hashPassword } from '../utils/password';
import { logger } from '../utils/logger';

export const seedAdmin = async (): Promise<void> => {
  const userRepo = AppDataSource.getRepository(User);

  const existingAdmin = await userRepo.findOne({
    where: { email: env.ADMIN_EMAIL },
  });

  const hashedPassword = await hashPassword(env.ADMIN_PASSWORD);

  if (existingAdmin) {
    existingAdmin.password = hashedPassword;
    existingAdmin.firstName = env.ADMIN_FIRST_NAME;
    existingAdmin.lastName = env.ADMIN_LAST_NAME;
    await userRepo.save(existingAdmin);
    logger.info('Admin user already exists, credentials updated from env.');
    return;
  }

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

  logger.info(`Admin user seeded successfully: ${env.ADMIN_EMAIL}`);
};
