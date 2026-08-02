import { z } from 'zod';

export const grantHrAccessSchema = z.object({
  employeeId: z.string().uuid('Select a valid employee'),
  loginEmail: z.string().email('Enter a valid HR login email').trim().toLowerCase(),
  password: z.string().min(8, 'Password must contain at least 8 characters').max(128),
});
