import { z } from 'zod';

export const checkoutSchema = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course'),
});

export const adminUsersQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: z.enum(['student', 'admin']).optional(),
  active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const updateUserSchema = z
  .object({
    role: z.enum(['student', 'admin']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isActive !== undefined, {
    message: 'Provide at least one field to update',
  });

export const updateRoleSchema = z.object({
  role: z.enum(['student', 'admin']),
});

export const demoConfirmSchema = z.object({
  orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order'),
});
