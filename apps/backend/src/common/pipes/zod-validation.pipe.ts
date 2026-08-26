import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

// Bridges the shared Zod schemas (packages/shared-validation) into Nest's
// pipe system, so request validation and frontend form validation stay on
// the exact same rule definitions instead of drifting apart.
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION.FAILED',
        issues: result.error.issues.map((i) => ({ path: i.path, message: i.message })),
      });
    }
    return result.data;
  }
}
