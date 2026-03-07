import { z } from 'zod';

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  mobileNumber: z.string().max(15).optional(),
  whatsappNumber: z.string().max(15).optional(),
  currentAddressLine1: z.string().max(255).optional(),
  currentCity: z.string().max(100).optional(),
  currentState: z.string().max(100).optional(),
  currentPincode: z.string().max(10).optional(),
  currentCountry: z.string().max(100).optional(),
  emergencyContactNumber: z.string().max(15).optional(),
  emergencyContactPerson: z.string().max(100).optional(),
  emergencyContactRelationship: z.string().max(50).optional(),
});
