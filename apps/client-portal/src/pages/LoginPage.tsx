import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { loginSchema, type LoginInput } from '@esg/shared-validation';
import { Button, Input, Label } from '@esg/ui';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

export function LoginPage() {
  const { login, status } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(input: LoginInput) {
    setServerError(null);
    try {
      await login(input);
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_A_CLIENT_ACCOUNT') {
        setServerError('NOT_A_CLIENT_ACCOUNT');
      } else {
        setServerError(err instanceof ApiError ? err.code : 'AUTH.INVALID_CREDENTIALS');
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a1628] p-6">
      <div className="w-full max-w-[420px] rounded-xl bg-white p-10 shadow-2xl">
        <h1 className="text-2xl font-bold text-[#0a1628]">Hong Kong Recycling Co</h1>
        <p className="mb-6 text-sm text-[#627288]">ESG Client Portal</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          {serverError && (
            <div role="alert" className="rounded-md bg-[var(--color-status-danger-bg)] p-3 text-sm text-[var(--color-status-danger-fg)]">
              {serverError === 'NOT_A_CLIENT_ACCOUNT'
                ? 'This account is not a client account. Please use the staff portal instead.'
                : 'The email or password you entered is incorrect.'}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="username"
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
                className="bg-[#f8fafc] pl-10"
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-[var(--color-status-danger-fg)]">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? 'true' : undefined}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
                className="bg-[#f8fafc] pl-10"
              />
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-[var(--color-status-danger-fg)]">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full py-6 text-[15px] font-semibold">
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      </div>
    </main>
  );
}
