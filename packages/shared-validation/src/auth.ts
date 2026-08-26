import { z } from 'zod';

// Shared between the NestJS backend (request DTO validation) and both
// frontends (React Hook Form resolvers) so the validation rule lives in
// exactly one place.
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
