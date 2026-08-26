import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marks a route as reachable without a JWT — login, refresh, and the health
// check are the only routes that should ever carry this.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
