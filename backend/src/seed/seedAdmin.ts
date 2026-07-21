import { AppDataSource } from '../config/database';
import { env } from '../config/env';
import { User, UserRole } from '../entities/User.entity';
import { comparePassword, hashPassword } from '../utils/password';

export const seedAdmin = async (): Promise<void> => {
  const userRepo = AppDataSource.getRepository(User);

  const existingAdmin = await userRepo.findOne({
    where: { email: env.ADMIN_EMAIL },
  });

  if (existingAdmin) {
    const passwordMatches = await comparePassword(env.ADMIN_PASSWORD, existingAdmin.password);
    let changed = false;

    if (!passwordMatches) {
      existingAdmin.password = await hashPassword(env.ADMIN_PASSWORD);
      changed = true;
    }

    if (existingAdmin.firstName !== env.ADMIN_FIRST_NAME) {
      existingAdmin.firstName = env.ADMIN_FIRST_NAME;
      changed = true;
    }
    if (existingAdmin.lastName !== env.ADMIN_LAST_NAME) {
      existingAdmin.lastName = env.ADMIN_LAST_NAME;
      changed = true;
    }
    if (existingAdmin.role !== UserRole.ADMIN || !existingAdmin.isActive || existingAdmin.officeLocationRequired) {
      existingAdmin.role = UserRole.ADMIN;
      existingAdmin.isActive = true;
      existingAdmin.officeLocationRequired = false;
      changed = true;
    }

    if (changed) await userRepo.save(existingAdmin);
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
