import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@esg/shared-validation';
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
    return <Navigate to="/work-orders" replace />;
  }

  async function onSubmit(input: LoginInput) {
    setServerError(null);
    try {
      await login(input);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.code : 'AUTH.INVALID_CREDENTIALS');
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-navy-950)',
      }}
    >
      <div style={{ background: 'var(--color-surface-card)', borderRadius: 12, padding: '2.5rem', width: 420 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Wing Kai Recycle</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: '1.5rem' }}>ESG Auditing Portal</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && (
            <div role="alert" style={{ color: 'var(--color-status-danger-fg)', marginBottom: '1rem' }}>
              {serverError === 'AUTH.INVALID_CREDENTIALS'
                ? 'The email or password you entered is incorrect.'
                : 'Something went wrong. Please try again.'}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
              Corporate Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--color-border-placeholder)',
                borderRadius: 6,
                background: 'var(--color-surface-input)',
              }}
            />
            {errors.email && (
              <p id="email-error" style={{ color: 'var(--color-status-danger-fg)', fontSize: '0.85rem' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? 'true' : undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--color-border-placeholder)',
                borderRadius: 6,
                background: 'var(--color-surface-input)',
              }}
            />
            {errors.password && (
              <p id="password-error" style={{ color: 'var(--color-status-danger-fg)', fontSize: '0.85rem' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.7rem',
              background: 'var(--color-action-green)',
              color: 'var(--color-text-on-dark)',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
