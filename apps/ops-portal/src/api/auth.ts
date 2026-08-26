import type { CurrentUserDto, LoginResponseDto } from '@esg/shared-types';
import type { LoginInput } from '@esg/shared-validation';
import { apiFetch } from './client';

export function login(input: LoginInput): Promise<LoginResponseDto> {
  return apiFetch<LoginResponseDto>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchCurrentUser(): Promise<CurrentUserDto> {
  return apiFetch<CurrentUserDto>('/users/me');
}
